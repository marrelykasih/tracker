/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, AlertCircle, Clock, Volume2, Plus, RefreshCw, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TimesheetEntry, AppSettings, ActiveTracker } from '../types';
import { formatElapsedSeconds, formatTime24h, playChime } from '../utils/timeUtils';

interface ActiveTrackerCardProps {
  settings: AppSettings;
  onSaveEntry: (entry: Omit<TimesheetEntry, 'id'>) => void;
  onAddProject: (project: string) => void;
}

export default function ActiveTrackerCard({ settings, onSaveEntry, onAddProject }: ActiveTrackerCardProps) {
  // State for input form
  const [project, setProject] = useState('');
  const [kegiatan, setKegiatan] = useState('');
  const [detailKegiatan, setDetailKegiatan] = useState('');
  const [isOvertime, setIsOvertime] = useState(false);

  // Active tracking state
  const [isActive, setIsActive] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showEndConfirmation, setShowEndConfirmation] = useState(false);
  const [endTimes, setEndTimes] = useState<{ start: string; end: string }>({ start: '', end: '' });

  // Reminder state
  const [lastReminderTime, setLastReminderTime] = useState<number>(0);
  const [showReminderNotification, setShowReminderNotification] = useState(false);
  const [secondsUntilNextReminder, setSecondsUntilNextReminder] = useState(0);

  // References
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const reminderNotificationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load active tracker from localStorage on mount (persistence for active session!)
  useEffect(() => {
    const savedTracker = localStorage.getItem('active_timesheet_tracker');
    if (savedTracker) {
      try {
        const parsed = JSON.parse(savedTracker) as ActiveTracker;
        const start = new Date(parsed.startTime);
        if (!isNaN(start.getTime())) {
          setStartTime(start);
          setProject(parsed.projectPurpose);
          setKegiatan(parsed.kegiatan);
          setDetailKegiatan(parsed.detailKegiatan);
          setIsOvertime(parsed.isOvertime);
          setIsActive(true);
          const elapsed = Math.floor((Date.now() - start.getTime()) / 1000);
          setElapsedSeconds(elapsed > 0 ? elapsed : 0);
          setLastReminderTime(Date.now());
        }
      } catch (e) {
        console.error('Failed to parse saved active tracker', e);
      }
    }
  }, []);

  // Save state to localStorage when tracking
  useEffect(() => {
    if (isActive && startTime) {
      const stateToSave: ActiveTracker = {
        startTime: startTime.toISOString(),
        projectPurpose: project,
        kegiatan,
        detailKegiatan,
        isOvertime,
      };
      localStorage.setItem('active_timesheet_tracker', JSON.stringify(stateToSave));
    } else {
      localStorage.removeItem('active_timesheet_tracker');
    }
  }, [isActive, startTime, project, kegiatan, detailKegiatan, isOvertime]);

  // Main timer tick effect
  useEffect(() => {
    if (isActive && startTime) {
      timerRef.current = setInterval(() => {
        const now = Date.now();
        const elapsed = Math.floor((now - startTime.getTime()) / 1000);
        setElapsedSeconds(elapsed);

        // Reminder logic based on settings.reminderInterval (minutes)
        const intervalMs = settings.reminderInterval * 60 * 1000;
        const nextReminderAt = lastReminderTime + intervalMs;
        const remaining = Math.max(0, Math.ceil((nextReminderAt - now) / 1000));
        setSecondsUntilNextReminder(remaining);

        if (now >= nextReminderAt && settings.hourlyReminder) {
          triggerReminder();
        }
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, startTime, lastReminderTime, settings.reminderInterval, settings.hourlyReminder]);

  const triggerReminder = () => {
    setLastReminderTime(Date.now());
    if (settings.reminderSound) {
      playChime();
    }
    setShowReminderNotification(true);
    
    // Auto hide standard notification after 15 seconds
    if (reminderNotificationTimeoutRef.current) clearTimeout(reminderNotificationTimeoutRef.current);
    reminderNotificationTimeoutRef.current = setTimeout(() => {
      setShowReminderNotification(false);
    }, 15000);
  };

  const handleStartTracking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!kegiatan.trim()) return;

    const now = new Date();
    setStartTime(now);
    setIsActive(true);
    setElapsedSeconds(0);
    setLastReminderTime(Date.now());
    setSecondsUntilNextReminder(settings.reminderInterval * 60);

    // Save project if it's new
    if (project.trim() && !settings.projects.includes(project.trim())) {
      onAddProject(project.trim());
    }
  };

  const handleEndTracking = () => {
    if (!startTime) return;
    const now = new Date();
    
    // Set format as HH:MM for both times
    const startFormatted = formatTime24h(startTime);
    const endFormatted = formatTime24h(now);

    setEndTimes({ start: startFormatted, end: endFormatted });
    setShowEndConfirmation(true);
  };

  const handleConfirmSave = () => {
    const today = new Date().toISOString().split('T')[0];
    
    // Save entry
    onSaveEntry({
      date: today,
      startTime: endTimes.start,
      endTime: endTimes.end,
      projectPurpose: project || 'IBMS',
      kegiatan: kegiatan || 'General Task',
      detailKegiatan: detailKegiatan,
      normalHours: !isOvertime ? parseFloat((elapsedSeconds / 3600).toFixed(2)) : 0,
      lemburHours: isOvertime ? parseFloat((elapsedSeconds / 3600).toFixed(2)) : 0,
      isOvertime,
    });

    // Reset tracker state
    setIsActive(false);
    setStartTime(null);
    setElapsedSeconds(0);
    setKegiatan('');
    setDetailKegiatan('');
    setShowEndConfirmation(false);
    localStorage.removeItem('active_timesheet_tracker');
  };

  const handleCancelTracking = () => {
    if (window.confirm('Apakah Anda yakin ingin membatalkan tracker ini? Data waktu berjalan akan hilang.')) {
      setIsActive(false);
      setStartTime(null);
      setElapsedSeconds(0);
      setKegiatan('');
      setDetailKegiatan('');
      localStorage.removeItem('active_timesheet_tracker');
    }
  };

  // Quick preset projects
  const availableProjects = settings.projects.length > 0 ? settings.projects : ['IBMS'];

  return (
    <div id="active-tracker-section" className="bg-white rounded-2xl shadow-xs border border-slate-200/50 overflow-hidden mb-6">
      {/* Top Notification Toast */}
      <AnimatePresence>
        {showReminderNotification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-indigo-600 text-white px-5 py-3 flex items-center justify-between shadow-sm"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-300 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-200"></span>
              </span>
              <p className="text-xs font-medium">
                ⏱️ <strong>Pengingat Jam:</strong> Anda sedang melacak <strong>{kegiatan || 'Task'}</strong> ({project}). Sudah berjalan {Math.floor(elapsedSeconds / 60)} menit.
              </p>
            </div>
            <button 
              onClick={() => setShowReminderNotification(false)}
              className="text-white hover:text-indigo-200 p-1 cursor-pointer"
            >
              <X size={15} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-6 md:p-8">
        {!isActive ? (
          /* Tracker Form - Ready to track */
          <form onSubmit={handleStartTracking}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Clock size={16} />
                </span>
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider font-sans">Mulai Task Baru</h2>
              </div>
              <span className="text-[10px] text-slate-400 font-mono bg-slate-100 px-2 py-0.5 rounded">
                READY
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Project Purpose */}
              <div className="md:col-span-3">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Project Purpose
                </label>
                <div className="relative">
                  <select
                    value={project}
                    onChange={(e) => setProject(e.target.value)}
                    className="w-full bg-slate-50/50 hover:bg-slate-100/50 focus:bg-white border border-slate-200/80 rounded-xl px-3 py-2.5 text-xs text-slate-800 transition focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-600 appearance-none"
                    required
                  >
                    <option value="" disabled>Pilih Project</option>
                    {availableProjects.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                    <option value="NEW_PROJECT">+ Project Baru...</option>
                  </select>
                  {project === 'NEW_PROJECT' && (
                    <input
                      type="text"
                      placeholder="Nama Project Baru"
                      onChange={(e) => setProject(e.target.value)}
                      className="absolute inset-0 w-full bg-white border border-indigo-650 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none"
                      autoFocus
                      required
                    />
                  )}
                </div>
              </div>

              {/* Kegiatan */}
              <div className="md:col-span-4">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Kegiatan (Judul)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Setup Environment & Bug Fixing UI"
                  value={kegiatan}
                  onChange={(e) => setKegiatan(e.target.value)}
                  className="w-full bg-slate-50/50 hover:bg-slate-100/50 focus:bg-white border border-slate-200/80 rounded-xl px-3 py-2.5 text-xs text-slate-800 transition focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-600"
                  required
                />
              </div>

              {/* Detail Kegiatan */}
              <div className="md:col-span-5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Detail Kegiatan (Penjelasan)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Menyelesaikan error instalasi type definitions..."
                  value={detailKegiatan}
                  onChange={(e) => setDetailKegiatan(e.target.value)}
                  className="w-full bg-slate-50/50 hover:bg-slate-100/50 focus:bg-white border border-slate-200/80 rounded-xl px-3 py-2.5 text-xs text-slate-800 transition focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-600"
                />
              </div>
            </div>

            {/* Bottom Form Actions */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-t border-slate-100/70 mt-5 pt-4 gap-4">
              {/* Overtime Selector */}
              <div className="flex items-center gap-6">
                <label className="relative flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isOvertime}
                    onChange={(e) => setIsOvertime(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                  <span className="ml-2.5 text-xs font-semibold text-slate-600">
                    Pekerjaan Lembur (Overtime)
                  </span>
                </label>

                {settings.hourlyReminder && (
                  <span className="flex items-center gap-1 text-[11px] text-slate-400">
                    <Volume2 size={12} className="text-slate-400" />
                    Reminder: {settings.reminderInterval}m
                  </span>
                )}
              </div>

              {/* Start Button */}
              <button
                type="submit"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white px-5 py-2 rounded-xl font-semibold text-xs transition shadow-sm cursor-pointer"
              >
                <Play size={13} fill="currentColor" />
                Mulai Catat Jam Kerja
              </button>
            </div>
          </form>
        ) : (
          /* Tracker Active Running State */
          <div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              {/* Tracker visual timer */}
              <div className="flex items-center gap-5">
                <div className="relative flex items-center justify-center">
                  <span className="absolute inline-flex h-16 w-16 rounded-full bg-indigo-400 opacity-10 animate-ping"></span>
                  <div className="relative flex items-center justify-center h-16 w-16 rounded-full bg-indigo-50/80 border border-indigo-100 text-indigo-600">
                    <Clock className="animate-pulse" size={24} />
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-600 border border-red-200/30 animate-pulse">
                      🔴 SEDANG MELACAK
                    </span>
                    {isOvertime && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/30">
                        OVERTIME
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 font-mono tracking-widest mt-0.5">
                    {formatElapsedSeconds(elapsedSeconds)}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                    Mulai: {startTime ? formatTime24h(startTime) : ''}
                  </p>
                </div>
              </div>

              {/* Current activity details block */}
              <div className="flex-1 bg-slate-50/50 rounded-xl p-4 border border-slate-200/40">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="block text-[9px] uppercase font-bold tracking-wider text-slate-400">
                      Project
                    </span>
                    <span className="text-xs font-semibold text-slate-700">
                      {project || '-'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[9px] uppercase font-bold tracking-wider text-slate-400">
                      Kegiatan
                    </span>
                    <span className="text-xs font-semibold text-slate-700 truncate block">
                      {kegiatan}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[9px] uppercase font-bold tracking-wider text-slate-400">
                      Detail Kegiatan
                    </span>
                    <span className="text-xs text-slate-500 truncate block">
                      {detailKegiatan || '-'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCancelTracking}
                  className="px-4 py-2 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-100 font-semibold rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleEndTracking}
                  className="px-5 py-2 bg-red-650 hover:bg-red-700 active:scale-[0.98] text-white font-semibold rounded-xl text-xs inline-flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                >
                  <Square size={12} fill="currentColor" />
                  Akhiri (End)
                </button>
              </div>
            </div>

            {/* Reminder countdown / helper row */}
            {settings.hourlyReminder && (
              <div className="flex items-center justify-between border-t border-slate-100/70 mt-4 pt-3 text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <AlertCircle size={12} className="text-indigo-500" />
                  Pengingat berjalan bersuara & visual setiap {settings.reminderInterval} menit.
                </span>
                <span className="font-mono text-slate-400 text-[10px]">
                  Sisa waktu: {Math.floor(secondsUntilNextReminder / 60)}m {secondsUntilNextReminder % 60}s
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Save Confirmation Dialog / Slide-over sheet */}
      <AnimatePresence>
        {showEndConfirmation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/20 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-200/50"
            >
              <div className="p-6 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider font-sans">
                  Selesaikan Task & Simpan
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Verifikasi data kerja Anda sebelum disimpan ke Excel timesheet.
                </p>
              </div>

              <div className="p-6 space-y-4">
                {/* Visual duration and times */}
                <div className="bg-indigo-50/50 rounded-xl p-4 border border-indigo-100/30 flex items-center justify-between">
                  <div>
                    <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                      Total Durasi Kerja
                    </span>
                    <span className="text-xl font-black text-indigo-700 font-mono">
                      {(elapsedSeconds / 3600).toFixed(2)} <span className="text-xs font-semibold">Jam</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="text-right">
                      <span className="block text-[8px] uppercase font-bold text-slate-400 tracking-wider">Mulai</span>
                      <input
                        type="time"
                        value={endTimes.start}
                        onChange={(e) => setEndTimes({ ...endTimes, start: e.target.value })}
                        className="text-xs font-semibold font-mono bg-white border border-slate-200 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <span className="text-slate-300 font-mono text-xs">→</span>
                    <div>
                      <span className="block text-[8px] uppercase font-bold text-slate-400 tracking-wider">Selesai</span>
                      <input
                        type="time"
                        value={endTimes.end}
                        onChange={(e) => setEndTimes({ ...endTimes, end: e.target.value })}
                        className="text-xs font-semibold font-mono bg-white border border-slate-200 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Form fields review */}
                <div className="space-y-3.5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Project Purpose
                    </label>
                    <input
                      type="text"
                      value={project}
                      onChange={(e) => setProject(e.target.value)}
                      className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Kegiatan (Judul)
                    </label>
                    <input
                      type="text"
                      value={kegiatan}
                      onChange={(e) => setKegiatan(e.target.value)}
                      className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Detail Kegiatan (Penjelasan Lengkap)
                    </label>
                    <textarea
                      value={detailKegiatan}
                      onChange={(e) => setDetailKegiatan(e.target.value)}
                      rows={3}
                      className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="confirm-overtime"
                      checked={isOvertime}
                      onChange={(e) => setIsOvertime(e.target.checked)}
                      className="h-3.5 w-3.5 text-indigo-650 focus:ring-indigo-500 border-slate-300 rounded cursor-pointer"
                    />
                    <label htmlFor="confirm-overtime" className="text-xs font-semibold text-slate-600 select-none cursor-pointer">
                      Tandai sebagai pekerjaan lembur (Overtime Hours)
                    </label>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEndConfirmation(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Kembali
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSave}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs transition shadow-sm cursor-pointer"
                >
                  Simpan ke Timesheet
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
