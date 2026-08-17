const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

// Helper to get local date string YYYY-MM-DD
const getLocalDateString = (dateInput = new Date()) => {
  const d = new Date(dateInput);
  const offset = d.getTimezoneOffset();
  const localDate = new Date(d.getTime() - offset * 60 * 1000);
  return localDate.toISOString().split('T')[0];
};

// Common function to query logs based on request filters
const queryAttendanceData = async (query) => {
  const { date, rollNumber, branch, section, startDate, endDate } = query;
  let studentQuery = {};

  if (rollNumber) studentQuery.rollNumber = rollNumber.toUpperCase();
  if (branch) studentQuery.branch = branch;
  if (section) studentQuery.section = section.toUpperCase();

  let studentIds = [];
  if (Object.keys(studentQuery).length > 0) {
    const students = await Student.find(studentQuery).select('_id');
    studentIds = students.map((s) => s._id);
    if (studentIds.length === 0) return [];
  }

  let attendanceQuery = {};
  if (studentIds.length > 0) attendanceQuery.student = { $in: studentIds };

  if (date) {
    attendanceQuery.date = date;
  } else if (startDate && endDate) {
    attendanceQuery.date = { $gte: startDate, $lte: endDate };
  }

  return await Attendance.find(attendanceQuery)
    .populate('student', 'name rollNumber branch section email')
    .populate('markedBy', 'name email role')
    .sort({ date: -1, timestamp: -1 });
};

// @desc    Download Excel attendance report
// @route   GET /api/reports/excel
// @access  Private (Admin & Faculty)
exports.downloadExcelReport = async (req, res) => {
  try {
    const logs = await queryAttendanceData(req.query);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Attendance Report');

    // Title and Meta Information
    worksheet.mergeCells('A1:G1');
    worksheet.getCell('A1').value = 'SMART CAMPUS ATTENDANCE SYSTEM - REPORT';
    worksheet.getCell('A1').font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFF' } };
    worksheet.getCell('A1').alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getCell('A1').fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '1E3A8A' } // Deep Blue
    };
    worksheet.getRow(1).height = 40;

    // Filter information
    worksheet.getCell('A2').value = `Generated On: ${new Date().toLocaleString()}`;
    worksheet.getCell('A2').font = { italic: true };
    
    let filterStr = 'Filters: None';
    const filters = [];
    if (req.query.date) filters.push(`Date: ${req.query.date}`);
    if (req.query.branch) filters.push(`Branch: ${req.query.branch}`);
    if (req.query.section) filters.push(`Section: ${req.query.section}`);
    if (req.query.startDate && req.query.endDate) filters.push(`Period: ${req.query.startDate} to ${req.query.endDate}`);
    if (filters.length > 0) filterStr = `Filters: ${filters.join(', ')}`;
    worksheet.getCell('A3').value = filterStr;
    worksheet.getCell('A3').font = { bold: true };
    worksheet.getRow(2).height = 18;
    worksheet.getRow(3).height = 18;

    // Summary Metrics
    const total = logs.length;
    const present = logs.filter(l => l.status === 'Present').length;
    const absent = total - present;
    const rate = total > 0 ? `${Math.round((present / total) * 100)}%` : '0%';

    worksheet.getCell('A5').value = `Total Records: ${total}`;
    worksheet.getCell('B5').value = `Present: ${present}`;
    worksheet.getCell('C5').value = `Absent: ${absent}`;
    worksheet.getCell('D5').value = `Attendance Rate: ${rate}`;
    worksheet.getRow(5).font = { bold: true, color: { argb: '1E3A8A' } };

    // Columns Definition
    const headerRow = 7;
    const columns = [
      { header: 'S.No', key: 'sno', width: 8 },
      { header: 'Roll Number', key: 'rollNumber', width: 18 },
      { header: 'Student Name', key: 'name', width: 25 },
      { header: 'Branch', key: 'branch', width: 15 },
      { header: 'Section', key: 'section', width: 12 },
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Marked At', key: 'markedAt', width: 20 },
      { header: 'Marked By', key: 'markedBy', width: 20 },
      { header: 'Screenshot Reference', key: 'screenshotUrl', width: 25 }
    ];

    worksheet.columns = columns.map(col => ({
      key: col.key,
      width: col.width
    }));

    // Style the Table Header
    const row = worksheet.getRow(headerRow);
    columns.forEach((col, idx) => {
      const cell = row.getCell(idx + 1);
      cell.value = col.header;
      cell.font = { bold: true, color: { argb: 'FFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '2563EB' } // Royal Blue
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'medium' },
        right: { style: 'thin' }
      };
    });
    row.height = 25;

    // Add Data Rows
    logs.forEach((log, index) => {
      const dataRow = worksheet.addRow({
        sno: index + 1,
        rollNumber: log.student.rollNumber,
        name: log.student.name,
        branch: log.student.branch,
        section: log.student.section,
        date: log.date,
        status: log.status,
        markedAt: new Date(log.timestamp).toLocaleTimeString(),
        markedBy: log.markedBy ? `${log.markedBy.name} (${log.markedBy.role})` : 'System',
        screenshotUrl: log.screenshotUrl || 'N/A'
      });

      // Style Status cell
      const statusCell = dataRow.getCell(7);
      if (log.status === 'Present') {
        statusCell.font = { color: { argb: '15803D' }, bold: true }; // Green
      } else {
        statusCell.font = { color: { argb: 'B91C1C' }, bold: true }; // Red
      }

      // Add borders to all cells in the row
      for (let i = 1; i <= columns.length; i++) {
        const cell = dataRow.getCell(i);
        cell.alignment = { vertical: 'middle', horizontal: i === 3 ? 'left' : 'center' };
        cell.border = {
          top: { style: 'thin', color: { argb: 'E5E7EB' } },
          left: { style: 'thin', color: { argb: 'E5E7EB' } },
          bottom: { style: 'thin', color: { argb: 'E5E7EB' } },
          right: { style: 'thin', color: { argb: 'E5E7EB' } }
        };
      }
      dataRow.height = 20;

      if (log.screenshotUrl) {
        try {
          const fs = require('fs');
          const path = require('path');
          const filename = log.screenshotUrl.split('/').pop();
          const imagePath = path.join(__dirname, '../../public/screenshots', filename);
          
          if (fs.existsSync(imagePath)) {
            const imageId = workbook.addImage({
              filename: imagePath,
              extension: 'jpeg'
            });
            worksheet.addImage(imageId, {
              tl: { col: 9, row: dataRow.number - 1 },
              ext: { width: 40, height: 40 }
            });
            dataRow.height = 45; // Increase row height for the image
            dataRow.getCell(10).value = ''; // Remove the text URL
          }
        } catch (err) {
          console.error("Failed to embed screenshot in Excel:", err);
          // Fallback is leaving the text URL intact
        }
      }
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=Attendance_Report_${getLocalDateString()}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Download PDF attendance report
// @route   GET /api/reports/pdf
// @access  Private (Admin & Faculty)
exports.downloadPdfReport = async (req, res) => {
  try {
    const logs = await queryAttendanceData(req.query);

    const doc = new PDFDocument({ margin: 30, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=Attendance_Report_${getLocalDateString()}.pdf`
    );

    doc.pipe(res);

    // Header Panel (Blue banner)
    doc.rect(30, 30, 535, 60).fill('#1E3A8A');
    doc.fillColor('#FFFFFF')
       .fontSize(18)
       .font('Helvetica-Bold')
       .text('SMART CAMPUS ATTENDANCE SYSTEM', 40, 42)
       .fontSize(10)
       .font('Helvetica')
       .text('Official Attendance Sheet & Metrics Report', 40, 68);

    // Meta-data Block
    doc.fillColor('#374151')
       .fontSize(9)
       .text(`Generated: ${new Date().toLocaleString()}`, 400, 42, { align: 'right' });

    let filterStr = 'Filters: None';
    const filters = [];
    if (req.query.date) filters.push(`Date: ${req.query.date}`);
    if (req.query.branch) filters.push(`Branch: ${req.query.branch}`);
    if (req.query.section) filters.push(`Section: ${req.query.section}`);
    if (req.query.startDate && req.query.endDate) filters.push(`Period: ${req.query.startDate} to ${req.query.endDate}`);
    if (filters.length > 0) filterStr = `Filters: ${filters.join(', ')}`;

    doc.text(filterStr, 400, 68, { align: 'right' });

    // Summary Statistics Cards
    const total = logs.length;
    const present = logs.filter(l => l.status === 'Present').length;
    const absent = total - present;
    const rate = total > 0 ? `${Math.round((present / total) * 100)}%` : '0%';

    doc.rect(30, 105, 120, 45).fill('#F3F4F6');
    doc.rect(170, 105, 120, 45).fill('#F3F4F6');
    doc.rect(310, 105, 120, 45).fill('#F3F4F6');
    doc.rect(450, 105, 115, 45).fill('#F3F4F6');

    doc.fillColor('#1E3A8A').font('Helvetica-Bold').fontSize(12);
    doc.text(`${total}`, 40, 112);
    doc.text(`${present}`, 180, 112);
    doc.text(`${absent}`, 320, 112);
    doc.text(`${rate}`, 460, 112);

    doc.fillColor('#4B5563').font('Helvetica').fontSize(8);
    doc.text('TOTAL RECORDS', 40, 132);
    doc.text('PRESENT COUNT', 180, 132);
    doc.text('ABSENT COUNT', 320, 132);
    doc.text('ATTENDANCE RATE', 460, 132);

    // Table Header
    const tableTop = 170;
    doc.rect(30, tableTop, 535, 20).fill('#2563EB');
    
    doc.fillColor('#FFFFFF')
       .font('Helvetica-Bold')
       .fontSize(8);
    
    doc.text('S.No', 35, tableTop + 6, { width: 30, align: 'center' });
    doc.text('Roll Number', 70, tableTop + 6, { width: 80, align: 'center' });
    doc.text('Student Name', 160, tableTop + 6, { width: 120, align: 'left' });
    doc.text('Branch', 290, tableTop + 6, { width: 50, align: 'center' });
    doc.text('Sec', 345, tableTop + 6, { width: 25, align: 'center' });
    doc.text('Date', 375, tableTop + 6, { width: 60, align: 'center' });
    doc.text('Status', 440, tableTop + 6, { width: 45, align: 'center' });
    doc.text('Time', 490, tableTop + 6, { width: 70, align: 'center' });

    // Table Rows
    let y = tableTop + 20;
    doc.font('Helvetica').fontSize(8);

    logs.forEach((log, index) => {
      // Check if we need to add a page (leave room for footer)
      if (y > 750) {
        doc.addPage({ margin: 30, size: 'A4' });
        // Redraw Header on new page
        doc.rect(30, 30, 535, 20).fill('#2563EB');
        doc.fillColor('#FFFFFF')
           .font('Helvetica-Bold')
           .fontSize(8);
        
        doc.text('S.No', 35, 36, { width: 30, align: 'center' });
        doc.text('Roll Number', 70, 36, { width: 80, align: 'center' });
        doc.text('Student Name', 160, 36, { width: 120, align: 'left' });
        doc.text('Branch', 290, 36, { width: 50, align: 'center' });
        doc.text('Sec', 345, 36, { width: 25, align: 'center' });
        doc.text('Date', 375, 36, { width: 60, align: 'center' });
        doc.text('Status', 440, 36, { width: 45, align: 'center' });
        doc.text('Time', 490, 36, { width: 70, align: 'center' });

        y = 50;
        doc.font('Helvetica').fontSize(8);
      }

      // Zebra striping
      if (index % 2 === 0) {
        doc.rect(30, y, 535, 18).fill('#F9FAFB');
      } else {
        doc.rect(30, y, 535, 18).fill('#FFFFFF');
      }

      doc.fillColor('#374151');
      doc.text(`${index + 1}`, 35, y + 5, { width: 30, align: 'center' });
      doc.text(log.student.rollNumber, 70, y + 5, { width: 80, align: 'center' });
      doc.text(log.student.name, 160, y + 5, { width: 120, align: 'left' });
      doc.text(log.student.branch, 290, y + 5, { width: 50, align: 'center' });
      doc.text(log.student.section, 345, y + 5, { width: 25, align: 'center' });
      doc.text(log.date, 375, y + 5, { width: 60, align: 'center' });

      // Color coding Status
      if (log.status === 'Present') {
        doc.fillColor('#15803D').font('Helvetica-Bold');
      } else {
        doc.fillColor('#B91C1C').font('Helvetica-Bold');
      }
      doc.text(log.status, 440, y + 5, { width: 45, align: 'center' });
      
      doc.fillColor('#374151').font('Helvetica');
      doc.text(new Date(log.timestamp).toLocaleTimeString(), 490, y + 5, { width: 70, align: 'center' });

      // Draw bottom line border
      doc.strokeColor('#E5E7EB').lineWidth(0.5).moveTo(30, y + 18).lineTo(565, y + 18).stroke();

      y += 18;
    });

    // Add footer
    const pageCount = doc.bufferedPageRange().count;
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      doc.strokeColor('#1E3A8A').lineWidth(1).moveTo(30, 800).lineTo(565, 800).stroke();
      doc.fillColor('#9CA3AF')
         .fontSize(7)
         .text('AI Student Attendance System - Confidential Report', 30, 808)
         .text(`Page ${i + 1} of ${pageCount}`, 500, 808, { align: 'right' });
    }

    doc.end();
  } catch (error) {
    // If headers are already sent, we can't send json error
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: error.message });
    } else {
      console.error(error);
      res.end();
    }
  }
};
