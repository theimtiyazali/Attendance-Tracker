import React, { ReactNode } from 'react';
import Header from './Header';
import { MadeWithDyad } from './made-with-dyad';
import { motion } from 'framer-motion';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />
      <motion.main
        className="flex-grow p-4 container mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6, ease: "easeOut" }}
      >
        {children}
      </motion.main>
      <MadeWithDyad />
    </div>
  );
};

export default Layout;