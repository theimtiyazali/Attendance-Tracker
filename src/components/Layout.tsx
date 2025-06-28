import React, { ReactNode } from 'react';
import Header from './Header';
import { MadeWithDyad } from './made-with-dyad';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />
      <main className="flex-grow p-4 container mx-auto">
        {children}
      </main>
      <MadeWithDyad />
    </div>
  );
};

export default Layout;