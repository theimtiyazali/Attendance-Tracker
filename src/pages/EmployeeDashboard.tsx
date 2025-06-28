import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  recordAttendanceEvent,
  getDailyLogsForUser,
  getCurrentAttendanceStatus,
  calculateDailySummary,
} from '@/lib/attendance';
import { AttendanceLog, AttendanceEventType, DailySummary } from '@/types';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { Separator } from '@/components/ui/separator';

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const userId = user?.id || '';
  const [dailyLogs, setDailyLogs] = useState<AttendanceLog[]>([]);
  const [currentStatus, setCurrentStatus] = useState<{ status: 'Clocked In' | 'Clocked Out' | 'On Break', lastEvent: AttendanceLog | null } | null>(null);
  const [dailySummary, setDailySummary] = useState<DailySummary | null>(null);

  const refreshData = () => {
    if (userId) {
      const today = new Date().toISOString().split('T')[0];
      setDailyLogs(getDailyLogsForUser(userId, today));
      setCurrentStatus(getCurrentAttendanceStatus(userId));
      setDailySummary(calculateDailySummary(userId, today));
    }
  };

  useEffect(() => {
    refreshData();
    // Set up an interval to refresh data, e.g., every minute, to keep status updated
    const interval = setInterval(refreshData, 60 * 1000); // Refresh every minute
    return () => clearInterval(interval);
  }, [userId]);

  const handleClockAction = (type: AttendanceEventType) => {
    if (!userId) {
      toast.error("User not logged in.");
      return;
    }

    const { status } = getCurrentAttendanceStatus(userId);

    let canProceed = true;
    let errorMessage = "";

    switch (type) {
      case 'IN':
        if (status === 'Clocked In' || status === 'On Break') {
          canProceed = false;
          errorMessage = "You are already clocked in or on break.";
        }
        break;
      case 'OUT':
        if (status === 'Clocked Out') {
          canProceed = false;
          errorMessage = "You are already clocked out.";
        } else if (status === 'On Break') {
          canProceed = false;
          errorMessage = "Please end your break before clocking out.";
        }
        break;
      case 'BREAK_START':
        if (status === 'Clocked Out') {
          canProceed = false;
          errorMessage = "You must clock in before starting a break.";
        } else if (status === 'On Break') {
          canProceed = false;
          errorMessage = "You are already on break.";
        }
        break;
      case 'BREAK_END':
        if (status === 'Clocked Out') {
          canProceed = false;
          errorMessage = "You are not clocked in to end a break.";
        } else if (status === 'Clocked In') {
          canProceed = false;
          errorMessage = "You are not on break.";
        }
        break;
    }

    if (!canProceed) {
      toast.error(errorMessage);
      return;
    }

    recordAttendanceEvent(userId, type);
    refreshData();
    toast.success(`Successfully recorded ${type} event.`);
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  return (
    <Layout>
      <h2 className="text-3xl font-bold mb-6">Employee Dashboard</h2>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Welcome, {user?.name}!</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Manage your attendance here.</p>
            <div className="mt-4 space-y-2">
              <Button
                className="w-full"
                onClick={() => handleClockAction('IN')}
                disabled={currentStatus?.status === 'Clocked In' || currentStatus?.status === 'On Break'}
              >
                Clock In
              </Button>
              <Button
                className="w-full"
                onClick={() => handleClockAction('OUT')}
                disabled={currentStatus?.status === 'Clocked Out' || currentStatus?.status === 'On Break'}
                variant="destructive"
              >
                Clock Out
              </Button>
              <Button
                className="w-full"
                onClick={() => handleClockAction('BREAK_START')}
                disabled={currentStatus?.status !== 'Clocked In'}
                variant="secondary"
              >
                Start Break
              </Button>
              <Button
                className="w-full"
                onClick={() => handleClockAction('BREAK_END')}
                disabled={currentStatus?.status !== 'On Break'}
                variant="secondary"
              >
                End Break
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Current Status</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-lg font-semibold ${currentStatus?.status === 'Clocked In' ? 'text-green-600' : currentStatus?.status === 'On Break' ? 'text-yellow-600' : 'text-red-600'}`}>
              {currentStatus?.status}
            </p>
            <p className="text-sm text-muted-foreground">
              Last action: {currentStatus?.lastEvent ? `${currentStatus.lastEvent.type} at ${format(parseISO(currentStatus.lastEvent.timestamp), 'p')}` : 'N/A'}
            </p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Today's Work Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">Total Work Time: {formatTime(dailySummary?.totalWorkTime || 0)}</p>
            <p className="text-sm text-muted-foreground">Total Break Time: {formatTime(dailySummary?.totalBreakTime || 0)}</p>
            {dailySummary?.isEveningShift && (
              <p className="text-sm text-purple-600 font-medium mt-2">
                <span role="img" aria-label="moon">🌙</span> Evening Shift
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Today's Attendance Log</CardTitle>
          </CardHeader>
          <CardContent>
            {dailyLogs.length === 0 ? (
              <p className="text-muted-foreground">No attendance logs for today.</p>
            ) : (
              <div className="space-y-4">
                {dailyLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className={`font-medium ${log.type === 'IN' ? 'text-green-500' : log.type === 'OUT' ? 'text-red-500' : 'text-yellow-500'}`}>
                        {log.type}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {format(parseISO(log.timestamp), 'MMM dd, yyyy HH:mm:ss')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default EmployeeDashboard;