/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Settings, Volume2, Globe, Trash2, Plus, Download, Upload, AlertTriangle, Check, RefreshCw } from 'lucide-react';
import { AppSettings, TimesheetEntry } from '../types';

interface SettingsPanelProps {
  settings: AppSettings;
  onUpdateSettings: (settings: AppSettings) => void;
  entries: TimesheetEntry[];
  onImportEntries: (entries: TimesheetEntry[]) => void;
}

export default function SettingsPanel({
  settings,
  onUpdateSettings,
  entries,
  onImportEntries
}: SettingsPanelProps) {
  const [newProject, setNewProject] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);

  // Toggle boolean settings
  const toggleSetting = (key: keyof Omit<AppSettings, 'projects' | 'decimalSeparator' | 'csvDelimiter' | 'reminderInterval'>) => {
    onUpdateSettings({
      ...settings,
      [key]: !settings[key]
    });
  };

  // Set decimal separator and automatic delimiter recommendation
  const handleDecimalChange = (val: ',' | '.') => {
    // Usually if decimal is comma, CSV delimiter should be semicolon for Excel (Indonesian standard)
    const recommendedDelimiter = val === ',' ? ';' : ',';
    onUpdateSettings({
      ...settings,
      decimalSeparator: val,
      csvDelimiter: recommendedDelimiter
    });
  };

  const handleDelimiterChange = (val: ';' | ',') => {
    onUpdateSettings({
      ...settings,
      csvDelimiter: val
    });
  };

  const handleIntervalChange = (val: number) => {
    onUpdateSettings({
      ...settings,
      reminderInterval: val
    });
  };

  // Add project to presets
  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanProject = newProject.trim().toUpperCase();
    if (!cleanProject || settings.projects.includes(cleanProject)) return;

    onUpdateSettings({
      ...settings,
      projects: [...settings.projects, cleanProject]
    });
    setNewProject('');
  };

  // Remove project from presets
  const handleRemoveProject = (projectToRemove: string) => {
    onUpdateSettings({
      ...settings,
      projects: settings.projects.filter((p) => p !== projectToRemove)
    });
  };

  // Export JSON backup
  const handleExportBackup = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(entries, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `timesheet_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import JSON backup
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    setImportSuccess(false);
    const fileReader = new FileReader();
    const files = e.target.files;

    if (!files || files.length === 0) return;

    fileReader.readAsText(files[0], "UTF-8");
    fileReader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          // Basic schema verification
          const isValid = parsed.every(entry => 
            entry.id && 
            entry.date && 
            entry.startTime && 
            entry.endTime && 
            entry.projectPurpose
          );

          if (isValid) {
            onImportEntries(parsed as TimesheetEntry[]);
            setImportSuccess(true);
            // Reset input value so it can be re-triggered
            e.target.value = '';
          } else {
            setImportError('Format berkas tidak cocok. Pastikan mengimpor berkas cadangan timesheet JSON yang valid.');
          }
        } else {
          setImportError('Data cadangan harus berupa daftar list (Array).');
        }
      } catch (err) {
        setImportError('Gagal membaca berkas JSON. Berkas mungkin rusak.');
      }
    };
  };

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-slate-200/50 p-6 space-y-6">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
        <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
          <Settings size={16} />
        </span>
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-sans">
          Pengaturan Aplikasi (Settings)
        </h3>
      </div>

      {/* Regional Formatting Section */}
      <div className="space-y-4">
        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Format Visual & CSV (Excel)
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Decimal Separator */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Pemisah Desimal (Decimal)
            </label>
            <div className="flex bg-slate-50 border border-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => handleDecimalChange(',')}
                className={`flex-1 text-center py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                  settings.decimalSeparator === ',' 
                    ? 'bg-white text-indigo-600 shadow-xs border border-slate-100' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Koma (e.g. 1,50)
              </button>
              <button
                type="button"
                onClick={() => handleDecimalChange('.')}
                className={`flex-1 text-center py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                  settings.decimalSeparator === '.' 
                    ? 'bg-white text-indigo-600 shadow-xs border border-slate-100' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Titik (e.g. 1.50)
              </button>
            </div>
          </div>

          {/* CSV Delimiter */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Pemisah Kolom CSV (Delimiter)
            </label>
            <div className="flex bg-slate-50 border border-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => handleDelimiterChange(';')}
                className={`flex-1 text-center py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                  settings.csvDelimiter === ';' 
                    ? 'bg-white text-indigo-600 shadow-xs border border-slate-100' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Titik Koma ( ; )
              </button>
              <button
                type="button"
                onClick={() => handleDelimiterChange(',')}
                className={`flex-1 text-center py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                  settings.csvDelimiter === ',' 
                    ? 'bg-white text-indigo-600 shadow-xs border border-slate-100' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Koma ( , )
              </button>
            </div>
          </div>
        </div>
        <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
          💡 Tips: Gunakan <strong>Koma</strong> & <strong>Titik Koma (;)</strong> agar hasil unduh CSV langsung rapi terbagi kolom saat dibuka di Microsoft Excel regional Indonesia.
        </p>
      </div>

      {/* Reminder settings */}
      <div className="space-y-4 border-t border-slate-100 pt-5">
        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Pengingat Jam & Alarm (Reminders)
        </h4>

        <div className="space-y-3.5">
          {/* Toggle Alert Reminder */}
          <div className="flex items-center justify-between">
            <div>
              <span className="block text-xs font-semibold text-slate-700">Aktifkan Pengingat Jam Kerja</span>
              <span className="text-[10px] text-slate-400 font-medium">Beri tahu secara visual saat tracker sedang menyala</span>
            </div>
            <label className="relative flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.hourlyReminder}
                onChange={() => toggleSetting('hourlyReminder')}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          {/* Toggle Sound Alarm */}
          <div className="flex items-center justify-between">
            <div>
              <span className="block text-xs font-semibold text-slate-700">Bunyi Lonceng Pengingat (Audio Chime)</span>
              <span className="text-[10px] text-slate-400 font-medium">Bunyikan nada lonceng manis di browser setiap interval habis</span>
            </div>
            <label className="relative flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.reminderSound}
                onChange={() => toggleSetting('reminderSound')}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          {/* Reminder Interval Select */}
          {settings.hourlyReminder && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Interval Pengingat
              </label>
              <select
                value={settings.reminderInterval}
                onChange={(e) => handleIntervalChange(Number(e.target.value))}
                className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
              >
                <option value={1}>Setiap 1 Menit (Untuk Demonstrasi/Tes)</option>
                <option value={5}>Setiap 5 Menit</option>
                <option value={15}>Setiap 15 Menit</option>
                <option value={30}>Setiap 30 Menit</option>
                <option value={60}>Setiap 1 Jam (Default)</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Preset Projects lists */}
      <div className="space-y-4 border-t border-slate-100 pt-5">
        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Preset Daftar Project
        </h4>

        {/* Add new project preset form */}
        <form onSubmit={handleAddProject} className="flex gap-2">
          <input
            type="text"
            placeholder="Contoh: IBMS, CORE, INTERNAL"
            value={newProject}
            onChange={(e) => setNewProject(e.target.value)}
            className="flex-1 bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 uppercase focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <button
            type="submit"
            className="bg-indigo-650 hover:bg-indigo-700 text-white font-semibold text-xs px-4 rounded-xl transition inline-flex items-center gap-1 cursor-pointer"
          >
            <Plus size={13} />
            Tambah
          </button>
        </form>

        {/* Existing Projects badged list */}
        <div className="flex flex-wrap gap-1.5">
          {settings.projects.map((p) => (
            <span
              key={p}
              className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200/50 text-slate-700 px-2.5 py-1 rounded-lg text-[10px] font-bold"
            >
              {p}
              <button
                type="button"
                onClick={() => handleRemoveProject(p)}
                className="text-slate-400 hover:text-red-500 transition cursor-pointer"
                title="Hapus Preset"
              >
                <Trash2 size={10} />
              </button>
            </span>
          ))}
          {settings.projects.length === 0 && (
            <span className="text-xs text-slate-400 italic">Belum ada daftar project custom.</span>
          )}
        </div>
      </div>

      {/* Backup & Restore Data section */}
      <div className="space-y-4 border-t border-slate-100 pt-5">
        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Ekspor & Impor Data Cadangan (Backup)
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Download JSON Backup */}
          <button
            type="button"
            onClick={handleExportBackup}
            className="inline-flex items-center justify-center gap-2 px-3 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            <Download size={13} />
            Ekspor Data (.json)
          </button>

          {/* Upload JSON Backup */}
          <label className="relative inline-flex items-center justify-center gap-2 px-3 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-semibold transition cursor-pointer">
            <Upload size={13} />
            Impor Data (.json)
            <input
              type="file"
              accept=".json"
              onChange={handleImportBackup}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </label>
        </div>

        {/* Upload Messages */}
        {importError && (
          <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs font-medium flex items-start gap-1.5 border border-red-200/40">
            <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
            <span>{importError}</span>
          </div>
        )}
        {importSuccess && (
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-medium flex items-start gap-1.5 border border-emerald-200/40">
            <Check size={14} className="mt-0.5 flex-shrink-0" />
            <span>Data cadangan timesheet berhasil dipulihkan!</span>
          </div>
        )}
      </div>
    </div>
  );
}
