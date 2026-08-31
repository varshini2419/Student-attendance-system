const fs = require('fs');

const lines = fs.readFileSync('backend/src/controllers/attendanceController.js', 'utf8').split('\n');

// Find recognizeFace block (lines 442 to 533 in phase 0)
let recStart = -1, recEnd = -1;
for (let i = 400; i < lines.length; i++) {
  if (lines[i].includes('if (') && lines[i+1] && lines[i+1].includes('existingRecord &&') && lines[i+2] && lines[i+2].includes('existingRecord.status === \'Present\'')) {
    recStart = i;
    break;
  }
}
for (let i = recStart; i < lines.length; i++) {
  if (lines[i].includes('message: \'Attendance marked successfully\'')) {
    recEnd = i + 2; // includes });
    break;
  }
}

const recognizeReplacement = `
    let student = bestMatch._id;

    // Phase 2/5: ActivityState Check with Configurable Cooldown
    const ActivityState = require('../models/ActivityState');
    let state = await ActivityState.findOne({ student, session: session._id });
    
    if (!state) {
      return res.status(200).json({
        success: true,
        matched: true,
        name: bestMatch.name,
        studentId: student,
        confidence: Number(confidence.toFixed(4)),
        action: 'LOGIN_AVAILABLE',
        message: 'Ready for login'
      });
    }

    if (state.currentState === 'IN') {
      const minsSinceLogin = (Date.now() - new Date(state.lastLoginTime).getTime()) / 60000;
      const cooldownTarget = parseInt(process.env.LOGOUT_COOLDOWN_MINUTES) || 5;
      
      if (minsSinceLogin < cooldownTarget) {
        return res.status(200).json({
          success: true,
          matched: true,
          name: bestMatch.name,
          studentId: student,
          confidence: Number(confidence.toFixed(4)),
          action: 'IGNORE',
          message: 'Inside cooldown window'
        });
      } else {
        return res.status(200).json({
          success: true,
          matched: true,
          name: bestMatch.name,
          studentId: student,
          confidence: Number(confidence.toFixed(4)),
          action: 'LOGOUT_AVAILABLE',
          message: 'Ready for logout'
        });
      }
    } else {
      return res.status(200).json({
        success: true,
        matched: true,
        name: bestMatch.name,
        studentId: student,
        confidence: Number(confidence.toFixed(4)),
        action: 'LOGIN_AVAILABLE',
        message: 'Ready for login'
      });
    }
`;

let newLines = [...lines.slice(0, recStart), recognizeReplacement, ...lines.slice(recEnd)];
let newCode = newLines.join('\n');

// Replace downloadSessionExcel
const excelStartIdx = newCode.indexOf('exports.downloadSessionExcel = async (req, res) => {');
const endFuncRegex = /catch \(error\) \{\s+res\.status\(500\)\.json\(\{\s+success: false,\s+message: error\.message\s+\}\);\s+\}\s+\};/;
const match = newCode.slice(excelStartIdx).match(endFuncRegex);
const excelEndIdx = excelStartIdx + match.index + match[0].length;

const newExcelFunc = fs.readFileSync('rebuild.cjs', 'utf8').split('const newExcelFunc = `')[1].split('`;')[0];
newCode = newCode.substring(0, excelStartIdx) + newExcelFunc + newCode.substring(excelEndIdx);

// Append new endpoints
const newEndpoints = fs.readFileSync('rebuild.cjs', 'utf8').split('const newEndpoints = `')[1].split('`;')[0];
newCode += '\n' + newEndpoints;

fs.writeFileSync('backend/src/controllers/attendanceController.js', newCode);
console.log('Build completed!');
