export type UserRole = 'employee' | 'admin';

export interface User {
  id: string;
  name: string;
  role: UserRole;
}

export type AttendanceEventType = 'IN' | 'OUT' | 'BREAK_START' | 'BREAK_END';

export interface AttendanceLog {
  id: string;
  userId: string;
  timestamp: string; // ISO string
  type: AttendanceEventType;
}

export interface DailySummary {
  date: string; // YYYY-MM-DD
  totalWorkTime: number; // in minutes
  totalBreakTime: number; // in minutes
  isEveningShift: boolean;
  logs: AttendanceLog[];
}