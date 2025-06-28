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
import { Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const userId = user?.id || '';
  const [dailyLogs, setDailyLogs] = useState<AttendanceLog[]>([]);
  const [currentStatus, setCurrentStatus] = useState<{ status: 'Clocked In' | 'Clocked Out' | 'On Break', lastEvent: AttendanceLog | null } | null>(null);
  const [dailySummary, setDailySummary] = useState<DailySummary | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const refreshData = (date: Date = new Date()) => {
    if (userId) {
      const dateString = format(date, 'yyyy-MM-dd');
      setDailyLogs(getDailyLogsForUser(userId, dateString));
      setDailySummary(calculateDailySummary(userId, dateString));
      // Current status should always reflect today's status
      if (format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')) {
        setCurrentStatus(getCurrentAttendanceStatus(userId));
      } else {
        setCurrentStatus(null); // No "current" status for past dates
      }
    }
  };

  useEffect(() => {
    refreshData(selectedDate);
    // Set up an interval to refresh data for TODAY's status, if today is selected
    const interval = setInterval(() => {
      if (selectedDate && format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')) {
        setCurrentStatus(getCurrentAttendanceStatus(userId));
      }
    }, 60 * 1000); // Refresh current status every minute
    return () => clearInterval(interval);
  }, [userId, selectedDate]);

  const handleClockAction = (type: AttendanceEventType) => {
    if (!userId) {
      toast.error("User not logged in.");
      return;
    }
    // Ensure clock actions only apply to the current day
    if (format(selectedDate || new Date(), 'yyyy-MM-dd') !== format(new Date(), 'yyyy-MM-dd')) {
      toast.error("Clock actions can only be performed for the current day.");
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
    refreshData(new Date()); // Always refresh for today after a clock action
    toast.success(`Successfully recorded ${type} event.`);
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  const isToday = selectedDate && format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
    hover: { scale: 1.01, boxShadow: "0px 8px 16px rgba(0, 0, 0, 0.1)" },
  };

  const itemVariants = { // Added itemVariants definition
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
  };

  const buttonVariants = {
    hover: { scale: 1.05 },
    tap: { scale: 0.95 },
  };

  return (
    <Layout>
      <h2 className="text-3xl font-bold mb-6 text-primary">Employee Dashboard</h2>
      <div className="grid gap-6 mb-6 md:grid-cols-2 lg:grid-cols-3">
        <motion.div variants={cardVariants} initial="hidden" animate="visible" whileHover="hover" transition={{ delay: 0.1 }}>
          <Card className="shadow-lg rounded-xl border-2 border-primary/10">
            <CardHeader>
              <CardTitle className="text-xl text-primary">Welcome, {user?.name}!</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Manage your attendance here.</p>
              <div className="mt-4 space-y-2">
                <motion.div variants={itemVariants}>
                  <Button
                    className="w-full py-2 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 shadow-md"
                    onClick={() => handleClockAction('IN')}
                    disabled={!isToday || currentStatus?.status === 'Clocked In' || currentStatus?.status === 'On Break'}
                    whileHover="hover"
                    whileTap="tap"
                    variants={buttonVariants}
                  >
                    Clock In
                  </Button>
                </motion.div>
                <motion.div variants={itemVariants}>
                  <Button
                    className="w-full py-2 text-base font-semibold bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-all duration-300 shadow-md"
                    onClick={() => handleClockAction('OUT')}
                    disabled={!isToday || currentStatus?.status === 'Clocked Out' || currentStatus?.status === 'On Break'}
                    whileHover="hover"
                    whileTap="tap"
                    variants={buttonVariants}
                  >
                    Clock Out
                  </Button>
                </motion.div>
                <motion.div variants={itemVariants}>
                  <Button
                    className="w-full py-2 text-base font-semibold bg-secondary text-secondary-foreground hover:bg-secondary/90 transition-all duration-300 shadow-md"
                    onClick={() => handleClockAction('BREAK_START')}
                    disabled={!isToday || currentStatus?.status !== 'Clocked In'}
                    whileHover="hover"
                    whileTap="tap"
                    variants={buttonVariants}
                  >
                    Start Break
                  </Button>
                </motion.div>
                <motion.div variants={itemVariants}>
                  <Button
                    className="w-full py-2 text-base font-semibold bg-secondary text-secondary-foreground hover:bg-secondary/90 transition-all duration-300 shadow-md"
                    onClick={() => handleClockAction('BREAK_END')}
                    disabled={!isToday || currentStatus?.status !== 'On Break'}
                    whileHover="hover"
                    whileTap="tap"
                    variants={buttonVariants}
                  >
                    End Break
                  </Button>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={cardVariants} initial="hidden" animate="visible" whileHover="hover" transition={{ delay: 0.2 }}>
          <Card className="shadow-lg rounded-xl border-2 border-primary/10">
            <CardHeader>
              <CardTitle className="text-xl text-primary">Select Date</CardTitle>
            </CardHeader>
            <CardContent>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal bg-input/50 border-primary/30 hover:bg-input/70 transition-all duration-300",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-card border-primary/30 shadow-lg rounded-xl">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {isToday && currentStatus && (
                <div className="mt-4">
                  <p className={`text-lg font-semibold ${currentStatus.status === 'Clocked In' ? 'text-green-600' : currentStatus.status === 'On Break' ? 'text-yellow-600' : 'text-red-600'}`}>
                    Current Status: {currentStatus.status}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Last action: {currentStatus.lastEvent ? `${currentStatus.lastEvent.type} at ${format(parseISO(currentStatus.lastEvent.timestamp), 'p')}` : 'N/A'}
                  </p>
                </div>
              )}
              {!isToday && (
                <p className="mt-4 text-muted-foreground text-sm">
                  Viewing historical data. Clock actions are for today only.
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={cardVariants} initial="hidden" animate="visible" whileHover="hover" transition={{ delay: 0.3 }}>
          <Card className="shadow-lg rounded-xl border-2 border-primary/10">
            <CardHeader>
              <CardTitle className="text-xl text-primary">{isToday ? "Today's" : "Selected Day's"} Work Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold text-foreground">Total Work Time: {formatTime(dailySummary?.totalWorkTime || 0)}</p>
              <p className="text-sm text-muted-foreground">Total Break Time: {formatTime(dailySummary?.totalBreakTime || 0)}</p>
              {dailySummary?.isEveningShift && (
                <p className="text-sm text-purple-600 font-medium mt-2">
                  <span role="img" aria-label="moon">🌙</span> Evening Shift
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={cardVariants} initial="hidden" animate="visible" whileHover="hover" transition={{ delay: 0.4 }} className="lg:col-span-3">
          <Card className="shadow-lg rounded-xl border-2 border-primary/10">
            <CardHeader>
              <CardTitle className="text-xl text-primary">{isToday ? "Today's" : "Selected Day's"} Attendance Log</CardTitle>
            </CardHeader>
            <CardContent>
              {dailyLogs.length === 0 ? (
                <p className="text-muted-foreground">No attendance logs for {selectedDate ? format(selectedDate, 'PPP') : 'the selected day'}.</p>
              ) : (
                <div className="space-y-4">
                  {dailyLogs.map((log) => (
                    <motion.div
                      key={log.id}
                      className="flex items-center justify-between p-3 bg-secondary/20 rounded-md shadow-sm hover:bg-secondary/30 transition-all duration-200"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="flex items-center space-x-2">
                        <span className={`font-medium ${log.type === 'IN' ? 'text-green-500' : log.type === 'OUT' ? 'text-red-500' : 'text-yellow-500'}`}>
                          {log.type}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {format(parseISO(log.timestamp), 'MMM dd, yyyy HH:mm:ss')}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </Layout>
  );
};

export default EmployeeDashboard;