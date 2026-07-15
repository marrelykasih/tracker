/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Trash2, Edit3, Plus, Check, X, EyeOff, Eye, AlertCircle } from 'lucide-react';
import { TimesheetEntry, AppSettings } from '../types';
import { formatIndonesianDate, formatDecimal, calculateDuration } from '../utils/timeUtils';

interface TimesheetTableProps {
  entries: TimesheetEntry[];
  settings: AppSettings;
  onUpdateEntry: (entry: TimesheetEntry) => void;
  onDeleteEntry: (id: string) => void;
  onAddEntry: (entry: Omit<TimesheetEntry, 'id'>) => void;
}

export default function TimesheetTable({
  entries,
  settings,
  onUpdateEntry,
  onDeleteEntry,
  onAddEntry
}: TimesheetTableProps) {
  // UI Controls
  const [showActions, setShowActions] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showManualForm, setShowManualForm] = useState(false);

  // Manual Form State
  const [manualDate, setManualDate] = useState(new Date().toISOString().split('T')[0]);
  const [manualStart, setManualStart] = useState('08:00');
  const [manualEnd, setManualEnd] = useState('17:00');
  const [manualProject, setManualProject] = useState('IBMS');
  const [manualKegiatan, setManualKegiatan] = useState('');
  const [manualDetail, setManualDetail] = useState('');
  const [manualIsOvertime, setManualIsOvertime] = useState(false);

  // Inline Edit State
  const [editDate, setEditDate] = useState('');
  const [editStart, setEditStart] = useState('');
  const [editEnd, setEditEnd] = useState('');
  const [editProject, setEditProject] = useState('');
  const [editKegiatan, setEditKegiatan] = useState('');
  const [editDetail, setEditDetail] = useState('');
  const [editIsOvertime, setEditIsOvertime] = useState(false);

  // Group entries by date
  const groupedByDate: { [date: string]: TimesheetEntry[] } = {};
  
  entries.forEach((entry) => {
    if (!groupedByDate[entry.date]) {
      groupedByDate[entry.date] = [];
    }
    groupedByDate[entry.date].push(entry);
  });

  // Sort dates (newest first)
  const sortedDates = Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a));

  // Sort entries within each date by start time
  sortedDates.forEach((date) => {
    groupedByDate[date].sort((a, b) => a.startTime.localeCompare(b.startTime));
  });

  const handleStartEdit = (entry: TimesheetEntry) => {
    setEditingId(entry.id);
    setEditDate(entry.date);
    setEditStart(entry.startTime);
    setEditEnd(entry.endTime);
    setEditProject(entry.projectPurpose);
    setEditKegiatan(entry.kegiatan);
    setEditDetail(entry.detailKegiatan);
    setEditIsOvertime(entry.isOvertime);
  };

  const handleSaveEdit = (id: string) => {
    if (!editKegiatan.trim()) return;

    // Calculate updated hours based on edit start/end times
    const duration = calculateDuration(editStart, editEnd);

    onUpdateEntry({
      id,
      date: editDate,
      startTime: editStart,
      endTime: editEnd,
      projectPurpose: editProject || 'IBMS',
      kegiatan: editKegiatan,
      detailKegiatan: editDetail,
      normalHours: !editIsOvertime ? duration : 0,
      lemburHours: editIsOvertime ? duration : 0,
      isOvertime: editIsOvertime,
    });

    setEditingId(null);
  };

  const handleAddManualEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualKegiatan.trim()) return;

    const duration = calculateDuration(manualStart, manualEnd);

    onAddEntry({
      date: manualDate,
      startTime: manualStart,
      endTime: manualEnd,
      projectPurpose: manualProject || 'IBMS',
      kegiatan: manualKegiatan,
      detailKegiatan: manualDetail,
      normalHours: !manualIsOvertime ? duration : 0,
      lemburHours: manualIsOvertime ? duration : 0,
      isOvertime: manualIsOvertime,
    });

    // Reset manual form
    setManualKegiatan('');
    setManualDetail('');
    setShowManualForm(false);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-slate-200/50 overflow-hidden">
      {/* Table Toolbar controls */}
      <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-50/40">
        <div>
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-sans flex items-center gap-1.5">
            📋 Lembar Kerja Timesheet
          </h3>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">
            Format visual tabel Excel dengan fitur pengelompokan tanggal otomatis.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setShowActions(!showActions)}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-slate-200/80 hover:bg-slate-50 text-slate-500 rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            {showActions ? <EyeOff size={13} /> : <Eye size={13} />}
            {showActions ? 'Sembunyikan' : 'Aksi'}
          </button>
          
          <button
            onClick={() => setShowManualForm(!showManualForm)}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer shadow-xs"
          >
            <Plus size={13} />
            Tambah Manual
          </button>
        </div>
      </div>

      {/* Manual Entry Form (Collapsible) */}
      {showManualForm && (
        <form onSubmit={handleAddManualEntry} className="p-5 border-b border-slate-100 bg-indigo-50/15 grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-12 font-bold text-[10px] text-indigo-700 tracking-wider uppercase flex items-center gap-1.5">
            <Plus size={13} /> Tambah Jam Kerja Secara Manual
          </div>

          <div className="md:col-span-2">
            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tanggal</label>
            <input
              type="date"
              value={manualDate}
              onChange={(e) => setManualDate(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              required
            />
          </div>

          <div className="md:col-span-2 grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Start</label>
              <input
                type="time"
                value={manualStart}
                onChange={(e) => setManualStart(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">End</label>
              <input
                type="time"
                value={manualEnd}
                onChange={(e) => setManualEnd(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                required
              />
            </div>
          </div>

          <div className="md:col-span-1.5">
            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Project</label>
            <input
              type="text"
              placeholder="e.g. IBMS"
              value={manualProject}
              onChange={(e) => setManualProject(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 uppercase"
              required
            />
          </div>

          <div className="md:col-span-3">
            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Kegiatan</label>
            <input
              type="text"
              placeholder="Contoh: Setup Environment"
              value={manualKegiatan}
              onChange={(e) => setManualKegiatan(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              required
            />
          </div>

          <div className="md:col-span-3">
            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Detail Kegiatan</label>
            <input
              type="text"
              placeholder="Contoh: Merapikan kelas Tailwind..."
              value={manualDetail}
              onChange={(e) => setManualDetail(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="md:col-span-1 flex items-end pb-1.5">
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={manualIsOvertime}
                onChange={(e) => setManualIsOvertime(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
              />
              <span className="text-[11px] font-medium text-slate-500">Lembur</span>
            </label>
          </div>

          <div className="md:col-span-12 flex items-center justify-end gap-2 border-t border-slate-100/70 pt-3 mt-1">
            <button
              type="button"
              onClick={() => setShowManualForm(false)}
              className="px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg transition shadow-sm cursor-pointer"
            >
              Simpan Jam Kerja
            </button>
          </div>
        </form>
      )}

      {/* Excel Sheet Visual Frame */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border-spacing-0 text-left text-xs font-sans">
          <thead>
            {/* Header Row 1 */}
            <tr className="bg-slate-50 text-slate-700 text-center font-bold select-none border-b border-slate-200">
              <th rowSpan={2} className="border border-slate-200/70 p-2.5 font-bold text-slate-700 align-middle min-w-[130px] bg-slate-50/50">
                Hari, Tanggal
              </th>
              <th colSpan={2} className="border border-slate-200/70 p-2 text-slate-700 font-bold align-middle bg-slate-50/50">
                Jam Kerja
              </th>
              <th rowSpan={2} className="border border-slate-200/70 p-2.5 text-slate-700 font-bold align-middle min-w-[90px] bg-slate-50/50">
                Project Purpose
              </th>
              <th rowSpan={2} className="border border-slate-200/70 p-2.5 text-slate-700 font-bold align-middle min-w-[150px] bg-slate-50/50">
                Kegiatan
              </th>
              <th rowSpan={2} className="border border-slate-200/70 p-2.5 text-slate-700 font-bold align-middle min-w-[220px] bg-slate-50/50">
                Detail Kegiatan
              </th>
              <th rowSpan={2} className="border border-slate-200/70 p-2.5 text-slate-700 font-bold align-middle min-w-[75px] bg-slate-50/50">
                Total hours
              </th>
              <th rowSpan={2} className="border border-slate-200/70 p-2.5 text-slate-700 font-bold align-middle min-w-[75px] bg-slate-50/50">
                Normal Hours
              </th>
              <th rowSpan={2} className="border border-slate-200/70 p-2.5 text-slate-700 font-bold align-middle min-w-[75px] bg-slate-50/50">
                Lembur Hours
              </th>
              {showActions && (
                <th rowSpan={2} className="border border-slate-200/70 p-2.5 text-slate-700 font-bold align-middle min-w-[90px] bg-slate-50/50">
                  Aksi
                </th>
              )}
            </tr>
            {/* Header Sub-Row 2 */}
            <tr className="bg-slate-50 text-slate-700 text-center font-bold select-none border-b border-slate-200">
              <th className="border border-slate-200/70 px-2 py-1.5 font-semibold text-slate-500 text-[11px] bg-slate-50/50">Start</th>
              <th className="border border-slate-200/70 px-2 py-1.5 font-semibold text-slate-500 text-[11px] bg-slate-50/50">End</th>
            </tr>
          </thead>
          <tbody>
            {sortedDates.length === 0 ? (
              <tr>
                <td colSpan={showActions ? 10 : 9} className="border border-slate-200/50 p-10 text-center text-slate-400 font-sans italic">
                  <div className="flex flex-col items-center gap-2.5">
                    <AlertCircle size={20} className="text-slate-300" />
                    <span className="text-xs font-medium text-slate-400">Belum ada data timesheet yang tersimpan. Mulai tracker di atas atau tambah secara manual!</span>
                  </div>
                </td>
              </tr>
            ) : (
              sortedDates.map((date) => {
                const dateEntries = groupedByDate[date];
                const totalDateHours = dateEntries.reduce((sum, entry) => {
                  return sum + entry.normalHours + entry.lemburHours;
                }, 0);

                return dateEntries.map((entry, idx) => {
                  const isEditing = editingId === entry.id;

                  return (
                    <tr 
                      key={entry.id} 
                      className={`hover:bg-slate-50/30 border-b border-slate-200/50 transition-colors ${
                        entry.isOvertime ? 'bg-amber-50/10' : ''
                      }`}
                    >
                      {/* Hari, Tanggal (Merged cell on first row of each date block) */}
                      {idx === 0 && (
                        <td 
                          rowSpan={dateEntries.length} 
                          className="border border-slate-200/50 p-3 font-semibold text-slate-700 align-middle text-center bg-slate-50/20 select-none text-xs"
                        >
                          {formatIndonesianDate(date)}
                        </td>
                      )}

                      {/* Jam Kerja Start */}
                      <td className="border border-slate-200/50 p-2.5 text-center font-mono align-middle text-slate-600 text-xs">
                        {isEditing ? (
                          <input
                            type="time"
                            value={editStart}
                            onChange={(e) => setEditStart(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded px-1 py-0.5 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        ) : (
                          entry.startTime
                        )}
                      </td>

                      {/* Jam Kerja End */}
                      <td className="border border-slate-200/50 p-2.5 text-center font-mono align-middle text-slate-600 text-xs">
                        {isEditing ? (
                          <input
                            type="time"
                            value={editEnd}
                            onChange={(e) => setEditEnd(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded px-1 py-0.5 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        ) : (
                          entry.endTime
                        )}
                      </td>

                      {/* Project Purpose */}
                      <td className="border border-slate-200/50 p-2.5 text-center font-semibold text-slate-500 align-middle text-xs">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editProject}
                            onChange={(e) => setEditProject(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded px-1.5 py-0.5 text-xs uppercase focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        ) : (
                          entry.projectPurpose
                        )}
                      </td>

                      {/* Kegiatan */}
                      <td className="border border-slate-200/50 p-2.5 font-medium text-slate-700 align-middle text-xs">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editKegiatan}
                            onChange={(e) => setEditKegiatan(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded px-1.5 py-0.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        ) : (
                          entry.kegiatan
                        )}
                      </td>

                      {/* Detail Kegiatan */}
                      <td className="border border-slate-200/50 p-3 text-slate-400 leading-relaxed align-middle whitespace-pre-wrap text-[11px] font-medium">
                        {isEditing ? (
                          <textarea
                            value={editDetail}
                            onChange={(e) => setEditDetail(e.target.value)}
                            rows={2}
                            className="w-full bg-white border border-slate-200 rounded px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        ) : (
                          entry.detailKegiatan || '-'
                        )}
                      </td>

                      {/* Total Hours of the Date Group (Merged cell on first row) */}
                      {idx === 0 && (
                        <td 
                          rowSpan={dateEntries.length} 
                          className="border border-slate-200/50 p-2.5 font-bold text-center text-indigo-650 align-middle bg-indigo-50/10 text-xs font-mono select-none"
                        >
                          {formatDecimal(totalDateHours, settings.decimalSeparator)}
                        </td>
                      )}

                      {/* Normal Hours */}
                      <td className="border border-slate-200/50 p-2.5 text-center font-mono align-middle text-slate-600 text-xs">
                        {isEditing ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <input
                              type="checkbox"
                              checked={!editIsOvertime}
                              onChange={(e) => setEditIsOvertime(!e.target.checked)}
                              className="rounded border-slate-300 text-indigo-650 focus:ring-indigo-500 h-3 w-3"
                            />
                            <span className="text-[10px] text-slate-400 font-bold uppercase">Normal</span>
                          </div>
                        ) : (
                          !entry.isOvertime ? formatDecimal(entry.normalHours, settings.decimalSeparator) : '-'
                        )}
                      </td>

                      {/* Lembur Hours */}
                      <td className="border border-slate-200/50 p-2.5 text-center font-mono align-middle text-amber-700 text-xs">
                        {isEditing ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <input
                              type="checkbox"
                              checked={editIsOvertime}
                              onChange={(e) => setEditIsOvertime(e.target.checked)}
                              className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 h-3 w-3"
                            />
                            <span className="text-[10px] text-slate-400 font-bold uppercase">Lembur</span>
                          </div>
                        ) : (
                          entry.isOvertime ? formatDecimal(entry.lemburHours, settings.decimalSeparator) : '-'
                        )}
                      </td>

                      {/* Actions */}
                      {showActions && (
                        <td className="border border-slate-200/50 p-2.5 text-center align-middle bg-slate-50/10">
                          {isEditing ? (
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleSaveEdit(entry.id)}
                                className="p-1 text-emerald-600 hover:bg-emerald-50 rounded transition cursor-pointer"
                                title="Simpan Edit"
                              >
                                <Check size={13} />
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="p-1 text-slate-400 hover:bg-slate-100 rounded transition cursor-pointer"
                                title="Batal Edit"
                              >
                                <X size={13} />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleStartEdit(entry)}
                                className="p-1 text-indigo-500 hover:bg-indigo-50 rounded transition cursor-pointer"
                                title="Edit Entri"
                              >
                                <Edit3 size={12} />
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm('Hapus entri timesheet ini?')) {
                                    onDeleteEntry(entry.id);
                                  }
                                }}
                                className="p-1 text-red-500 hover:bg-red-50 rounded transition cursor-pointer"
                                title="Hapus Entri"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                });
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
