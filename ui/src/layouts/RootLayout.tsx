import { type ReactNode, useState, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ListTodo, FileText, Settings, Bot, Search, Coins, Menu, X, ChevronLeft, ChevronRight, Webhook, AlertTriangle } from 'lucide-react';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { CommandPalette, openCommandPalette } from '@/components/shared/CommandPalette';
import { NotificationBell } from '@/features/notifications/components/NotificationBell';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface RootLayoutProps {
  children: ReactNode;
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Tasks', href: '/tasks', icon: ListTodo },
  { name: 'Failed', href: '/failed', icon: AlertTriangle },
  { name: 'Summaries', href: '/summaries', icon: FileText },
  { name: 'Costs', href: '/costs', icon: Coins },
  { name: 'Agents', href: '/agents', icon: Bot },
  { name: 'Webhooks', href: '/webhooks', icon: Webhook },
  { name: 'Settings', href: '/settings', icon: Settings },
];

// Quick access toolbar items (subset for header)
const toolbarNav = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Tasks', href: '/tasks', icon: ListTodo },
  { name: 'Summaries', href: '/summaries', icon: FileText },
  { name: 'Agents', href: '/agents', icon: Bot },
];

export function RootLayout({ children }: RootLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Get current page info for dynamic header
  const currentPage = useMemo(() => {
    const path = location.pathname;
    // Check for detail pages first
    if (path.startsWith('/tasks/') && path !== '/tasks') {
      return { name: 'Task Details', parent: 'Tasks', parentHref: '/tasks' };
    }
    if (path.startsWith('/summaries/') && path !== '/summaries') {
      return { name: 'Summary Details', parent: 'Summaries', parentHref: '/summaries' };
    }
    // Find matching nav item
    const navItem = navigation.find(item =>
      item.href === path || (item.href !== '/' && path.startsWith(item.href))
    );
    return navItem ? { name: navItem.name } : { name: 'Dashboard' };
  }, [location.pathname]);

  const canGoBack = window.history.length > 1;

  return (
    <div className="flex min-h-screen bg-[var(--background)]">
      <CommandPalette />
      
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Floating Liquid Glass Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 p-3 
        transition-transform duration-300 ease-out
        lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="sidebar-glass h-full rounded-[20px] overflow-hidden flex flex-col">
          {/* Logo Section */}
          <div className="flex h-16 items-center justify-between px-5 border-b border-white/5 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-gradient-to-br from-[var(--primary)] to-[var(--info)] shadow-lg shadow-[var(--primary)]/20">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="text-base font-semibold tracking-tight">GLINR</span>
                <p className="text-[10px] text-[var(--muted-foreground)] leading-none">Task Manager</p>
              </div>
            </div>
            
            {/* Mobile Close Button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex flex-col gap-0.5 p-3 flex-1 overflow-y-auto" data-tour="sidebar-nav">
            <div className="px-3 py-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]/60">
                Navigation
              </span>
            </div>
            {navigation.map((item) => {
              const isActive = location.pathname === item.href ||
                (item.href !== '/' && location.pathname.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    group relative flex items-center gap-3 rounded-[12px] px-3 py-2 text-[13px] font-medium transition-all duration-200
                    ${isActive
                      ? 'nav-item-active-glass text-white scale-[1.02]'
                      : 'text-[var(--muted-foreground)] hover:nav-item-hover-glass hover:text-[var(--foreground)] active:scale-95'
                    }
                  `}
                >
                  {isActive && (
                    <div className="absolute inset-0 rounded-[12px] bg-gradient-to-r from-white/20 to-transparent pointer-events-none" />
                  )}
                  <item.icon className={`h-[18px] w-[18px] transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`} />
                  <span className="relative">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Bottom Section */}
          <div className="p-3 border-t border-white/5 backdrop-blur-md flex-shrink-0">
            <div className="flex items-center justify-between px-3 py-2">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 ring-2 ring-white/20" />
                <span className="text-[13px] font-medium truncate">Admin</span>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col lg:pl-[300px]">
        {/* Header - macOS Liquid Toolbar Style */}
        <header className="sticky top-0 z-40 mx-3 mt-3 mb-0">
          <div className="header-glass flex h-14 items-center justify-between rounded-[20px] px-4 backdrop-blur-xl transition-all duration-300">
            <div className="flex items-center gap-4">
              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden rounded-full"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>

              {/* Browser-style Navigation Controls */}
              <div className="hidden md:flex items-center gap-0.5 px-1 py-1 rounded-lg bg-black/5 dark:bg-white/5">
                <button
                  onClick={() => canGoBack && navigate(-1)}
                  disabled={!canGoBack}
                  className={cn(
                    "p-1.5 px-2 rounded-md transition-colors",
                    canGoBack
                      ? "hover:bg-white/10 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                      : "text-[var(--muted-foreground)]/30 cursor-not-allowed"
                  )}
                  title="Go back"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <div className="w-[1px] h-3 bg-[var(--border)]" />
                <button
                  onClick={() => navigate(1)}
                  className="p-1.5 px-2 hover:bg-white/10 rounded-md transition-colors text-[var(--muted-foreground)]/30 cursor-not-allowed"
                  title="Go forward"
                  disabled
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Dynamic Page Title with Breadcrumb */}
              <div className="flex flex-col text-left">
                {currentPage.parent ? (
                  <>
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <Link
                        to={currentPage.parentHref!}
                        className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                      >
                        {currentPage.parent}
                      </Link>
                      <ChevronRight className="h-3 w-3 text-[var(--muted-foreground)]/50" />
                      <span className="font-semibold">{currentPage.name}</span>
                    </div>
                  </>
                ) : (
                  <h1 className="text-[13px] font-semibold tracking-tight leading-tight">{currentPage.name}</h1>
                )}
                <div className="hidden sm:flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500 shadow-[0_0_8px_oklch(0.6_0.2_150)] animate-pulse" />
                  <span className="text-[9px] text-[var(--muted-foreground)] font-bold uppercase tracking-widest">System Active</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Quick Navigation Toolbar - Functional Links */}
              <div className="hidden md:flex items-center gap-0.5 px-1 py-1 rounded-lg bg-black/5 dark:bg-white/5 mr-2">
                {toolbarNav.map((item) => {
                  const isActive = location.pathname === item.href ||
                    (item.href !== '/' && location.pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      title={item.name}
                      className={cn(
                        "p-1.5 rounded-md transition-all relative group",
                        isActive
                          ? "bg-[var(--primary)] text-white shadow-sm"
                          : "text-[var(--muted-foreground)] hover:bg-white/10 hover:text-[var(--foreground)]"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {/* Tooltip */}
                      <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 hidden group-hover:flex items-center px-2 py-1 rounded-lg bg-black/90 text-[9px] font-bold text-white border border-white/10 whitespace-nowrap shadow-xl z-50">
                        {item.name}
                      </div>
                    </Link>
                  );
                })}
              </div>

              <div className="hidden sm:block h-8 w-[1px] bg-[var(--border)] mx-1" />

              <div className="flex items-center gap-1">
                <button
                  className="p-2 hover:bg-white/5 rounded-full transition-colors group relative"
                  onClick={openCommandPalette}
                  data-tour="command-palette"
                >
                  <Search className="h-4 w-4 text-[var(--muted-foreground)]" />
                  <div className="absolute top-full mt-2 right-0 hidden group-hover:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-black/90 text-[9px] font-bold text-white border border-white/10 whitespace-nowrap shadow-xl z-50">
                    <span className="opacity-50">⌘</span>
                    <span>K</span>
                  </div>
                </button>
                <NotificationBell />
                <div data-tour="theme-toggle">
                  <ThemeToggle />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
