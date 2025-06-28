import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getAllUsers } from '@/lib/auth';
import {
  getCurrentAttendanceStatus,
  calculateDailySummary,
  getAttendanceLogsForUser,
  getPotentiallyForgottenClockOuts,
} from '@/lib/attendance';
import { User, DailySummary, AttendanceLog } from '@/types';
import { format, parseISO } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const AdminDashboard = () => {
  const { user: currentUser } = useAuth();
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [employeeStatuses, setEmployeeStatuses] = useState<Record<string, { status: string; lastEventTime: string | null }>>({});
  const [dailySummaries, setDailySummaries] = useState<Record<string, DailySummary>>({});
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('all');
  const [filteredLogs, setFilteredLogs] = useState<AttendanceLog[]>([]);

  const refreshAdminData = () => {
    const users = getAllUsers();
    setAllUsers(users);

    const statuses: Record<string, { status: string; lastEventTime: string | null }> = {};
    const summaries: Record<string, DailySummary> = {};
    const dateString = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');

    users.forEach(u => {
      const status = getCurrentAttendanceStatus(u.id);
      statuses[u.id] = {
        status: status.status,
        lastEventTime: status.lastEvent ? format(parseISO(status.lastEvent.timestamp), 'p') : null,
      };
      summaries[u.id] = calculateDailySummary(u.id, dateString);
    });
    setEmployeeStatuses(statuses);
    setDailySummaries(summaries);

    // Filter logs for the selected employee/date
    if (selectedEmployeeId === 'all') {
      const allLogs: AttendanceLog[] = [];
      users.forEach(u => {
        allLogs.push(...getAttendanceLogsForUser(u.id).filter(log => log.timestamp.startsWith(dateString)));
      });
      setFilteredLogs(allLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    } else {
      setFilteredLogs(getAttendanceLogsForUser(selectedEmployeeId).filter(log => log.timestamp.startsWith(dateString)));
    }

    // Check for forgotten clock-outs and show notifications
    const forgotten = getPotentiallyForgottenClockOuts(users.map(u => u.id));
    forgotten.forEach(item => {
      const employeeName = users.find(u => u.id === item.userId)?.name || item.userId;
      toast.warning(`${employeeName} might have forgotten to clock out! Last action was IN at ${format(parseISO(item.lastEventTimestamp), 'p')}.`);
    });
  };

  useEffect(() => {
    refreshAdminData();
    const interval = setInterval(refreshAdminData, 60 * 1000); // Refresh every minute
    return () => clearInterval(interval);
  }, [selectedDate, selectedEmployeeId]);

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
    hover: { scale: 1.01, boxShadow: "0px 8px 16px rgba(0, 0, 0, 0.1)" },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
  };

  return (
    <Layout>
      <h2 className="text-3xl font-bold mb-6 text-primary">Admin Dashboard</h2>
      <div className="grid gap-6 mb-6 md:grid-cols-2 lg:grid-cols-3">
        <motion.div variants={cardVariants} initial="hidden" animate="visible" whileHover="hover" transition={{ delay: 0.1 }}>
          <Card className="shadow-lg rounded-xl border-2 border-primary/10">
            <CardHeader>
              <CardTitle className="text-xl text-primary">Welcome, {currentUser?.name}!</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Overview of all employee attendance and reports.</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={cardVariants} initial="hidden" animate="visible" whileHover="hover" transition={{ delay: 0.2 }}>
          <Card className="shadow-lg rounded-xl border-2 border-primary/10">
            <CardHeader>
              <CardTitle className="text-xl text-primary">Live Employee Statuses</CardTitle>
            </CardHeader>
            <CardContent>
              {allUsers.length === 0 ? (
                <p className="text-muted-foreground">No employees registered yet.</p>
              ) : (
                <div className="space-y-2">
                  {allUsers.map(u => (
                    <motion.div key={u.id} className="flex items-center justify-between text-sm p-2 bg-secondary/10 rounded-md" variants={itemVariants}>
                      <span className="font-medium text-foreground">{u.name}</span>
                      <span className={`font-semibold ${employeeStatuses[u.id]?.status === 'Clocked In' ? 'text-green-600' : employeeStatuses[u.id]?.status === 'On Break' ? 'text-yellow-600' : 'text-red-600'}`}>
                        {employeeStatuses[u.id]?.status}
                      </span>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={cardVariants} initial="hidden" animate="visible" whileHover="hover" transition={{ delay: 0.3 }}>
          <Card className="shadow-lg rounded-xl border-2 border-primary/10">
            <CardHeader>
              <CardTitle className="text-xl text-primary">Filter Attendance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <motion.div variants={itemVariants}>
                <label className="block text-sm font-medium mb-1 text-foreground">Select Date</label>
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
              </motion.div>
              <motion.div variants={itemVariants}>
                <label className="block text-sm font-medium mb-1 text-foreground">Select Employee</label>
                <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                  <SelectTrigger className="bg-input/50 border-primary/30 focus:border-primary focus:ring-primary transition-all duration-300">
                    <SelectValue placeholder="All Employees" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-primary/30">
                    <SelectItem value="all">All Employees</SelectItem>
                    {allUsers.map(u => (
                      <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div variants={cardVariants} initial="hidden" animate="visible" whileHover="hover" transition={{ delay: 0.4 }} className="mb-6">
        <Card className="shadow-lg rounded-xl border-2 border-primary/10">
          <CardHeader>
            <CardTitle className="text-xl text-primary">Daily Summaries for {selectedDate ? format(selectedDate, 'PPP') : 'Today'}</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(dailySummaries).length === 0 ? (
              <p className="text-muted-foreground">No summaries available for the selected criteria.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-secondary/20 hover:bg-secondary/20">
                    <TableHead className="text-foreground">Employee</TableHead>
                    <TableHead className="text-foreground">Work Time</TableHead>
                    <TableHead className="text-foreground">Break Time</TableHead>
                    <TableHead className="text-foreground">Evening Shift</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(dailySummaries)
                    .filter(([userId]) => selectedEmployeeId === 'all' || userId === selectedEmployeeId)
                    .map(([userId, summary]) => (
                      <motion.tr
                        key={userId}
                        className="hover:bg-secondary/10 transition-colors duration-200"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <TableCell className="font-medium text-foreground">{allUsers.find(u => u.id === userId)?.name || userId}</TableCell>
                        <TableCell className="text-foreground">{formatTime(summary.totalWorkTime)}</TableCell>
                        <TableCell className="text-foreground">{formatTime(summary.totalBreakTime)}</TableCell>
                        <TableCell className="text-foreground">{summary.isEveningShift ? 'Yes 🌙' : 'No'}</TableCell>
                      </motion.tr>
                    ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={cardVariants} initial="hidden" animate="visible" whileHover="hover" transition={{ delay: 0.5 }}>
        <Card className="shadow-lg rounded-xl border-2 border-primary/10">
          <CardHeader>
            <CardTitle className="text-xl text-primary">Attendance Logs for {selectedDate ? format(selectedDate, 'PPP') : 'Today'} {selectedEmployeeId !== 'all' ? `(${allUsers.find(u => u.id === selectedEmployeeId)?.name})` : ''}</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredLogs.length === 0 ? (
              <p className="text-muted-foreground">No attendance logs for the selected criteria.</p>
            ) : (
              <div className="space-y-4">
                {filteredLogs.map((log) => (
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
                        {allUsers.find(u => u.id === log.userId)?.name || log.userId} at {format(parseISO(log.timestamp), 'MMM dd, yyyy HH:mm:ss')}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </Layout>
  );
};

export default AdminDashboard;