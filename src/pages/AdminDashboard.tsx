import React, { useState, useEffect } from 'react';
import { useAuth, AuthProvider } from '@/context/AuthContext';
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

  return (
    <Layout>
      <h2 className="text-3xl font-bold mb-6">Admin Dashboard</h2>
      <div className="grid gap-6 mb-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Welcome, {currentUser?.name}!</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Overview of all employee attendance and reports.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Live Employee Statuses</CardTitle>
          </CardHeader>
          <CardContent>
            {allUsers.length === 0 ? (
              <p className="text-muted-foreground">No employees registered yet.</p>
            ) : (
              <div className="space-y-2">
                {allUsers.map(u => (
                  <div key={u.id} className="flex items-center justify-between text-sm">
                    <span className="font-medium">{u.name}</span>
                    <span className={`font-semibold ${employeeStatuses[u.id]?.status === 'Clocked In' ? 'text-green-600' : employeeStatuses[u.id]?.status === 'On Break' ? 'text-yellow-600' : 'text-red-600'}`}>
                      {employeeStatuses[u.id]?.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Filter Attendance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Select Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Select Employee</label>
              <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                <SelectTrigger>
                  <SelectValue placeholder="All Employees" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Employees</SelectItem>
                  {allUsers.map(u => (
                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Daily Summaries for {selectedDate ? format(selectedDate, 'PPP') : 'Today'}</CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(dailySummaries).length === 0 ? (
            <p className="text-muted-foreground">No summaries available for the selected criteria.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Work Time</TableHead>
                  <TableHead>Break Time</TableHead>
                  <TableHead>Evening Shift</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(dailySummaries)
                  .filter(([userId]) => selectedEmployeeId === 'all' || userId === selectedEmployeeId)
                  .map(([userId, summary]) => (
                    <TableRow key={userId}>
                      <TableCell className="font-medium">{allUsers.find(u => u.id === userId)?.name || userId}</TableCell>
                      <TableCell>{formatTime(summary.totalWorkTime)}</TableCell>
                      <TableCell>{formatTime(summary.totalBreakTime)}</TableCell>
                      <TableCell>{summary.isEveningShift ? 'Yes 🌙' : 'No'}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Attendance Logs for {selectedDate ? format(selectedDate, 'PPP') : 'Today'} {selectedEmployeeId !== 'all' ? `(${allUsers.find(u => u.id === selectedEmployeeId)?.name})` : ''}</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredLogs.length === 0 ? (
            <p className="text-muted-foreground">No attendance logs for the selected criteria.</p>
          ) : (
            <div className="space-y-4">
              {filteredLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className={`font-medium ${log.type === 'IN' ? 'text-green-500' : log.type === 'OUT' ? 'text-red-500' : 'text-yellow-500'}`}>
                      {log.type}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {allUsers.find(u => u.id === log.userId)?.name || log.userId} at {format(parseISO(log.timestamp), 'MMM dd, yyyy HH:mm:ss')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </Layout>
  );
};

export default AdminDashboard;