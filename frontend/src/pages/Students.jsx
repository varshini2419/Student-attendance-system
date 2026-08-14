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
  Filter,
  Users
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
    email: '',
    year: '',
    category: ''
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
      email: '',
      year: '',
      category: ''
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
      email: student.email,
      year: student.year || '',
      category: student.category || ''
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

    const { name, rollNumber, branch, section, email, year, category } = formData;
    if (!name || !rollNumber || !branch || !section || !email || !year || !category) {
      setFormError('Please fill in all the details.');
      setSaving(false);
      return;
    }

    if (!['CSD', 'CSIT'].includes(branch)) {
      setFormError('Invalid Branch selected. Only CSD and CSIT are allowed.');
      setSaving(false);
      return;
    }

    if (!['A', 'B'].includes(section)) {
      setFormError('Invalid Section selected. Only A and B are allowed.');
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
  const uniqueBranches = ['CSD', 'CSIT'];
  const uniqueSections = ['A', 'B'];

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <div className="flex items-center justify-center rounded-lg bg-brand-50 p-1.5 text-brand-600">
              <Users className="h-4 w-4" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-brand-600">Directory</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight sm:text-3xl">Student Database</h2>
          <p className="mt-1 text-sm font-medium text-slate-500">Manage enrollments and face recognition profiles</p>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenCreateModal}
            className="group flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-slate-900/20 hover:bg-slate-800 active:scale-95 transition-all hover:-translate-y-0.5"
          >
            <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform" />
            <span>Add Student</span>
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 shadow-sm shadow-rose-100/50">
          <p className="text-sm font-semibold text-rose-700">{error}</p>
        </div>
      )}

      {/* Filters & Search Row */}
      <div className="glass-card flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
        <form onSubmit={handleSearchSubmit} className="flex flex-1 items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-3.5 h-4.5 w-4.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or roll number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm font-semibold text-slate-800 placeholder-slate-400 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all shadow-sm"
            />
          </div>
          <button
            type="submit"
            className="rounded-xl bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 px-5 py-3 text-sm font-bold text-slate-700 transition-all shadow-sm active:scale-95"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4 sm:border-t-0 sm:pt-0 sm:border-l sm:pl-4">
          <div className="flex items-center gap-2 text-slate-400">
            <Filter className="h-4 w-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Filters</span>
          </div>

          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all shadow-sm cursor-pointer"
          >
            <option value="">All Branches</option>
            {uniqueBranches.map(b => <option key={b} value={b}>{b}</option>)}
          </select>

          <select
            value={sectionFilter}
            onChange={(e) => setSectionFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all shadow-sm cursor-pointer"
          >
            <option value="">All Sections</option>
            {uniqueSections.map(s => <option key={s} value={s}>Sec {s}</option>)}
          </select>
        </div>
      </div>

      {/* Directory Table */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="flex h-80 flex-col items-center justify-center gap-4">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
            <span className="text-sm font-bold text-slate-400">Synchronizing database...</span>
          </div>
        ) : students.length === 0 ? (
          <div className="flex h-80 flex-col items-center justify-center text-center p-8">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-50 border-2 border-dashed border-slate-200 mb-4">
              <User className="h-8 w-8 text-slate-300" />
            </div>
            <span className="text-base font-extrabold text-slate-600">No students found</span>
            <span className="text-sm font-medium text-slate-400 mt-1">Try adjusting your filters or adding a new record.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/60 bg-slate-50/50 text-xs font-bold text-slate-400 uppercase tracking-widest">
                  <th className="px-6 py-4 font-bold">Student Profile</th>
                  <th className="px-6 py-4 font-bold">ID Number</th>
                  <th className="px-6 py-4 font-bold">Class</th>
                  <th className="px-6 py-4 font-bold hidden md:table-cell">Year</th>
                  <th className="px-6 py-4 font-bold hidden lg:table-cell">Category</th>
                  <th className="px-6 py-4 font-bold hidden md:table-cell">Contact</th>
                  <th className="px-6 py-4 font-bold">AI Status</th>
                  <th className="px-6 py-4 text-right font-bold">Manage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm bg-white">
                {students.map((student) => {
                  const hasFaces = student.embeddings && student.embeddings.length > 0;
                  return (
                    <tr key={student._id} className="hover:bg-brand-50/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600 font-extrabold text-sm shadow-inner group-hover:from-brand-100 group-hover:to-brand-200 group-hover:text-brand-700 transition-all">
                            {student.name[0]}
                          </div>
                          <div>
                            <span className="block font-bold text-slate-900">
                              {student.name}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-1 text-xs font-mono font-bold text-slate-600">
                          {student.rollNumber}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-700">{student.branch}</span>
                          <span className="text-[11px] font-semibold text-slate-400">Section {student.section}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-500 font-medium hidden md:table-cell">
                        <span className="inline-flex items-center rounded-md bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">
                          {student.year || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 font-medium hidden lg:table-cell">
                        <span className="inline-flex items-center rounded-md bg-purple-100 px-2.5 py-1 text-xs font-semibold text-purple-700">
                          {student.category || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 font-medium hidden md:table-cell">
                        {student.email}
                      </td>
                      <td className="px-6 py-4">
                        {hasFaces ? (
                          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-100 px-3 py-1.5 text-[11px] font-bold text-emerald-700 shadow-sm">
                            <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                            <span>Verified</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-100 px-3 py-1.5 text-[11px] font-bold text-amber-700 shadow-sm">
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                            <span>Pending Face Data</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() =>
                              navigate('/face-registration', {
                                state: { studentId: student._id, rollNumber: student.rollNumber, name: student.name }
                              })
                            }
                            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600 shadow-sm transition-all active:scale-95"
                            title="Register Face Data"
                          >
                            <Camera className="h-4.5 w-4.5" />
                          </button>
                          
                          {isAdmin && (
                            <>
                              <button
                                onClick={() => handleOpenEditModal(student)}
                                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700 shadow-sm transition-all active:scale-95"
                                title="Edit Info"
                              >
                                <Edit className="h-4.5 w-4.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(student._id, student.name)}
                                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 shadow-sm transition-all active:scale-95"
                                title="Remove Student"
                              >
                                <Trash2 className="h-4.5 w-4.5" />
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
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setIsModalOpen(false)} />
          
          <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-100 animate-fade-in-up">
            <div className="flex items-center justify-between border-b border-slate-100 px-8 py-6 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-slate-200 shadow-sm text-slate-700">
                  {modalMode === 'create' ? <Plus className="h-5 w-5" /> : <Edit className="h-5 w-5" />}
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">
                    {modalMode === 'create' ? 'Enroll New Student' : 'Update Profile'}
                  </h3>
                  <span className="text-xs font-semibold text-slate-500">
                    {modalMode === 'create' ? 'Add records to the central database' : 'Modify existing student details'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-8">
              {formError && (
                <div className="mb-6 flex items-start gap-3 rounded-xl bg-rose-50 border border-rose-100 p-4 shadow-sm shadow-rose-100/50">
                  <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0" />
                  <p className="text-sm font-semibold text-rose-700">{formError}</p>
                </div>
              )}

              <form onSubmit={handleFormSubmit} className="space-y-5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g. Alexander Pierce"
                    className="w-full rounded-xl border border-slate-200 bg-white py-3 px-4 text-sm font-semibold text-slate-900 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all shadow-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">ID / Roll Number</label>
                  <input
                    type="text"
                    name="rollNumber"
                    value={formData.rollNumber}
                    onChange={handleInputChange}
                    placeholder="e.g. 21CS001"
                    className="w-full rounded-xl border border-slate-200 bg-white py-3 px-4 text-sm font-semibold text-slate-900 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all uppercase shadow-sm disabled:opacity-60 disabled:bg-slate-50"
                    required
                    disabled={modalMode === 'edit'}
                  />
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Branch</label>
                    <select
                      name="branch"
                      value={formData.branch}
                      onChange={handleInputChange}
                      className="w-full rounded-xl border border-slate-200 bg-white py-3 px-4 text-sm font-semibold text-slate-900 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all shadow-sm cursor-pointer"
                      required
                    >
                      <option value="" disabled>Select...</option>
                      {uniqueBranches.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Section</label>
                    <select
                      name="section"
                      value={formData.section}
                      onChange={handleInputChange}
                      className="w-full rounded-xl border border-slate-200 bg-white py-3 px-4 text-sm font-semibold text-slate-900 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all shadow-sm cursor-pointer"
                      required
                    >
                      <option value="" disabled>Select...</option>
                      {uniqueSections.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Year</label>
                    <select
                      name="year"
                      value={formData.year}
                      onChange={handleInputChange}
                      className="w-full rounded-xl border border-slate-200 bg-white py-3 px-4 text-sm font-semibold text-slate-900 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all shadow-sm cursor-pointer"
                      required
                    >
                      <option value="" disabled>Select...</option>
                      <option value="First Year">First Year</option>
                      <option value="Second Year">Second Year</option>
                      <option value="Third Year">Third Year</option>
                      <option value="Fourth Year">Fourth Year</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Category</label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full rounded-xl border border-slate-200 bg-white py-3 px-4 text-sm font-semibold text-slate-900 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all shadow-sm cursor-pointer"
                      required
                    >
                      <option value="" disabled>Select...</option>
                      <option value="Front Lab">Front Lab</option>
                      <option value="Ideal Lab">Ideal Lab</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="e.g. alex@university.edu"
                    className="w-full rounded-xl border border-slate-200 bg-white py-3 px-4 text-sm font-semibold text-slate-900 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all shadow-sm"
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="rounded-xl bg-white border border-slate-200 hover:border-slate-300 px-6 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-slate-900/20 hover:bg-slate-800 active:scale-95 transition-all disabled:opacity-50 disabled:hover:bg-slate-900"
                  >
                    {saving ? 'Processing...' : modalMode === 'create' ? 'Complete Enrollment' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Students;