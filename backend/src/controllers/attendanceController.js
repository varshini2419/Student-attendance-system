const Attendance = require('../models/Attendance');
const AttendanceSession = require('../models/AttendanceSession');
const Student = require('../models/Student');
const xlsx = require('xlsx');

// Helper to get local date string YYYY-MM-DD
const getLocalDateString = (dateInput = new Date()) => {
  return new Date(dateInput).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
};

// @desc    Mark attendance manually
// @route   POST /api/attendance/manual
// @access  Private (Admin & Faculty)
exports.markAttendance = async (req, res) => {
  try {
    const { studentId, date, status } = req.body;

    if (!studentId || !date || !status) {
      return res.status(400).json({
        success: false,
        message: 'Please provide studentId, date and status'
      });
    }

    const student = await Student.findById(studentId);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    let attendance = await Attendance.findOne({
      student: studentId,
      date
    });

    if (attendance) {
      attendance.status = status;
      attendance.markedBy = req.user._id;
      await attendance.save();
    } else {
      attendance = await Attendance.create({
        student: studentId,
        date,
        status,
        markedBy: req.user._id
      });
    }

    res.status(200).json({
      success: true,
      message: `Attendance marked as ${status} successfully`,
      data: attendance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Temporal session tracker to require 3 consecutive frames
const temporalTracker = {};

// @desc    Mark attendance via Face Recognition
// @route   POST /api/attendance/mark-face
// @access  Private (Admin & Faculty)
exports.markAttendanceByFace = async (req, res) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a camera frame image'
      });
    }

    const { postToAi } = require('../utils/aiClient');
    let result;

    try {
      result = await postToAi('/api/recognize', { image }, 1);

      if (!result || !result.success) {
        return res.status(500).json({
          success: false,
          message: result?.message || 'Face recognition service error'
        });
      }

      if (!result.faces || result.faces.length === 0) {
        return res.status(200).json({
          success: true,
          faces: [],
          message: result.message || 'No face detected in webcam feed.'
        });
      }

      const todayStr = getLocalDateString();
      const processedFaces = [];

      for (const face of result.faces) {
        if (!face.matched) {
          processedFaces.push({
            ...face,
            status: 'unknown'
          });
          continue;
        }

        const student = await Student.findById(face.student_id);

        if (!student) {
          processedFaces.push({
            ...face,
            matched: false,
            status: 'unknown'
          });
          continue;
        }

        const existingRecord = await Attendance.findOne({
          student: student._id,
          date: todayStr
        });

        let alreadyMarked = false;

        if (existingRecord && existingRecord.status === 'Present') {
          alreadyMarked = true;

          processedFaces.push({
            ...face,
            status: 'recognized',
            alreadyMarked: true,
            student: {
              id: student._id,
              name: student.name,
              rollNumber: student.rollNumber,
              branch: student.branch,
              section: student.section
            }
          });

          continue;
        }

        const now = Date.now();
        const studentIdStr = student._id.toString();

        if (!temporalTracker[studentIdStr]) {
          temporalTracker[studentIdStr] = {
            count: 1,
            lastSeen: now
          };
        } else {
          if (now - temporalTracker[studentIdStr].lastSeen > 5000) {
            temporalTracker[studentIdStr] = {
              count: 1,
              lastSeen: now
            };
          } else {
            temporalTracker[studentIdStr].count += 1;
            temporalTracker[studentIdStr].lastSeen = now;
          }
        }

        const currentCount = temporalTracker[studentIdStr].count;

        if (currentCount < 3) {
          processedFaces.push({
            ...face,
            status: 'validating',
            validationProgress: Math.round(
              (currentCount / 3) * 100
            ),
            student: {
              id: student._id,
              name: student.name,
              rollNumber: student.rollNumber
            }
          });

          continue;
        }

        if (existingRecord) {
          existingRecord.status = 'Present';
          existingRecord.markedBy = req.user._id;
          existingRecord.timestamp = new Date();

          await existingRecord.save();
        } else {
          await Attendance.create({
            student: student._id,
            date: todayStr,
            status: 'Present',
            markedBy: req.user._id
          });
        }

        processedFaces.push({
          ...face,
          status: 'recognized',
          alreadyMarked,
          student: {
            id: student._id,
            name: student.name,
            rollNumber: student.rollNumber,
            branch: student.branch,
            section: student.section
          }
        });
      }

      return res.status(200).json({
        success: true,
        faces: processedFaces,
        message: `Processed ${processedFaces.length} faces`
      });
    } catch (aiError) {
      console.error(
        'AI Service Connection Error:',
        aiError.message
      );

      return res.status(502).json({
        success: false,
        message:
          aiError.message ||
          'Could not connect to the AI Face Service. Please check if the Python AI service is running.'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Helper for Cosine Distance
const cosineDistance = (v1, v2) => {
  let dotProduct = 0.0;
  let norm1 = 0.0;
  let norm2 = 0.0;

  for (let i = 0; i < v1.length; i++) {
    dotProduct += v1[i] * v2[i];
    norm1 += v1[i] * v1[i];
    norm2 += v2[i] * v2[i];
  }

  if (norm1 === 0 || norm2 === 0) {
    return 1.0;
  }

  return (
    1.0 -
    dotProduct /
      (Math.sqrt(norm1) * Math.sqrt(norm2))
  );
};

// @desc    Mark attendance via Face Recognition
// @route   POST /api/attendance/recognize
// @access  Private (Admin & Faculty)
exports.recognizeFace = async (req, res) => {
  try {
    const { image, sessionId } = req.body;

    if (!image || !sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an image and sessionId'
      });
    }

    const session = await AttendanceSession.findById(sessionId);

    if (!session || session.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Invalid or inactive session'
      });
    }

    console.log('[ATTENDANCE SCAN]');

    const { postToAi } = require('../utils/aiClient');

    let result;

    try {
      result = await postToAi(
        '/api/recognize',
        { image },
        1
      );
    } catch (aiError) {
      console.error(
        'AI Service Connection Error:',
        aiError.message
      );

      return res.status(502).json({
        success: false,
        message:
          aiError.message ||
          'Could not connect to the AI Face Service.'
      });
    }

    if (
      !result ||
      !result.success ||
      !result.faces ||
      result.faces.length === 0
    ) {
      return res.status(200).json({
        faceDetected: false,
        matched: false,
        message: 'No face detected'
      });
    }

    console.log('[FACE DETECTED]');

    const face = result.faces[0];

    if (
      !face.embedding ||
      face.embedding.length !== 128
    ) {
      return res.status(200).json({
        faceDetected: true,
        matched: false,
        message: 'Invalid face embedding'
      });
    }

    const students = await Student.find(
      {
        embeddings: {
          $exists: true,
          $not: { $size: 0 }
        }
      },
      {
        _id: 1,
        name: 1,
        rollNumber: 1,
        embeddings: 1
      }
    );

    let bestMatch = null;
    let bestDistance = 0.64;
    let closestObserved = 1.0;

    for (const student of students) {
      if (
        !student.embeddings ||
        student.embeddings.length === 0
      ) {
        continue;
      }

      for (const refEmbedding of student.embeddings) {
        const dist = cosineDistance(
          face.embedding,
          refEmbedding
        );

        if (dist < closestObserved) {
          closestObserved = dist;
        }

        if (dist < bestDistance) {
          bestDistance = dist;
          bestMatch = student;
        }
      }
    }

    console.log(
      `[FACE MATCHING] Closest distance found: ${closestObserved.toFixed(
        3
      )}`
    );

    if (!bestMatch) {
      return res.status(200).json({
        faceDetected: true,
        matched: false,
        message: `Face not matched (Closest: ${closestObserved.toFixed(
          3
        )})`
      });
    }

    console.log(
      `[STUDENT MATCHED] Found ${bestMatch.name} with distance ${bestDistance.toFixed(
        3
      )}`
    );

    const todayStr = getLocalDateString();

    const existingRecord = await Attendance.findOne({
      student: bestMatch._id,
      session: session._id
    });

    // Convert distance to confidence
    const confidence = Math.max(
      0,
      1 - bestDistance / 0.64
    );

    // FACE MATCH THRESHOLD: 50%
    const MATCH_THRESHOLD =
      parseFloat(process.env.MATCH_THRESHOLD) || 0.50;

    if (confidence < MATCH_THRESHOLD) {
      const thresholdPercent = Math.round(
        MATCH_THRESHOLD * 100
      );

      return res.status(200).json({
        faceDetected: true,
        matched: false,
        confidence,
        message: `Face match is below ${thresholdPercent}%. Please align your face and try again.`
      });
    }

    if (
      existingRecord &&
      existingRecord.status === 'Present'
    ) {
      return res.status(200).json({
        faceDetected: true,
        matched: true,
        studentId: bestMatch._id,
        name: bestMatch.name,
        confidence,
        message: 'Already marked present today'
      });
    }

    const attendanceRecord = await Attendance.create({
      student: bestMatch._id,
      session: session._id,
      date: todayStr,
      status: 'Present',
      detectedTime: new Date().toLocaleTimeString(
        'en-IN',
        {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit'
        }
      ),
      markedBy: req.user._id
    });

    console.log(
      `[MARKED PRESENT] ${bestMatch.name}`
    );

    // Screenshot saving logic
    try {
      const fs = require('fs');
      const path = require('path');

      const screenshotsDir = path.join(
        __dirname,
        '../../public/screenshots'
      );

      if (!fs.existsSync(screenshotsDir)) {
        fs.mkdirSync(screenshotsDir, {
          recursive: true
        });
      }

      const fileName =
        `${bestMatch._id}_${session._id}_${attendanceRecord._id}.jpg`;

      const filePath = path.join(
        screenshotsDir,
        fileName
      );

      const base64Data = image.replace(
        /^data:image\/\w+;base64,/,
        ''
      );

      await fs.promises.writeFile(
        filePath,
        base64Data,
        'base64'
      );

      attendanceRecord.screenshotUrl =
        `/screenshots/${fileName}`;

      await attendanceRecord.save();

      console.log(
        `[SCREENSHOT SAVED] ${fileName}`
      );
    } catch (screenshotError) {
      console.error(
        '[SCREENSHOT ERROR]',
        screenshotError
      );
    }

    return res.status(200).json({
      faceDetected: true,
      matched: true,
      studentId: bestMatch._id,
      name: bestMatch.name,
      confidence,
      message: 'Attendance marked successfully'
    });
  } catch (error) {
    console.error(
      '[RECOGNIZE FACE ERROR]',
      error
    );

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get attendance logs
// @route   GET /api/attendance/logs
// @access  Private (Admin & Faculty)
exports.getAttendanceLogs = async (req, res) => {
  try {
    const {
      date,
      rollNumber,
      branch,
      section,
      startDate,
      endDate
    } = req.query;

    let studentQuery = {};

    if (rollNumber) {
      studentQuery.rollNumber =
        rollNumber.toUpperCase();
    }

    if (branch) {
      studentQuery.branch = branch;
    }

    if (section) {
      studentQuery.section =
        section.toUpperCase();
    }

    let studentIds = [];

    if (Object.keys(studentQuery).length > 0) {
      const students = await Student.find(
        studentQuery
      ).select('_id');

      studentIds = students.map(
        (s) => s._id
      );

      if (studentIds.length === 0) {
        return res.status(200).json({
          success: true,
          count: 0,
          data: []
        });
      }
    }

    let attendanceQuery = {};

    if (studentIds.length > 0) {
      attendanceQuery.student = {
        $in: studentIds
      };
    }

    if (date) {
      attendanceQuery.date = date;
    } else if (startDate && endDate) {
      attendanceQuery.date = {
        $gte: startDate,
        $lte: endDate
      };
    }

    const logs = await Attendance.find(
      attendanceQuery
    )
      .populate(
        'student',
        'name rollNumber branch section email'
      )
      .populate(
        'markedBy',
        'name email role'
      )
      .sort({ timestamp: -1 });

    res.status(200).json({
      success: true,
      count: logs.length,
      data: logs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get dashboard statistics
// @route   GET /api/attendance/dashboard
// @access  Private
exports.getDashboardStats = async (req, res) => {
  try {
    const todayStr = getLocalDateString();

    const totalStudents =
      await Student.countDocuments({});

    const presentToday =
      await Attendance.countDocuments({
        date: todayStr,
        status: 'Present'
      });

    const absentToday = Math.max(
      0,
      totalStudents - presentToday
    );

    const attendancePercentage =
      totalStudents > 0
        ? Math.round(
            (presentToday / totalStudents) *
              100
          )
        : 0;

    const recentLogs = await Attendance.find({
      date: todayStr
    })
      .populate(
        'student',
        'name rollNumber branch section'
      )
      .sort({ timestamp: -1 })
      .limit(5);

    const trends = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();

      d.setDate(d.getDate() - i);

      const dateStr =
        getLocalDateString(d);

      const presentCount =
        await Attendance.countDocuments({
          date: dateStr,
          status: 'Present'
        });

      const dayLabel =
        d.toLocaleDateString(
          'en-US',
          {
            weekday: 'short'
          }
        );

      trends.push({
        date: dateStr,
        label: dayLabel,
        present: presentCount,
        absent: Math.max(
          0,
          totalStudents - presentCount
        ),
        rate:
          totalStudents > 0
            ? Math.round(
                (presentCount /
                  totalStudents) *
                  100
              )
            : 0
      });
    }

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalStudents,
          presentToday,
          absentToday,
          attendancePercentage
        },
        recentLogs,
        trends
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ==========================================
// SESSION MANAGEMENT CONTROLLERS
// ==========================================

// @desc    Start a new attendance session
// @route   POST /api/attendance/session/start
// @access  Private
exports.startSession = async (req, res) => {
  try {
    const todayStr =
      getLocalDateString();

    const todaySessions =
      await AttendanceSession.countDocuments({
        date: todayStr
      });

    const sessionId =
      `SESSION_${todayStr.replace(
        /-/g,
        ''
      )}_${todaySessions + 1}`;

    const newSession =
      await AttendanceSession.create({
        sessionId,
        date: todayStr,
        status: 'active',
        markedBy: req.user._id
      });

    console.log(
      `[SESSION STARTED] ${sessionId}`
    );

    res.status(201).json({
      success: true,
      data: newSession
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Stop active session and generate Absents
// @route   POST /api/attendance/session/stop
// @access  Private
exports.stopSession = async (req, res) => {
  try {
    const { sessionId } = req.body;

    const session =
      await AttendanceSession.findById(
        sessionId
      );

    if (
      !session ||
      session.status !== 'active'
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Invalid or already completed session'
      });
    }

    session.status = 'completed';
    session.endTime = new Date();

    await session.save();

    const presentRecords =
      await Attendance.find({
        session: session._id,
        status: 'Present'
      }).select('student');

    const presentStudentIds =
      presentRecords.map((r) =>
        r.student.toString()
      );

    const missingStudents =
      await Student.find({
        _id: {
          $nin: presentStudentIds
        }
      });

    const absentDocs =
      missingStudents.map((student) => ({
        student: student._id,
        session: session._id,
        date: session.date,
        status: 'Absent',
        detectedTime: '-',
        markedBy: req.user._id
      }));

    if (absentDocs.length > 0) {
      await Attendance.insertMany(
        absentDocs
      );
    }

    console.log(
      `[SESSION STOPPED] Total Present: ${presentStudentIds.length}, Total Absent: ${absentDocs.length}`
    );

    const ExcelJS =
      require('exceljs');

    const workbook =
      new ExcelJS.Workbook();

    const worksheet =
      workbook.addWorksheet(
        'Attendance Report'
      );

    const records =
      await Attendance.find({
        session: session._id
      })
        .populate(
          'student',
          'name rollNumber'
        )
        .sort({
          status: -1,
          detectedTime: 1
        });

    worksheet.columns = [
      {
        header: 'Roll No',
        key: 'rollNo',
        width: 18
      },
      {
        header: 'Student Name',
        key: 'studentName',
        width: 25
      },
      {
        header: 'Status',
        key: 'status',
        width: 15
      },
      {
        header: 'Detection Time',
        key: 'detectionTime',
        width: 18
      },
      {
        header: 'Session ID',
        key: 'sessionId',
        width: 22
      },
      {
        header: 'Screenshot Reference',
        key: 'screenshot',
        width: 25
      }
    ];

    worksheet.getRow(1).font = {
      bold: true
    };

    const fs = require('fs');
    const path = require('path');

    records.forEach((record) => {
      const dataRow =
        worksheet.addRow({
          rollNo:
            record.student
              ? record.student.rollNumber
              : 'Unknown',
          studentName:
            record.student
              ? record.student.name
              : 'Unknown',
          status: record.status,
          detectionTime:
            record.status === 'Present'
              ? new Date(record.timestamp).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' })
              : '-',
          sessionId: session.sessionId,
          screenshot:
            record.screenshotUrl ||
            'N/A'
        });

      dataRow.height = 20;

      if (record.screenshotUrl) {
        try {
          const filename =
            record.screenshotUrl
              .split('/')
              .pop();

          const imagePath =
            path.join(
              __dirname,
              '../../public/screenshots',
              filename
            );

          if (fs.existsSync(imagePath)) {
            const imageId =
              workbook.addImage({
                filename: imagePath,
                extension: 'jpeg'
              });

            worksheet.addImage(
              imageId,
              {
                tl: {
                  col: 5,
                  row:
                    dataRow.number - 1
                },
                ext: {
                  width: 40,
                  height: 40
                }
              }
            );

            dataRow.height = 45;
            dataRow.getCell(6).value = '';
          }
        } catch (err) {
          console.error(
            'Failed to embed screenshot:',
            err
          );
        }
      }
    });

    const reportsDir =
      path.join(
        __dirname,
        '../../public/reports'
      );

    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, {
        recursive: true
      });
    }

    const fileName =
      `${session.sessionId}_Attendance.xlsx`;

    const filePath =
      path.join(
        reportsDir,
        fileName
      );

    await workbook.xlsx.writeFile(
      filePath
    );

    console.log(
      `[EXCEL GENERATED] ${filePath}`
    );

    res.status(200).json({
      success: true,
      sessionId: session.sessionId,
      presentCount:
        presentStudentIds.length,
      absentCount:
        absentDocs.length,
      excelUrl:
        `/reports/${fileName}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get session report
// @route   GET /api/attendance/session/:id/report
// @access  Private
exports.getSessionReport = async (
  req,
  res
) => {
  try {
    const session =
      await AttendanceSession.findById(
        req.params.id
      );

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    const records =
      await Attendance.find({
        session: session._id
      })
        .populate(
          'student',
          'name rollNumber branch section'
        )
        .sort({
          status: -1,
          detectedTime: 1
        });

    res.status(200).json({
      success: true,
      session,
      records
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Generate Excel for a session
// @route   GET /api/attendance/session/:id/excel
// @access  Private
exports.downloadSessionExcel =
  async (req, res) => {
    try {
      const session =
        await AttendanceSession.findById(
          req.params.id
        );

      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Session not found'
        });
      }

      const records =
        await Attendance.find({
          session: session._id
        })
          .populate(
            'student',
            'name rollNumber'
          )
          .sort({
            status: -1,
            detectedTime: 1
          });

      const ExcelJS =
        require('exceljs');

      const workbook =
        new ExcelJS.Workbook();

      const worksheet =
        workbook.addWorksheet(
          'Attendance Report'
        );

      worksheet.columns = [
        {
          header: 'Session ID',
          key: 'sessionId',
          width: 22
        },
        {
          header: 'Date',
          key: 'date',
          width: 15
        },
        {
          header: 'Roll No',
          key: 'rollNo',
          width: 18
        },
        {
          header: 'Student Name',
          key: 'studentName',
          width: 25
        },
        {
          header: 'Status',
          key: 'status',
          width: 15
        },
        {
          header: 'Detected Time',
          key: 'detectedTime',
          width: 18
        },
        {
          header: 'Screenshot Reference',
          key: 'screenshot',
          width: 25
        }
      ];

      worksheet.getRow(1).font = {
        bold: true
      };

      const fs = require('fs');
      const path = require('path');

      records.forEach((record) => {
        const dataRow =
          worksheet.addRow({
            sessionId:
              session.sessionId,
            date: session.date,
            rollNo:
              record.student
                ? record.student.rollNumber
                : 'Unknown',
            studentName:
              record.student
                ? record.student.name
                : 'Unknown',
            status: record.status,
            detectedTime:
              record.status ===
              'Present'
                ? record.detectedTime
                : '-',
            screenshot:
              record.screenshotUrl ||
              'N/A'
          });

        dataRow.height = 20;

        if (record.screenshotUrl) {
          try {
            const filename =
              record.screenshotUrl
                .split('/')
                .pop();

            const imagePath =
              path.join(
                __dirname,
                '../../public/screenshots',
                filename
              );

            if (
              fs.existsSync(imagePath)
            ) {
              const imageId =
                workbook.addImage({
                  filename:
                    imagePath,
                  extension: 'jpeg'
                });

              worksheet.addImage(
                imageId,
                {
                  tl: {
                    col: 6,
                    row:
                      dataRow.number -
                      1
                  },
                  ext: {
                    width: 40,
                    height: 40
                  }
                }
              );

              dataRow.height = 45;
              dataRow.getCell(7).value =
                '';
            }
          } catch (err) {
            console.error(
              'Failed to embed screenshot:',
              err
            );
          }
        }
      });

      const buffer =
        await workbook.xlsx.writeBuffer();

      console.log(
        '[EXCEL GENERATED]'
      );

      res.setHeader(
        'Content-Disposition',
        `attachment; filename=${session.sessionId}_Report.xlsx`
      );

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );

      res.send(buffer);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };

// @desc    Clear active session data
// @route   DELETE /api/attendance/session/active
// @access  Private
exports.clearActiveSession =
  async (req, res) => {
    try {
      const { sessionId } =
        req.body;

      if (!sessionId) {
        return res.status(400).json({
          success: false,
          message:
            'Session ID required'
        });
      }

      const session =
        await AttendanceSession.findById(
          sessionId
        );

      if (
        !session ||
        session.status !== 'active'
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Invalid or completed session cannot be cleared'
        });
      }

      await Attendance.deleteMany({
        session: session._id
      });

      await AttendanceSession.findByIdAndDelete(
        session._id
      );

      res.status(200).json({
        success: true,
        message:
          'Active session data cleared successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };