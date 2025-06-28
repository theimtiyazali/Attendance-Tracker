import React from 'react';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const AdminDashboard = () => {
  const { user } = useAuth();

  return (
    <Layout>
      <h2 className="text-3xl font-bold mb-6">Admin Dashboard</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Welcome, {user?.name}!</CardTitle>
          </CardHeader>
          <CardContent>
            <p>This is the admin dashboard. You can view all employee statuses and reports here.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Live Employee Statuses</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">No employees currently clocked in.</p>
            <p className="text-sm text-muted-foreground">This section will show real-time status.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Reports & Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">Coming Soon</p>
            <p className="text-sm text-muted-foreground">Filterable reports will be available here.</p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default AdminDashboard;