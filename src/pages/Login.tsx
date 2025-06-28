import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserRole } from '@/types';
import { motion } from 'framer-motion';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<UserRole>('employee');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("LoginPage: Attempting login with username:", username, "role:", role);
    const loggedInUser = login(username, role);
    if (loggedInUser) {
      console.log("LoginPage: Login successful, user:", loggedInUser);
      if (loggedInUser.role === 'admin') {
        navigate("/admin-dashboard", { replace: true });
      } else if (loggedInUser.role === 'employee') {
        navigate("/employee-dashboard", { replace: true });
      }
    } else {
      console.log("LoginPage: Login failed (loggedInUser is null).");
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.6, ease: "easeOut" } },
    hover: { scale: 1.02, boxShadow: "0px 10px 20px rgba(0, 0, 0, 0.15)" }, // Keep for motion, but actual shadow from neumorphic class
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background text-foreground p-4">
      <motion.div
        className="w-full max-w-md"
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        whileHover="hover"
      >
        <Card className="shadow-neumorphic-out rounded-2xl bg-background">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-extrabold text-primary">Welcome to Attendance Tracker</CardTitle>
            <CardDescription className="text-muted-foreground mt-2">Log in to your account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <motion.div variants={itemVariants}>
                <Label htmlFor="username" className="text-foreground">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="mt-1 bg-background shadow-neumorphic-in focus:ring-primary transition-all duration-300"
                />
              </motion.div>
              <motion.div variants={itemVariants}>
                <Label htmlFor="role" className="text-foreground">Role</Label>
                <Select value={role} onValueChange={(value: UserRole) => setRole(value)}>
                  <SelectTrigger id="role" className="mt-1 bg-background shadow-neumorphic-in focus:ring-primary transition-all duration-300">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent className="bg-card shadow-neumorphic-out rounded-xl">
                    <SelectItem value="employee">Employee</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </motion.div>
              <motion.div variants={itemVariants}>
                <Button
                  type="submit"
                  className="w-full py-3 text-lg font-semibold bg-primary text-primary-foreground shadow-neumorphic-out active:shadow-neumorphic-in hover:bg-primary/90 transition-all duration-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Login
                </Button>
              </motion.div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default LoginPage;