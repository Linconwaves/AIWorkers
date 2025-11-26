'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, FolderOpen, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/projects', label: 'Projects', icon: FolderOpen },
  { href: '/settings', label: 'Settings', icon: Settings },
];

interface SidebarProps {
  collapsed?: boolean;
  open?: boolean;
  onClose?: () => void;
}

export function Sidebar({ collapsed = false, open = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const widthClass = collapsed ? 'w-20' : 'w-64';

  return (
    <TooltipProvider delayDuration={150}>
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <div
        className={cn(
          'border-r border-border bg-card flex flex-col h-full transition-all duration-200',
          widthClass,
          open ? 'fixed inset-y-0 left-0 z-40 md:static' : 'hidden md:flex'
        )}
      >
        <div className="p-6 border-b border-border">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 relative">
              <Image
                src="https://cdn.linconwaves.com/linconwaves/no-bg-linconwaves.png"
                alt="StoreCanvas"
                fill
                sizes="40px"
                className="object-contain"
              />
            </div>
            {!collapsed && (
              <span className="text-xl font-semibold font-['Libertinus_Sans_Regular']">StoreCanvas</span>
            )}
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

            const link = (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent hover:text-accent-foreground'
                )}
                onClick={onClose}
              >
                <Icon className="w-5 h-5" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );

            return collapsed ? (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>{link}</TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            ) : (
              link
            );
          })}
        </nav>

        <div className="p-4 border-t border-border text-xs text-muted-foreground">
          {!collapsed ? (
            <p>Generate App Store & Play Store assets</p>
          ) : (
            <p className="text-center">AI</p>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
