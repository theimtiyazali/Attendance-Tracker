import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Link } from 'react-router-dom'; // Import Link
import { motion } from 'framer-motion';

const Header = () => {
  const { logout, user, isAdmin } = useAuth();
  const { setTheme, theme } = useTheme(); // Destructure setTheme and theme from useTheme

  return (
    <motion.header
      className="flex items-center justify-between p-4 bg-background text-foreground shadow-neumorphic-out"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 120, damping: 14, delay: 0.1 }}
    >
      <div className="flex items-center space-x-4">
        <h1 className="text-xl font-bold text-primary">Attendance Tracker</h1>
        {user && (
          <span className="text-sm text-muted-foreground">
            Logged in as: {user.name} ({user.role})
          </span>
        )}
        {isAdmin && (
          <Link to="/admin/users">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button variant="ghost" className="text-primary shadow-neumorphic-out active:shadow-neumorphic-in hover:bg-background">User Management</Button>
            </motion.div>
          </Link>
        )}
      </div>
      <div className="flex items-center space-x-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button variant="ghost" size="icon" className="text-primary shadow-neumorphic-out active:shadow-neumorphic-in hover:bg-background">
                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </motion.div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-card shadow-neumorphic-out rounded-xl">
            <DropdownMenuItem onClick={() => setTheme("light")} className="hover:bg-secondary/20">
              Light
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")} className="hover:bg-secondary/20">
              Dark
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("system")} className="hover:bg-secondary/20">
              System
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button onClick={logout} variant="outline" className="shadow-neumorphic-out active:shadow-neumorphic-in bg-background text-primary hover:bg-background">
            Logout
          </Button>
        </motion.div>
      </div>
    </motion.header>
  );
};

export default Header;