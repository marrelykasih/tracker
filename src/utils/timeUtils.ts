/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TimesheetEntry, AppSettings } from '../types';

/**
 * Calculates the difference in hours between two HH:MM time strings.
 * Returns a decimal number.
 */
export function calculateDuration(start: string, end: string): number {
  if (!start || !end) return 0;
  const [startHour, startMin] = start.split(':').map(Number);
  const [endHour, endMin] = end.split(':').map(Number);

  if (isNaN(startHour) || isNaN(startMin) || isNaN(endHour) || isNaN(endMin)) {
    return 0;
  }

  let durationMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
  
  // Handle overnight shift if end is earlier than start
  if (durationMinutes < 0) {
    durationMinutes += 24 * 60;
  }

  return Number((durationMinutes / 60).toFixed(2));
}

/**
 * Formats a decimal number into a string with a specified decimal separator and 2 decimal places.
 * Example: 1.5 -> "1,50" or "1.50"
 */
export function formatDecimal(value: number, separator: ',' | '.'): string {
  if (value === 0) return '-';
  const formatted = value.toFixed(2);
  if (separator === ',') {
    return formatted.replace('.', ',');
  }
  return formatted;
}

/**
 * Formats a YYYY-MM-DD date string into an Indonesian friendly date format.
 * Example: 2026-07-14 -> "Selasa, 14/07/2026"
 */
export function formatIndonesianDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;

  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const dayName = days[date.getDay()];
  
  const [year, month, day] = dateStr.split('-');
  return `${dayName}, ${day}/${month}/${year}`;
}

/**
 * Formats time from Date object to HH:MM format
 */
export function formatTime24h(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Formats seconds into HH:MM:SS string for live tracker
 */
export function formatElapsedSeconds(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  return [
    String(hrs).padStart(2, '0'),
    String(mins).padStart(2, '0'),
    String(secs).padStart(2, '0')
  ].join(':');
}

/**
 * Generates CSV content from timesheet entries based on settings.
 */
export function exportToCSV(entries: TimesheetEntry[], settings: AppSettings): string {
  const delimiter = settings.csvDelimiter;
  const decSep = settings.decimalSeparator;

  // Header exactly matching image structure
  const headers = [
    'Tanggal',
    'Jam Kerja Start',
    'Jam Kerja End',
    'Project Purpose',
    'Kegiatan',
    'Detail Kegiatan',
    'Normal Hours',
    'Lembur Hours'
  ];

  const csvRows = [headers.join(delimiter)];

  // Group by date to match the visual layout structure if needed, or output sequential rows
  // Sorting chronologically (newest first or oldest first)
  const sortedEntries = [...entries].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.startTime.localeCompare(b.startTime);
  });

  for (const entry of sortedEntries) {
    const row = [
      formatIndonesianDate(entry.date),
      entry.startTime,
      entry.endTime,
      `"${entry.projectPurpose.replace(/"/g, '""')}"`,
      `"${entry.kegiatan.replace(/"/g, '""')}"`,
      `"${entry.detailKegiatan.replace(/"/g, '""')}"`,
      formatDecimal(entry.normalHours, decSep),
      formatDecimal(entry.lemburHours, decSep)
    ];
    csvRows.push(row.join(delimiter));
  }

  return csvRows.join('\r\n');
}

/**
 * Play a gentle alert notification chime
 */
export function playChime() {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Play a friendly warm double-tone chime
    const playTone = (frequency: number, startTime: number, duration: number) => {
      const osc = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      osc.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, startTime);
      
      gainNode.gain.setValueAtTime(0.15, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const now = audioContext.currentTime;
    playTone(523.25, now, 0.4); // C5
    playTone(659.25, now + 0.15, 0.5); // E5
  } catch (error) {
    console.warn('Audio chime failed to play:', error);
  }
}
