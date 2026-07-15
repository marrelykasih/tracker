/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Award, Clock, Flame, Calendar, TrendingUp } from 'lucide-react';
import { TimesheetEntry, AppSettings } from '../types';
import { formatDecimal } from '../utils/timeUtils';

interface StatisticsCardsProps {
  entries: TimesheetEntry[];
  settings: AppSettings;
}

export default function StatisticsCards({ entries, settings }: StatisticsCardsProps) {
  const todayStr = new Date().toISOString().split('T')[0];

  // Calculate stats
  let totalHours = 0;
  let totalNormal = 0;
  let totalLembur = 0;
  let todayHours = 0;

  entries.forEach((entry) => {
    totalNormal += entry.normalHours;
    totalLembur += entry.lemburHours;
    totalHours += entry.normalHours + entry.lemburHours;

    if (entry.date === todayStr) {
      todayHours += entry.normalHours + entry.lemburHours;
    }
  });

  // Calculate unique days tracked to show streaks or participation
  const uniqueDays = new Set(entries.map((e) => e.date));
  const totalDaysTracked = uniqueDays.size;

  // Standard workday goal (8 hours) progress
  const standardWorkdayGoal = 8;
  const todayProgressPercent = Math.min(100, Math.round((todayHours / standardWorkdayGoal) * 100));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Today's Hours Card */}
      <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/50 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Jam Kerja Hari Ini
          </span>
          <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
            <Clock size={15} />
          </span>
        </div>
        
        <div className="mt-4">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-slate-900 font-mono tracking-tight">
              {formatDecimal(todayHours, settings.decimalSeparator)}
            </span>
            <span className="text-xs text-slate-400 font-medium">Jam</span>
          </div>

          {/* Workday Goal Progress bar */}
          <div className="mt-3">
            <div className="flex justify-between text-[10px] font-semibold text-slate-400 mb-1">
              <span>Goal harian ({standardWorkdayGoal} jam)</span>
              <span>{todayProgressPercent}%</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${todayProgressPercent}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Normal Hours Card */}
      <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/50 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Total Jam Normal
          </span>
          <span className="p-1.5 bg-slate-50 text-slate-600 rounded-lg">
            <TrendingUp size={15} />
          </span>
        </div>
        
        <div className="mt-4">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-slate-900 font-mono tracking-tight">
              {formatDecimal(totalNormal, settings.decimalSeparator)}
            </span>
            <span className="text-xs text-slate-400 font-medium">Jam</span>
          </div>
          <p className="text-[10px] text-slate-400 font-medium mt-1">
            Total porsi waktu kerja regular Anda
          </p>
        </div>
      </div>

      {/* Overtime Hours Card */}
      <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/50 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Total Jam Lembur
          </span>
          <span className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
            <Award size={15} />
          </span>
        </div>
        
        <div className="mt-4">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-slate-900 font-mono tracking-tight">
              {formatDecimal(totalLembur, settings.decimalSeparator)}
            </span>
            <span className="text-xs text-slate-400 font-medium">Jam</span>
          </div>
          <p className="text-[10px] text-slate-400 font-medium mt-1">
            Total akumulasi overtime (lembur)
          </p>
        </div>
      </div>

      {/* Total Active Days Card */}
      <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/50 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Hari Aktif Tercatat
          </span>
          <span className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
            <Flame size={15} className="animate-pulse" />
          </span>
        </div>
        
        <div className="mt-4">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-slate-900 font-mono tracking-tight">
              {totalDaysTracked}
            </span>
            <span className="text-xs text-slate-400 font-medium">Hari</span>
          </div>
          <p className="text-[10px] text-slate-400 font-medium mt-1">
            {totalDaysTracked > 0 
              ? `Hebat! Anda rajin mencatat timesheet.` 
              : 'Mulai isi untuk membangun produktivitas!'}
          </p>
        </div>
      </div>
    </div>
  );
}
