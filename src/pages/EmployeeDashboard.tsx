import React from 'react';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const EmployeeDashboard = () => {
  const { user } = useAuth();

  return (
    <Layout>
      <h2 className="text-3xl font-bold mb-6">Employee Dashboard</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Welcome, {user?.name}!</CardTitle>
          </CardHeader>
          <CardContent>
            <p>This is your personal dashboard. Here you will see your clock-in/out status and work logs.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Current Status</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold text-green-600">Clocked Out</p>
            <p className="text-sm text-muted-foreground">Last action: N/A</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Today's Work Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">Total Hours: 0h 0m</p>
            <p className="text-sm text-muted-foreground">Break Time: 0h 0m</p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default EmployeeDashboard;