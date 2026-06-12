const express = require('express');
const router = express.Router();
const { downloadExcelReport, downloadPdfReport } = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('admin', 'faculty'));

router.get('/excel', downloadExcelReport);
router.get('/pdf', downloadPdfReport);

module.exports = router;
