/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface TimesheetEntry {
  id: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  projectPurpose: string; // e.g., IBMS
  kegiatan: string; // Activity Title
  detailKegiatan: string; // Activity Details
  normalHours: number; // e.g., 1.5
  lemburHours: number; // e.g., 0.5
  isOvertime: boolean;
}

export interface AppSettings {
  decimalSeparator: ',' | '.';
  csvDelimiter: ';' | ',';
  hourlyReminder: boolean;
  reminderInterval: number; // in minutes
  reminderSound: boolean;
  projects: string[];
}

export interface ActiveTracker {
  startTime: string; // ISO string
  projectPurpose: string;
  kegiatan: string;
  detailKegiatan: string;
  isOvertime: boolean;
}
