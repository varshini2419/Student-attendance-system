const fs = require('fs');

const rebuildSrc = fs.readFileSync('rebuild.cjs', 'utf8');

const newEndpointsStart = rebuildSrc.indexOf('const newEndpoints = `') + 'const newEndpoints = `'.length;
const newEndpointsEnd = rebuildSrc.indexOf('`;', newEndpointsStart);
const c1 = rebuildSrc.substring(newEndpointsStart, newEndpointsEnd);

const newExcelStart = rebuildSrc.indexOf('const newExcelFunc = `') + 'const newExcelFunc = `'.length;
const newExcelEnd = rebuildSrc.indexOf('`;', newExcelStart);
const c2 = rebuildSrc.substring(newExcelStart, newExcelEnd);

let file = fs.readFileSync('backend/src/controllers/attendanceController.js', 'utf8');
file += '\\n' + c1;

const excelRegex = /exports\\.downloadSessionExcel =[\\s\\S]+/;
file = file.replace(excelRegex, c2);

fs.writeFileSync('backend/src/controllers/attendanceController.js', file);
console.log('Appended and replaced!');
