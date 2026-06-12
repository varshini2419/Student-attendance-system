import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Camera,
  CheckCircle,
  AlertTriangle,
  X,
  User,
  Filter
} from 'lucide-react';
import API from '../utils/api';

const Students = () => {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [formData, setFormData] = useState({
    name: '',
    rollNumber: '',
    branch: '',
    section: '',
    email: ''
  });
  const [editId, setEditId] = useState(null);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  const fetchStudents = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await API.get('/students', {
        params: {
          search,
          branch: branchFilter,
          section: sectionFilter
        }
      });
      if (response.data.success) {
        setStudents(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching students:', err);
      setError('Could not retrieve student list. Please verify server status.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [branchFilter, sectionFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchStudents();
  };

  const handleOpenCreateModal = () => {
    setFormData({
      name: '',
      rollNumber: '',
      branch: '',
      section: '',
      email: ''
    });
    setFormError('');
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (student) => {
    setFormData({
      name: student.name,
      rollNumber: student.rollNumber,
      branch: student.branch,
      section: student.section,
      email: student.email
    });
    setFormError('');
    setEditId(student._id);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);

    const { name, rollNumber, branch, section, email } = formData;
    if (!name || !rollNumber || !branch || !section || !email) {
      setFormError('Please fill in all the details.');
      setSaving(false);
      return;
    }

    try {
      if (modalMode === 'create') {
        const response = await API.post('/students', formData);
        if (response.data.success) {
          setIsModalOpen(false);
          fetchStudents();
        }
      } else {
        const response = await API.put(`/students/${editId}`, formData);
        if (response.data.success) {
          setIsModalOpen(false);
          fetchStudents();
        }
      }
    } catch (err) {
      console.error('Form submission error:', err);
      setFormError(err.response?.data?.message || 'Error processing request.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete ${name}? This will also delete all their attendance records.`)) {
      try {
        const response = await API.delete(`/students/${id}`);
        if (response.data.success) {
          fetchStudents();
        }
      } catch (err) {
        console.error('Delete error:', err);
        alert(err.response?.data?.message || 'Could not delete student.');
      }
    }
  };

  // Extract unique branches and sections for filter dropdowns
  const uniqueBranches = ['CSE', 'ECE', 'EEE', 'IT', 'MECH', 'CIVIL'];
  const uniqueSections = ['A', 'B', 'C', 'D'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 sm:text-2xl">Student Directory</h2>
          <p className="text-sm text-slate-500 font-medium">Manage student accounts and webcam face registrations</p>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-brand-500/20 hover:bg-brand-600 active:scale-[0.98] transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Add Student</span>
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-rose-100 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
          {error}
        </div>
      )}

      {/* Filters & Search Row */}
      <div className="glass-card flex flex-col gap-4 p-5 bg-white sm:flex-row sm:items-center">
        <form onSubmit={handleSearchSubmit} className="flex flex-1 items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by student name or roll number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-sm font-medium text-slate-800 placeholder-slate-400 outline-none focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10 transition-all"
            />
          </div>
          <button
            type="submit"
            className="rounded-xl bg-slate-100 hover:bg-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 transition-colors"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-slate-400">
            <Filter className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Filters</span>
          </div>

          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/5 transition-all"
          >
            <option value="">All Branches</option>
            {uniqueBranches.map(b => <option key={b} value={b}>{b}</option>)}
          </select>

          <select
            value={sectionFilter}
            onChange={(e) => setSectionFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/5 transition-all"
          >
            <option value="">All Sections</option>
            {uniqueSections.map(s => <option key={s} value={s}>Sec {s}</option>)}
          </select>
        </div>
      </div>

      {/* Directory Table */}
      <div className="glass-card overflow-hidden bg-white">
        {loading ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-brand-500 border-t-transparent"></div>
            <span className="text-xs font-medium text-slate-400">Loading student directory...</span>
          </div>
        ) : students.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-center p-6">
            <User className="h-12 w-12 text-slate-300" />
            <span className="mt-3 text-sm font-bold text-slate-500">No students found</span>
            <span className="text-xs text-slate-400 mt-1">Try relaxing filters or adding a new student.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <th className="px-6 py-4">Student Details</th>
                  <th className="px-6 py-4">Roll Number</th>
                  <th className="px-6 py-4">Branch & Section</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">AI Verification Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {students.map((student) => {
                  const hasFaces = student.embeddings && student.embeddings.length > 0;
                  return (
                    <tr key={student._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-brand-600 font-bold text-sm uppercase">
                            {student.name[0]}
                          </div>
                          <div>
                            <span className="block font-semibold text-slate-800 leading-tight">
                              {student.name}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono font-medium text-slate-600">
                        {student.rollNumber}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-slate-700">{student.branch}</span>
                        <span className="text-slate-400 mx-1.5">•</span>
                        <span className="text-slate-500">Sec {student.section}</span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 font-medium">
                        {student.email}
                      </td>
                      <td className="px-6 py-4">
                        {hasFaces ? (
                          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700">
                            <CheckCircle className="h-3.5 w-3.5" />
                            <span>Registered ({student.embeddings.length} templates)</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            <span>No Face Data</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2.5">
                          <button
                            onClick={() =>
                              navigate('/face-registration', {
                                state: { studentId: student._id, rollNumber: student.rollNumber, name: student.name }
                              })
                            }
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-brand-600 transition-colors"
                            title="Register Face Images"
                          >
                            <Camera className="h-4 w-4" />
                          </button>
                          
                          {isAdmin && (
                            <>
                              <button
                                onClick={() => handleOpenEditModal(student)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition-colors"
                                title="Edit Student Info"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(student._id, student.name)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-rose-600 transition-colors"
                                title="Delete Student"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white p-6 shadow-xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 mb-5">
              <h3 className="text-base font-extrabold text-slate-900">
                {modalMode === 'create' ? 'Add Student Record' : 'Edit Student Details'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 rounded-xl bg-rose-50 border border-rose-100 p-3 text-xs font-semibold text-rose-700">
                {formError}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g. Alice Smith"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-sm font-medium outline-none focus:border-brand-500 focus:bg-white transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Roll Number</label>
                <input
                  type="text"
                  name="rollNumber"
                  value={formData.rollNumber}
                  onChange={handleInputChange}
                  placeholder="e.g. 21CS001"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-sm font-medium outline-none focus:border-brand-500 focus:bg-white transition-all uppercase"
                  required
                  disabled={modalMode === 'edit'} // Lock roll number on edit
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Branch</label>
                  <select
                    name="branch"
                    value={formData.branch}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm font-medium outline-none focus:border-brand-500 focus:bg-white transition-all"
                    required
                  >
                    <option value="">Select Branch</option>
                    {uniqueBranches.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Section</label>
                  <select
                    name="section"
                    value={formData.section}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm font-medium outline-none focus:border-brand-500 focus:bg-white transition-all"
                    required
                  >
                    <option value="">Select Sec</option>
                    {uniqueSections.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="e.g. alice@university.edu"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-sm font-medium outline-none focus:border-brand-500 focus:bg-white transition-all"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-brand-500/20 hover:bg-brand-600 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Students;