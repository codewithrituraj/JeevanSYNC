import React, { useState, useEffect } from 'react';
import { Bell, Plus, CheckCircle, Clock, Trash2, Calendar, Pill, Loader2 } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const RemindersPage = () => {
  const { isAuthenticated } = useAuth();
  const [reminders, setReminders] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    type: 'MEDICATION',
    title: '',
    message: '',
    scheduledAt: '',
    channel: 'IN_APP',
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      loadReminders();
    }
  }, [isAuthenticated]);

  const loadReminders = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/reminders/my-reminders');
      if (res.success) setReminders(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateReminder = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/reminders', {
        ...formData,
        scheduledAt: new Date(formData.scheduledAt).toISOString(),
      });
      if (res.success) {
        setShowAddModal(false);
        setFormData({ type: 'MEDICATION', title: '', message: '', scheduledAt: '', channel: 'IN_APP' });
        loadReminders();
      }
    } catch (err) {
      alert(err.error?.message || 'Failed to schedule reminder');
    }
  };

  const handleDeleteReminder = async (id) => {
    try {
      await api.delete(`/reminders/${id}`);
      loadReminders();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkSent = async (id) => {
    try {
      await api.patch(`/reminders/${id}/status`, { status: 'SENT' });
      loadReminders();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Bell className="w-6 h-6 text-amber-500" />
            <span>Medication & Appointment Reminders</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Automated alerts dispatched via In-App notifications and WhatsApp
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md flex items-center gap-1.5 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Reminder</span>
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
        </div>
      ) : reminders.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-6">
          <p className="text-sm font-bold text-slate-700">No scheduled reminders</p>
          <p className="text-xs text-slate-400 mt-1">Add medication dosage or doctor visit reminders above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reminders.map((rem) => {
            const isDone = rem.status === 'SENT';

            return (
              <div
                key={rem.id}
                className={`bg-white rounded-2xl border p-4 shadow-sm flex items-start justify-between gap-4 transition-all ${
                  isDone ? 'border-slate-200 opacity-60 bg-slate-50' : 'border-amber-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2.5 rounded-xl ${rem.type === 'MEDICATION' ? 'bg-teal-100 text-teal-700' : 'bg-blue-100 text-blue-700'}`}>
                    {rem.type === 'MEDICATION' ? <Pill className="w-5 h-5" /> : <Calendar className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className={`text-sm font-bold ${isDone ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                        {rem.title}
                      </h3>
                      <span className="text-[10px] font-bold uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                        {rem.type}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">{rem.message}</p>
                    <p className="text-[11px] text-slate-400 font-semibold mt-1 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{new Date(rem.scheduledAt).toLocaleString()}</span>
                      <span className="text-slate-300">•</span>
                      <span>Channel: {rem.channel}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {!isDone && (
                    <button
                      onClick={() => handleMarkSent(rem.id)}
                      className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                      title="Mark as completed"
                    >
                      <CheckCircle className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteReminder(rem.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl p-5 space-y-4 shadow-xl border border-slate-200">
            <h2 className="text-base font-bold text-slate-900">Create New Reminder</h2>
            <form onSubmit={handleCreateReminder} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Reminder Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2"
                >
                  <option value="MEDICATION">Medication Dose</option>
                  <option value="APPOINTMENT">Doctor Appointment</option>
                  <option value="LAB_RESULT">Diagnostic Test Result</option>
                  <option value="FOLLOW_UP">Post-Discharge Follow-up</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Evening BP Tablet"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Instructions / Note *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Take 1 tablet of Telma 40 with water after dinner"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Scheduled Date & Time *</label>
                <input
                  type="datetime-local"
                  required
                  value={formData.scheduledAt}
                  onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Alert Channel</label>
                <select
                  value={formData.channel}
                  onChange={(e) => setFormData({ ...formData, channel: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2"
                >
                  <option value="IN_APP">In-App Notification</option>
                  <option value="WHATSAPP">WhatsApp Alert</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-slate-100 text-slate-700 text-xs font-bold py-2.5 rounded-xl hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 text-white text-xs font-bold py-2.5 rounded-xl hover:bg-emerald-700 shadow-md"
                >
                  Set Reminder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
