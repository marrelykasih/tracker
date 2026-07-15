/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Download, Settings as SettingsIcon, ClipboardList, Info, FileText, CheckCircle, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TimesheetEntry, AppSettings } from './types';
import { exportToCSV } from './utils/timeUtils';
import ActiveTrackerCard from './components/ActiveTrackerCard';
import TimesheetTable from './components/TimesheetTable';
import StatisticsCards from './components/StatisticsCards';
import SettingsPanel from './components/SettingsPanel';

// Generate some exact sample data from their Excel screenshot for initial load
const DEFAULT_PRELOADED_ENTRIES: TimesheetEntry[] = [
  {
    id: 'sample-1',
    date: '2026-07-08',
    startTime: '08:00',
    endTime: '12:00',
    projectPurpose: 'IBMS',
    kegiatan: 'Setup Environment & Bug Fixing UI',
    detailKegiatan: 'Menyelesaikan error instalasi Type Definitions TypeScript untuk React dan merapikan sistem class Tailwind CSS pada file komponen DistributionPage.tsx.',
    normalHours: 1.5,
    lemburHours: 0,
    isOvertime: false
  },
  {
    id: 'sample-2',
    date: '2026-07-08',
    startTime: '09:30',
    endTime: '11:30',
    projectPurpose: 'IBMS',
    kegiatan: 'Integrasi API Modul Tracking & Map Leaflet',
    detailKegiatan: 'Membuat proxy endpoint API di server.ts dan memetakan koordinat JSON ke peta Leaflet (TrackingPage.tsx). Menangani error state, fitur fallback data lokal, dan pengujian tombol playback simulasi pergerakan rute.',
    normalHours: 2.0,
    lemburHours: 0,
    isOvertime: false
  },
  {
    id: 'sample-3',
    date: '2026-07-08',
    startTime: '11:30',
    endTime: '12:00',
    projectPurpose: 'IBMS',
    kegiatan: 'Mempelajari dokumen spesifikasi RBAC untuk persiapan implementasi pembatasan menu/halaman',
    detailKegiatan: 'Menganalisis matriks hak akses pada dokumen referensi (FSD-bms-core) untuk memetakan role user (Admin, Mandor, Pekerja) dan merencanakan logika penyembunyian menu/halaman (route guard) pada frontend.',
    normalHours: 0.3,
    lemburHours: 0,
    isOvertime: false
  },
  {
    id: 'sample-4',
    date: '2026-07-08',
    startTime: '12:00',
    endTime: '13:00',
    projectPurpose: 'IBMS',
    kegiatan: 'ishoma',
    detailKegiatan: 'Istirahat, sholat, makan siang harian.',
    normalHours: 1.0,
    lemburHours: 0,
    isOvertime: false
  },
  {
    id: 'sample-5',
    date: '2026-07-08',
    startTime: '13:00',
    endTime: '16:00',
    projectPurpose: 'IBMS',
    kegiatan: 'Eksplorasi & Perencanaan Alur RBAC',
    detailKegiatan: 'Mempelajari lebih dalam konsep Role-Based Access Control (RBAC) pada frontend React, serta merencanakan alur logika untuk pembatasan akses menu Sidebar dan perlindungan jalur halaman (route guards) berdasarkan role user.',
    normalHours: 5.0,
    lemburHours: 0,
    isOvertime: false
  },
  {
    id: 'sample-6',
    date: '2026-07-08',
    startTime: '16:00',
    endTime: '16:20',
    projectPurpose: 'IBMS',
    kegiatan: 'Version Control & Sinkronisasi Git',
    detailKegiatan: 'Melakukan setup Git, membuat branch lokal baru (ibms-kasih-update).',
    normalHours: 0.2,
    lemburHours: 0,
    isOvertime: false
  },
  {
    id: 'sample-7',
    date: '2026-07-08',
    startTime: '16:20',
    endTime: '16:35',
    projectPurpose: 'IBMS',
    kegiatan: 'daily stand up',
    detailKegiatan: 'Melakukan pelaporan kemajuan pekerjaan harian kepada tim pimpinan.',
    normalHours: 0.15,
    lemburHours: 0,
    isOvertime: false
  },
  {
    id: 'sample-8',
    date: '2026-07-08',
    startTime: '16:35',
    endTime: '17:00',
    projectPurpose: 'ibms',
    kegiatan: 'ishoma',
    detailKegiatan: 'Istirahat sholat ashar sejenak.',
    normalHours: 0.25,
    lemburHours: 0,
    isOvertime: false
  },
  {
    id: 'sample-9',
    date: '2026-07-08',
    startTime: '17:00',
    endTime: '17:15',
    projectPurpose: 'IBMS',
    kegiatan: 'Bersih-bersih dan merapikan peralatan kerja',
    detailKegiatan: 'Merapikan meja kerja dan melakukan check-out kantor.',
    normalHours: 0.15,
    lemburHours: 0,
    isOvertime: false
  }
];

const DEFAULT_SETTINGS: AppSettings = {
  decimalSeparator: ',',
  csvDelimiter: ';',
  hourlyReminder: true,
  reminderInterval: 60,
  reminderSound: true,
  projects: ['IBMS', 'CORE', 'INTERNAL', 'SUPPORT']
};

export default function App() {
  const [entries, setEntries] = useState<TimesheetEntry[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [showSettingsSidebar, setShowSettingsSidebar] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load from localStorage
  useEffect(() => {
    const storedEntries = localStorage.getItem('timesheet_entries_v1');
    const storedSettings = localStorage.getItem('timesheet_settings_v1');

    if (storedEntries) {
      try {
        setEntries(JSON.parse(storedEntries));
      } catch (e) {
        setEntries(DEFAULT_PRELOADED_ENTRIES);
      }
    } else {
      // First run: seed with exact mockup values from the user's Excel file!
      setEntries(DEFAULT_PRELOADED_ENTRIES);
      localStorage.setItem('timesheet_entries_v1', JSON.stringify(DEFAULT_PRELOADED_ENTRIES));
    }

    if (storedSettings) {
      try {
        setSettings(JSON.parse(storedSettings));
      } catch (e) {
        setSettings(DEFAULT_SETTINGS);
      }
    }
  }, []);

  // Show a brief success toast
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSaveEntry = (newEntry: Omit<TimesheetEntry, 'id'>) => {
    const entryWithId: TimesheetEntry = {
      ...newEntry,
      id: `entry-${Date.now()}`
    };

    const updated = [entryWithId, ...entries];
    setEntries(updated);
    localStorage.setItem('timesheet_entries_v1', JSON.stringify(updated));
    triggerToast('Entri timesheet baru berhasil disimpan!');
  };

  const handleUpdateEntry = (updatedEntry: TimesheetEntry) => {
    const updated = entries.map((e) => (e.id === updatedEntry.id ? updatedEntry : e));
    setEntries(updated);
    localStorage.setItem('timesheet_entries_v1', JSON.stringify(updated));
    triggerToast('Data timesheet berhasil diperbarui!');
  };

  const handleDeleteEntry = (id: string) => {
    const updated = entries.filter((e) => e.id !== id);
    setEntries(updated);
    localStorage.setItem('timesheet_entries_v1', JSON.stringify(updated));
    triggerToast('Entri timesheet berhasil dihapus.');
  };

  const handleUpdateSettings = (updatedSettings: AppSettings) => {
    setSettings(updatedSettings);
    localStorage.setItem('timesheet_settings_v1', JSON.stringify(updatedSettings));
  };

  const handleAddProjectPreset = (project: string) => {
    if (settings.projects.includes(project)) return;
    const updatedProjects = [...settings.projects, project];
    handleUpdateSettings({
      ...settings,
      projects: updatedProjects
    });
  };

  const handleImportBackup = (imported: TimesheetEntry[]) => {
    setEntries(imported);
    localStorage.setItem('timesheet_entries_v1', JSON.stringify(imported));
    triggerToast('Semua data berhasil dipulihkan dari cadangan!');
  };

  const handleDownloadCSV = () => {
    if (entries.length === 0) {
      alert('Tidak ada data timesheet untuk diunduh. Silakan catat aktivitas terlebih dahulu!');
      return;
    }

    const csvContent = exportToCSV(entries, settings);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `timesheet_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast('Berkas CSV berhasil diunduh!');
  };

  return (
    <div className="min-h-screen bg-[#fcfdfe] text-slate-800 font-sans antialiased pb-12">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-2.5 border border-slate-800"
          >
            <CheckCircle size={15} className="text-emerald-400" />
            <span className="text-xs font-medium">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Header / Navigation rail */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-100">
              <ClipboardList size={20} />
            </div>
            <div>
              <h1 className="text-lg font-bold font-display text-slate-900 tracking-tight">
                Daily Timesheet Tracker
              </h1>
              <p className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                Isi Timesheet Tanpa Ribet & Teratur (Excel-Ready)
                <span className="h-1 w-1 bg-slate-300 rounded-full"></span>
                <span>v1.0</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Settings toggler button */}
            <button
              onClick={() => setShowSettingsSidebar(!showSettingsSidebar)}
              className={`px-4 py-2 rounded-xl border border-slate-200/80 hover:bg-slate-50 text-slate-600 transition inline-flex items-center gap-1.5 text-xs font-semibold cursor-pointer ${
                showSettingsSidebar ? 'bg-slate-100/80 border-slate-300 text-slate-900' : 'bg-white'
              }`}
            >
              <SettingsIcon size={14} className={showSettingsSidebar ? 'animate-spin-slow' : ''} />
              <span>Pengaturan</span>
            </button>

            {/* CSV Exporter button */}
            <button
              onClick={handleDownloadCSV}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white px-5 py-2 rounded-xl font-semibold text-xs transition shadow-sm cursor-pointer"
            >
              <Download size={14} />
              Unduh CSV
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Help banner for new users */}
        <div className="bg-slate-50 border border-slate-200/50 rounded-2xl p-5 mb-6 flex gap-3.5 shadow-xs">
          <Info size={16} className="text-indigo-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-slate-800 font-sans tracking-wide uppercase">
              Selamat datang di Daily Timesheet Tracker!
            </h4>
            <p className="text-[11px] text-slate-500 leading-relaxed mt-1 font-medium">
              Aplikasi ini membantu Anda mencatat aktivitas pekerjaan harian secara presisi tanpa perlu mengingat-ingat atau mengisi Excel secara manual setiap sore. Gunakan <strong>Mulai Catat Jam Kerja</strong> untuk mengaktifkan tracker waktu live yang terus menghitung jam kerja Anda, atau tambahkan jam kerja Anda secara manual lewat tombol <strong>Tambah Manual</strong> di bawah. Anda bisa mengekspor data ke Microsoft Excel langsung rapi lewat tombol <strong>Unduh CSV</strong>.
            </p>
          </div>
        </div>

        {/* Statistics Cards dashboard widgets */}
        <StatisticsCards entries={entries} settings={settings} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main working content: Tracker + Spreadsheet Table */}
          <div className={`lg:col-span-12 ${showSettingsSidebar ? 'lg:col-span-8' : 'lg:col-span-12'} transition-all duration-300 space-y-6`}>
            {/* Active task tracker card */}
            <ActiveTrackerCard 
              settings={settings} 
              onSaveEntry={handleSaveEntry} 
              onAddProject={handleAddProjectPreset}
            />

            {/* The Excel sheet styled visual list */}
            <TimesheetTable 
              entries={entries} 
              settings={settings} 
              onUpdateEntry={handleUpdateEntry}
              onDeleteEntry={handleDeleteEntry}
              onAddEntry={handleSaveEntry}
            />
          </div>

          {/* Right sidebar settings layout (Collapsible) */}
          {showSettingsSidebar && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-4"
            >
              <SettingsPanel 
                settings={settings} 
                onUpdateSettings={handleUpdateSettings}
                entries={entries}
                onImportEntries={handleImportBackup}
              />
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
