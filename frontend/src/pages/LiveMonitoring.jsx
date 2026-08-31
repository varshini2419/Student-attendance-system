import React, { useState, useEffect } from 'react';
import { Play, CheckCircle, Clock, Square, Users, Activity, ExternalLink } from 'lucide-react';
import API from '../utils/api';

const LiveMonitoring = () => {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [liveData, setLiveData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    if (selectedSession) {
      fetchLiveTracking(selectedSession._id);
    }
  }, [selectedSession]);


  const fetchSessions = async () => {
    try {
      setLoading(true);
      const res = await API.get('/attendance/sessions');
      if (res.data.success) {
        setSessions(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLiveTracking = async (sessionId) => {
    try {
      const res = await API.get(`/attendance/session/${sessionId}/live`);
      if (res.data.success) {
        setLiveData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch live tracking:', err);
    }
  };

  const formatTime = (isoString) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight sm:text-3xl">Live Monitoring</h2>
        <p className="mt-1 text-sm font-medium text-slate-500">Monitor active attendance sessions in real-time.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sessions List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Activity className="h-4 w-4 text-brand-500" />
              All Sessions
            </h3>
            {loading ? (
              <div className="animate-pulse flex flex-col gap-3">
                <div className="h-16 bg-slate-100 rounded-xl"></div>
                <div className="h-16 bg-slate-100 rounded-xl"></div>
              </div>
            ) : sessions.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">No sessions found.</p>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200">
                {sessions.map(s => (
                  <button
                    key={s._id}
                    onClick={() => setSelectedSession(s)}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${selectedSession?._id === s._id ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:border-brand-300'}`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-sm text-slate-900 truncate pr-2">{s.sessionName}</span>
                      {s.status === 'active' ? (
                        <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse mt-1" title="Active"></span>
                      ) : (
                        <span className="flex h-2 w-2 rounded-full bg-slate-300 mt-1" title="Completed"></span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 truncate font-mono">{s.sessionId}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Live Timeline */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 min-h-[500px]">
            {!selectedSession ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4 mt-20">
                <ExternalLink className="h-12 w-12 text-slate-200" />
                <p className="font-medium">Select a session to view live activity.</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-900">{selectedSession.sessionName}</h3>
                    <p className="text-xs text-slate-500 font-mono mt-1">{selectedSession.sessionId}</p>
                  </div>
                  <div className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${selectedSession.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                    {selectedSession.status}
                  </div>
                </div>

                <div className="space-y-4">
                  {liveData.length === 0 ? (
                    <div className="text-center text-sm font-medium text-slate-400 py-10">No activity recorded yet.</div>
                  ) : (
                    liveData.map(record => {
                      const isActiveSession = selectedSession.status === 'active';
                      return (
                        <div key={record.student._id} className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                          <div className="flex items-center justify-between mb-4 border-b border-slate-200/60 pb-3">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center font-bold text-sm">
                                {record.student.name[0]}
                              </div>
                              <div>
                                <h4 className="font-bold text-slate-900 text-sm">{record.student.name}</h4>
                                <p className="text-xs text-slate-500 font-mono">{record.student.rollNumber}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-1">State</div>
                              {record.currentState === 'IN' ? (
                                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded">
                                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                  IN
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded">
                                  <div className="h-1.5 w-1.5 rounded-full bg-slate-400"></div>
                                  OUT
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="space-y-2">
                            {/* Compute Timeline visually */}
                            {(record.cycles || []).map((c, i) => (
                                <div key={i} className="flex flex-col sm:flex-row gap-2 sm:gap-6 bg-white border border-slate-100 p-3 rounded-lg shadow-sm text-sm">
                                  <div className="flex-1 flex items-center gap-2 text-emerald-700">
                                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold">L{i+1}</span>
                                    <span className="font-bold">Login:</span>
                                    <span className="font-mono">{formatTime(c.loginTime)}</span>
                                  </div>
                                  <div className="flex-1 flex items-center gap-2">
                                    <span className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold">O{i+1}</span>
                                    <span className="font-bold">Logout:</span>
                                    <span className="font-mono">
                                      {c.cycleStatus === 'COMPLETED' ? formatTime(c.logoutTime) : (isActiveSession ? 'Not Yet' : "Didn't Do Logout")}
                                    </span>
                                  </div>
                                </div>
                            ))}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveMonitoring;
