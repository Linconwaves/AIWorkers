'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Sidebar } from '@/components/nav/Sidebar';
import { Topbar } from '@/components/nav/Topbar';

interface AppShellProps {
  children: ReactNode;
  fullscreen?: boolean;
}

export function AppShell({ children, fullscreen = false }: AppShellProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Load persisted sidebar preference
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem('sc_sidebar_collapsed');
    if (stored === 'false') {
      setIsCollapsed(false);
    }
  }, []);

  const updateCollapse = (next: boolean) => {
    setIsCollapsed(next);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('sc_sidebar_collapsed', String(next));
    }
  };

  useEffect(() => {
    if (!loading && !user && !pathname.startsWith('/auth')) {
      router.push('/auth/login');
    }
  }, [user, loading, router, pathname]);

  // Close mobile drawer when navigating
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (fullscreen) {
    return <div className="h-screen w-screen bg-background overflow-hidden">{children}</div>;
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          collapsed={isCollapsed}
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
        />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Topbar
            onToggleSidebar={() => setMobileOpen((prev) => !prev)}
            onCollapseToggle={() => updateCollapse(!isCollapsed)}
            isCollapsed={isCollapsed}
          />
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </div>
    </div>
  );
}
