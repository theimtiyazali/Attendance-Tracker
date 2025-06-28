import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { useAuth } from '@/context/Auth/AuthContext';
import { getAllUsers, addUser, deleteUser } from '@/lib/auth';
import { User, UserRole } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { motion } from 'framer-motion';

const UserManagementPage = () => {
  const { isAdmin, user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [newUsername, setNewUsername] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('employee');

  useEffect(() => {
    if (isAdmin) {
      setUsers(getAllUsers());
    }
  }, [isAdmin]);

  const refreshUsers = () => {
    setUsers(getAllUsers());
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim()) {
      toast.error("Username cannot be empty.");
      return;
    }
    if (newUsername === currentUser?.id) {
      toast.error("Cannot add yourself as a new user.");
      return;
    }

    const addedUser = addUser(newUsername.trim(), newUserRole);
    if (addedUser) {
      toast.success(`User '${addedUser.name}' (${addedUser.role}) added successfully.`);
      setNewUsername('');
      setNewUserRole('employee');
      refreshUsers();
    } else {
      toast.error(`User '${newUsername}' already exists.`);
    }
  };

  const handleDeleteUser = (userId: string) => {
    if (userId === currentUser?.id) {
      toast.error("You cannot delete your own account.");
      return;
    }
    const success = deleteUser(userId);
    if (success) {
      toast.success(`User '${userId}' deleted successfully.`);
      refreshUsers();
    } else {
      toast.error(`Failed to delete user '${userId}'.`);
    }
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

  if (!isAdmin) {
    return (
      <Layout>
        <div className="text-center py-10">
          <h2 className="text-2xl font-bold">Access Denied</h2>
          <p className="text-muted-foreground">You do not have permission to view this page.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <h2 className="text-3xl font-bold mb-6 text-primary">User Management</h2>

      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div variants={cardVariants} initial="hidden" animate="visible" whileHover="hover" transition={{ delay: 0.1 }}>
          <Card className="shadow-lg rounded-xl border-2 border-primary/10">
            <CardHeader>
              <CardTitle className="text-xl text-primary">Add New User</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddUser} className="space-y-4">
                <motion.div variants={itemVariants}>
                  <Label htmlFor="new-username" className="text-foreground">Username</Label>
                  <Input
                    id="new-username"
                    type="text"
                    placeholder="Enter username"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    required
                    className="mt-1 bg-input/50 border-primary/30 focus:border-primary focus:ring-primary transition-all duration-300"
                  />
                </motion.div>
                <motion.div variants={itemVariants}>
                  <Label htmlFor="new-user-role" className="text-foreground">Role</Label>
                  <Select value={newUserRole} onValueChange={(value: UserRole) => setNewUserRole(value)}>
                    <SelectTrigger id="new-user-role" className="mt-1 bg-input/50 border-primary/30 focus:border-primary focus:ring-primary transition-all duration-300">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-primary/30">
                      <SelectItem value="employee">Employee</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </motion.div>
                <motion.div variants={itemVariants}>
                  <Button type="submit" className="w-full py-2 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 shadow-md">
                    Add User
                  </Button>
                </motion.div>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={cardVariants} initial="hidden" animate="visible" whileHover="hover" transition={{ delay: 0.2 }}>
          <Card className="shadow-lg rounded-xl border-2 border-primary/10">
            <CardHeader>
              <CardTitle className="text-xl text-primary">Existing Users</CardTitle>
            </CardHeader>
            <CardContent>
              {users.length === 0 ? (
                <p className="text-muted-foreground">No users registered yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-secondary/20 hover:bg-secondary/20">
                      <TableHead className="text-foreground">Username</TableHead>
                      <TableHead className="text-foreground">Role</TableHead>
                      <TableHead className="text-right text-foreground">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <motion.tr
                        key={user.id}
                        className="hover:bg-secondary/10 transition-colors duration-200"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <TableCell className="font-medium text-foreground">{user.name}</TableCell>
                        <TableCell className="text-foreground">{user.role}</TableCell>
                        <TableCell className="text-right">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="destructive"
                                size="icon"
                                disabled={user.id === currentUser?.id} // Disable deleting own account
                                className="shadow-sm hover:shadow-md"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-card border-primary/30 shadow-lg rounded-xl">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-primary">Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription className="text-muted-foreground">
                                  This action cannot be undone. This will permanently delete the user
                                  <span className="font-bold text-foreground"> {user.name}</span> and remove their data.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="border-primary text-primary hover:bg-primary/10">Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteUser(user.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                  Continue
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </Layout>
  );
};

export default UserManagementPage;