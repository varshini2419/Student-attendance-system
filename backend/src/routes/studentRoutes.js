const express = require('express');
const router = express.Router();
const {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  registerFaces
} = require('../controllers/studentController');
const { protect, authorize } = require('../middleware/auth');

// All routes require login
router.use(protect);

router.route('/')
  .get(getStudents)
  .post(authorize('admin'), createStudent);

router.route('/:id')
  .get(getStudentById)
  .put(authorize('admin'), updateStudent)
  .delete(authorize('admin'), deleteStudent);

// Face registration endpoint
router.post('/:id/register-faces', authorize('admin', 'faculty'), registerFaces);

module.exports = router;
