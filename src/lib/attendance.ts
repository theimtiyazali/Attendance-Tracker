import { AttendanceLog, AttendanceEventType, DailySummary } from "@/types";

const ATTENDANCE_STORAGE_KEY = "attendance_app_logs";

// Helper to get current date in YYYY-MM-DD format
const getTodayDateString = () => {
  return new Date().toISOString().split('T')[0];
};

// Helper to get logs from local storage
const getStoredLogs = (): AttendanceLog[] => {
  const logsJson = localStorage.getItem(ATTENDANCE_STORAGE_KEY);
  return logsJson ? JSON.parse(logsJson) : [];
};

// Helper to save logs to local storage
const saveLogs = (logs: AttendanceLog[]) => {
  localStorage.setItem(ATTENDANCE_STORAGE_KEY, JSON.stringify(logs));
};

export const recordAttendanceEvent = (userId: string, type: AttendanceEventType): AttendanceLog => {
  const newLog: AttendanceLog = {
    id: Date.now().toString(), // Simple unique ID
    userId,
    timestamp: new Date().toISOString(),
    type,
  };

  const logs = getStoredLogs();
  logs.push(newLog);
  saveLogs(logs);
  return newLog;
};

export const getAttendanceLogsForUser = (userId: string): AttendanceLog[] => {
  const logs = getStoredLogs();
  return logs.filter(log => log.userId === userId).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

export const getDailyLogsForUser = (userId: string, date: string = getTodayDateString()): AttendanceLog[] => {
  const logs = getAttendanceLogsForUser(userId);
  return logs.filter(log => log.timestamp.startsWith(date));
};

export const getCurrentAttendanceStatus = (userId: string): { status: 'Clocked In' | 'Clocked Out' | 'On Break', lastEvent: AttendanceLog | null } => {
  const logs = getAttendanceLogsForUser(userId);
  if (logs.length === 0) {
    return { status: 'Clocked Out', lastEvent: null };
  }

  const sortedLogs = logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const lastEvent = sortedLogs[0];

  if (lastEvent.type === 'IN' || lastEvent.type === 'BREAK_END') {
    // If the last event was IN or BREAK_END, and there's no subsequent OUT or BREAK_START, they are clocked in
    const hasSubsequentOut = sortedLogs.some((log, index) => index < sortedLogs.indexOf(lastEvent) && log.type === 'OUT');
    const hasSubsequentBreakStart = sortedLogs.some((log, index) => index < sortedLogs.indexOf(lastEvent) && log.type === 'BREAK_START');

    if (lastEvent.type === 'IN' && !hasSubsequentOut && !hasSubsequentBreakStart) {
      return { status: 'Clocked In', lastEvent };
    }
    if (lastEvent.type === 'BREAK_END' && !hasSubsequentOut) {
      return { status: 'Clocked In', lastEvent };
    }
  } else if (lastEvent.type === 'BREAK_START') {
    return { status: 'On Break', lastEvent };
  } else if (lastEvent.type === 'OUT') {
    return { status: 'Clocked Out', lastEvent };
  }

  // Fallback for unexpected states, assume clocked out
  return { status: 'Clocked Out', lastEvent: null };
};


export const calculateDailySummary = (userId: string, date: string = getTodayDateString()): DailySummary => {
  const dailyLogs = getDailyLogsForUser(userId, date).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  let totalWorkTime = 0; // in minutes
  let totalBreakTime = 0; // in minutes
  let lastInTime: Date | null = null;
  let lastBreakStartTime: Date | null = null;

  dailyLogs.forEach(log => {
    const timestamp = new Date(log.timestamp);

    switch (log.type) {
      case 'IN':
        lastInTime = timestamp;
        break;
      case 'OUT':
        if (lastInTime) {
          totalWorkTime += (timestamp.getTime() - lastInTime.getTime()) / (1000 * 60);
          lastInTime = null;
        }
        break;
      case 'BREAK_START':
        if (lastInTime) { // If clocked in before break
          totalWorkTime += (timestamp.getTime() - lastInTime.getTime()) / (1000 * 60);
          lastInTime = null; // Pause work time
        }
        lastBreakStartTime = timestamp;
        break;
      case 'BREAK_END':
        if (lastBreakStartTime) {
          totalBreakTime += (timestamp.getTime() - lastBreakStartTime.getTime()) / (1000 * 60);
          lastBreakStartTime = null;
        }
        lastInTime = timestamp; // Resume work time from break end
        break;
    }
  });

  // If still clocked in at the end of the day (or current time for today's summary)
  const now = new Date();
  if (date === getTodayDateString()) {
    if (lastInTime) {
      totalWorkTime += (now.getTime() - lastInTime.getTime()) / (1000 * 60);
    }
    if (lastBreakStartTime) {
      totalBreakTime += (now.getTime() - lastBreakStartTime.getTime()) / (1000 * 60);
    }
  }

  // Check for evening shift (6+ hours after 8:00 PM)
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  let isEveningShift = false;
  const eveningShiftStartHour = 20; // 8:00 PM

  // Check if any 'IN' or 'BREAK_END' event happened after 8 PM and lasted for 6+ hours
  for (let i = 0; i < dailyLogs.length; i++) {
    const log = dailyLogs[i];
    const logTime = new Date(log.timestamp);

    if ((log.type === 'IN' || log.type === 'BREAK_END') && logTime.getHours() >= eveningShiftStartHour) {
      let nextEventTime: Date | null = null;
      for (let j = i + 1; j < dailyLogs.length; j++) {
        if (dailyLogs[j].type === 'OUT' || dailyLogs[j].type === 'BREAK_START') {
          nextEventTime = new Date(dailyLogs[j].timestamp);
          break;
        }
      }
      if (!nextEventTime && date === getTodayDateString()) {
        nextEventTime = now; // If still active, use current time
      }
      if (nextEventTime) {
        const duration = (nextEventTime.getTime() - logTime.getTime()) / (1000 * 60 * 60); // in hours
        if (duration >= 6) {
          isEveningShift = true;
          break;
        }
      }
    }
  }


  return {
    date,
    totalWorkTime: Math.max(0, Math.round(totalWorkTime)), // Ensure non-negative
    totalBreakTime: Math.max(0, Math.round(totalBreakTime)), // Ensure non-negative
    isEveningShift,
    logs: dailyLogs,
  };
};

export const getPotentiallyForgottenClockOuts = (userIds: string[]): { userId: string; lastEventTimestamp: string }[] => {
  const forgottenClockOuts: { userId: string; lastEventTimestamp: string }[] = [];
  const now = new Date().getTime();
  const TWELVE_HOURS_IN_MS = 12 * 60 * 60 * 1000; // 12 hours in milliseconds

  userIds.forEach(userId => {
    const { status, lastEvent } = getCurrentAttendanceStatus(userId);
    if (status === 'Clocked In' && lastEvent) {
      const lastEventTime = new Date(lastEvent.timestamp).getTime();
      if (now - lastEventTime > TWELVE_HOURS_IN_MS) {
        forgottenClockOuts.push({ userId, lastEventTimestamp: lastEvent.timestamp });
      }
    }
  });
  return forgottenClockOuts;
};