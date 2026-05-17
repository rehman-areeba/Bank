import { ReactNode } from 'react';
import { PremiumSidebar } from './PremiumSidebar';

interface PremiumLayoutProps {
  children: ReactNode;
}

export const PremiumLayout = ({ children }: PremiumLayoutProps) => {
  return (
    <div className="min-h-screen bg-zinc-50">
      <PremiumSidebar />
      <main className="lg:ml-0">
        {children}
      </main>
    </div>
  );
};
