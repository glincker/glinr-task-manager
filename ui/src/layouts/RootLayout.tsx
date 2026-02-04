import { type ReactNode, useState, useMemo, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ListTodo, FileText, Settings, Bot, Search, Coins, Menu, X, ChevronLeft, ChevronRight, Webhook, AlertTriangle, PanelLeftClose, PanelLeft, Command, Zap, Ticket, Sparkles, FolderKanban, Users, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { CommandPalette, openCommandPalette } from '@/components/shared/CommandPalette';
import { NotificationBell } from '@/features/notifications/components/NotificationBell';
import { Logo } from '@/components/shared/Logo';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { api } from '@/core/api/client';
import { UserMenu, useAuth } from '@/features/auth';

interface RootLayoutProps {
  children: ReactNode;
}

// Navigation grouped by category
const mainNav = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Chat', href: '/chat', icon: Sparkles },
  { name: 'Projects', href: '/projects', icon: FolderKanban },
  { name: 'Tickets', href: '/tickets', icon: Ticket },
  { name: 'Tasks', href: '/tasks', icon: ListTodo },
  { name: 'Failed', href: '/failed', icon: AlertTriangle },
];

const contentNav = [
  { name: 'Summaries', href: '/summaries', icon: FileText },
  { name: 'Costs', href: '/costs', icon: Coins },
];

const systemNav = [
  { name: 'Cron Jobs', href: '/cron', icon: Clock },
  { name: 'Gateway', href: '/gateway', icon: Zap },
  { name: 'Agents', href: '/agents', icon: Bot },
  { name: 'Webhooks', href: '/webhooks', icon: Webhook },
  { name: 'Settings', href: '/settings', icon: Settings },
];

const navigation = [...mainNav, ...contentNav, ...systemNav];

// Quick access toolbar items (subset for header)
const toolbarNav = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Tasks', href: '/tasks', icon: ListTodo },
  { name: 'Summaries', href: '/summaries', icon: FileText },
  { name: 'Agents', href: '/agents', icon: Bot },
];

// Nav item component with tooltip and badge support
interface NavItemProps {
  item: { name: string; href: string; icon: React.ComponentType<{ className?: string }> };
  isActive: boolean;
  collapsed: boolean;
  onClick: () => void;
  badge?: number;
  shortcut?: string;
}

function NavItem({ item, isActive, collapsed, onClick, badge, shortcut }: NavItemProps) {
  return (
    <Link
      to={item.href}
      onClick={onClick}
      className={cn(
        "group relative flex items-center rounded-xl transition-all duration-200",
        collapsed ? "justify-center h-10 w-10 mx-auto" : "gap-3 px-3 py-2.5",
        isActive
          ? "nav-item-active"
          : "text-[var(--muted-foreground)] hover:nav-item-hover hover:text-[var(--foreground)]"
      )}
    >
      <div className="relative">
        <item.icon className={cn(
          "shrink-0 transition-all duration-200",
          collapsed ? "h-5 w-5" : "h-[18px] w-[18px]",
          isActive && "scale-110"
        )} />
        {/* Badge indicator */}
        {badge !== undefined && badge > 0 && (
          <span className={cn(
            "absolute -top-1.5 -right-1.5 flex items-center justify-center rounded-full text-[9px] font-bold",
            collapsed ? "h-4 w-4" : "h-3.5 min-w-3.5 px-1",
            "bg-[var(--primary)] text-[var(--primary-foreground)]"
          )}>
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </div>
      {!collapsed && (
        <>
          <span className="text-[13px] font-medium flex-1">{item.name}</span>
          {/* Keyboard shortcut hint */}
          {shortcut && (
            <kbd className="hidden lg:inline-flex h-5 items-center gap-0.5 rounded border border-[var(--border)] bg-[var(--muted)] px-1.5 text-[10px] font-medium text-[var(--muted-foreground)] opacity-0 group-hover:opacity-100 transition-opacity">
              {shortcut}
            </kbd>
          )}
        </>
      )}
      {/* Tooltip for collapsed state */}
      {collapsed && (
        <div className="pointer-events-none absolute left-full ml-3 opacity-0 group-hover:opacity-100 flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--popover)] text-[12px] font-medium text-[var(--foreground)] border border-[var(--border)] whitespace-nowrap shadow-xl z-[100] transition-all duration-200 translate-x-1 group-hover:translate-x-0">
          <span>{item.name}</span>
          {badge !== undefined && badge > 0 && (
            <span className="flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] text-[9px] font-bold">
              {badge}
            </span>
          )}
        </div>
      )}
    </Link>
  );
}

export function RootLayout({ children }: RootLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved === 'true';
  });
  const [scrolled, setScrolled] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const historyStack = useRef<string[]>([]);
  const historyIndex = useRef(0);

  // Track navigation history for forward/back buttons
  useEffect(() => {
    const currentPath = location.pathname + location.search;

    // Check if we're navigating to a new page or using back/forward
    if (historyStack.current.length === 0) {
      // Initialize with current path
      historyStack.current = [currentPath];
      historyIndex.current = 0;
    } else if (currentPath !== historyStack.current[historyIndex.current]) {
      // Check if navigating forward in existing history
      if (historyIndex.current < historyStack.current.length - 1 &&
          currentPath === historyStack.current[historyIndex.current + 1]) {
        historyIndex.current++;
      }
      // Check if navigating back in existing history
      else if (historyIndex.current > 0 &&
               currentPath === historyStack.current[historyIndex.current - 1]) {
        historyIndex.current--;
      }
      // New navigation - truncate forward history and add new path
      else {
        historyStack.current = historyStack.current.slice(0, historyIndex.current + 1);
        historyStack.current.push(currentPath);
        historyIndex.current = historyStack.current.length - 1;
      }
    }

    // Update forward button state
    setCanGoForward(historyIndex.current < historyStack.current.length - 1);
  }, [location]);

  // Fetch stats for badge counts
  const { data: stats } = useQuery({
    queryKey: ['stats'],
    queryFn: api.stats.get,
    refetchInterval: 30000,
    staleTime: 25000, // Prevent duplicate fetches within 25s
  });

  // Fetch DLQ count for failed badge
  const { data: dlqStats } = useQuery({
    queryKey: ['dlq', 'stats'],
    queryFn: api.dlq.stats,
    refetchInterval: 30000,
    staleTime: 25000,
  });

  // Persist collapsed state
  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', collapsed.toString());
  }, [collapsed]);

  // Track scroll position for header effects
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Keyboard shortcuts for navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger with Cmd/Ctrl + number
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey) {
        const shortcuts: Record<string, string> = {
          '1': '/',
          '2': '/chat',
          '3': '/projects',
          '4': '/tickets',
          '5': '/tasks',
          '6': '/failed',
          '7': '/summaries',
          '8': '/costs',
          '9': '/gateway',
          '0': '/settings',
        };
        if (shortcuts[e.key]) {
          e.preventDefault();
          navigate(shortcuts[e.key]);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  // Get current page info for dynamic header
  const currentPage = useMemo(() => {
    const path = location.pathname;
    // Check for detail pages first
    if (path.startsWith('/projects/') && path !== '/projects') {
      return { name: 'Project Details', parent: 'Projects', parentHref: '/projects' };
    }
    if (path.startsWith('/tickets/') && path !== '/tickets') {
      return { name: 'Ticket Details', parent: 'Tickets', parentHref: '/tickets' };
    }
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
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 p-3 transition-all duration-300 ease-out",
        collapsed ? "w-20" : "w-72",
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="sidebar-glass h-full rounded-[20px] flex flex-col">
          {/* Logo Section */}
          <div className={cn(
            "flex h-16 items-center border-b border-white/5 flex-shrink-0 transition-all",
            collapsed ? "justify-center px-2" : "justify-between px-4"
          )}>
            <Link to="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[var(--primary)]/10 shadow-[0_0_20px_var(--primary-glow)]">
                <Logo className="h-6 w-6 text-[var(--primary)]" />
              </div>
              {!collapsed && (
                <div>
                  <span className="text-base font-bold tracking-tight font-heading">GLINR</span>
                  <p className="text-[10px] text-[var(--muted-foreground)] leading-none">Task Manager</p>
                </div>
              )}
            </Link>

            {/* Mobile Close / Desktop Collapse */}
            {!collapsed && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg"
                onClick={() => {
                  if (window.innerWidth < 1024) {
                    setSidebarOpen(false);
                  } else {
                    setCollapsed(true);
                  }
                }}
              >
                {window.innerWidth < 1024 ? (
                  <X className="h-4 w-4" />
                ) : (
                  <PanelLeftClose className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>

          {/* Navigation */}
          <nav className={cn(
            "flex flex-col gap-1 flex-1 overflow-y-auto py-3",
            collapsed ? "px-2" : "px-3"
          )} data-tour="sidebar-nav">
            {/* Quick Search */}
            {!collapsed && (
              <button
                onClick={openCommandPalette}
                className="flex items-center gap-2 mx-1 mb-3 px-3 py-2 rounded-xl text-[12px] text-[var(--muted-foreground)] bg-[var(--muted)]/30 hover:bg-[var(--muted)]/50 border border-transparent hover:border-[var(--border)] transition-all"
              >
                <Search className="h-3.5 w-3.5" />
                <span className="flex-1 text-left">Search...</span>
                <kbd className="hidden sm:flex items-center gap-0.5 text-[10px] opacity-60">
                  <Command className="h-2.5 w-2.5" />K
                </kbd>
              </button>
            )}

            {/* Main Navigation */}
            {!collapsed && (
              <div className="px-3 py-1.5 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]/50">
                  Main
                </span>
              </div>
            )}
            <NavItem
              item={mainNav[0]}
              isActive={location.pathname === '/'}
              collapsed={collapsed}
              onClick={() => setSidebarOpen(false)}
              shortcut="⌘1"
            />
            <NavItem
              item={mainNav[1]}
              isActive={location.pathname === '/chat'}
              collapsed={collapsed}
              onClick={() => setSidebarOpen(false)}
              shortcut="⌘2"
            />
            <NavItem
              item={mainNav[2]}
              isActive={location.pathname === '/projects' || location.pathname.startsWith('/projects/')}
              collapsed={collapsed}
              onClick={() => setSidebarOpen(false)}
              shortcut="⌘3"
            />
            <NavItem
              item={mainNav[3]}
              isActive={location.pathname === '/tickets' || location.pathname.startsWith('/tickets/')}
              collapsed={collapsed}
              onClick={() => setSidebarOpen(false)}
              shortcut="⌘4"
            />
            <NavItem
              item={mainNav[4]}
              isActive={location.pathname === '/tasks' || location.pathname.startsWith('/tasks/')}
              collapsed={collapsed}
              onClick={() => setSidebarOpen(false)}
              badge={stats?.pending}
              shortcut="⌘5"
            />
            <NavItem
              item={mainNav[5]}
              isActive={location.pathname === '/failed'}
              collapsed={collapsed}
              onClick={() => setSidebarOpen(false)}
              badge={dlqStats?.total}
              shortcut="⌘6"
            />

            {/* Content Navigation */}
            <div className={cn("mt-4", collapsed && "mt-2")}>
              {!collapsed && (
                <div className="px-3 py-1.5 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]/50">
                    Content
                  </span>
                </div>
              )}
              <NavItem
                item={contentNav[0]}
                isActive={location.pathname === '/summaries' || location.pathname.startsWith('/summaries/')}
                collapsed={collapsed}
                onClick={() => setSidebarOpen(false)}
                shortcut="⌘7"
              />
              <NavItem
                item={contentNav[1]}
                isActive={location.pathname === '/costs'}
                collapsed={collapsed}
                onClick={() => setSidebarOpen(false)}
                shortcut="⌘8"
              />
            </div>

            {/* System Navigation */}
            <div className={cn("mt-4", collapsed && "mt-2")}>
              {!collapsed && (
                <div className="px-3 py-1.5 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]/50">
                    System
                  </span>
                </div>
              )}
              <NavItem
                item={systemNav[0]}
                isActive={location.pathname === '/cron'}
                collapsed={collapsed}
                onClick={() => setSidebarOpen(false)}
              />
              <NavItem
                item={systemNav[1]}
                isActive={location.pathname === '/gateway'}
                collapsed={collapsed}
                onClick={() => setSidebarOpen(false)}
                shortcut="⌘9"
              />
              <NavItem
                item={systemNav[2]}
                isActive={location.pathname === '/agents'}
                collapsed={collapsed}
                onClick={() => setSidebarOpen(false)}
              />
              <NavItem
                item={systemNav[3]}
                isActive={location.pathname === '/webhooks'}
                collapsed={collapsed}
                onClick={() => setSidebarOpen(false)}
              />
              <NavItem
                item={systemNav[4]}
                isActive={location.pathname === '/settings' || location.pathname.startsWith('/settings/')}
                collapsed={collapsed}
                onClick={() => setSidebarOpen(false)}
                shortcut="⌘0"
              />
            </div>

            {/* Admin Navigation - Only visible to admins */}
            {user?.role === 'admin' && (
              <div className={cn("mt-4", collapsed && "mt-2")}>
                {!collapsed && (
                  <div className="px-3 py-1.5 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-red-500/70">
                      Admin
                    </span>
                  </div>
                )}
                <NavItem
                  item={{ name: 'Users', href: '/admin/users', icon: Users }}
                  isActive={location.pathname === '/admin/users'}
                  collapsed={collapsed}
                  onClick={() => setSidebarOpen(false)}
                />
              </div>
            )}
          </nav>

          {/* Bottom Section - User Profile */}
          <div className={cn(
            "flex-shrink-0 rounded-b-[20px]",
            collapsed ? "p-2" : "p-3"
          )}>
            {collapsed ? (
              <div className="flex flex-col items-center gap-2">
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="h-8 w-8 rounded-full ring-2 ring-[var(--primary)]/30"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[var(--primary)] to-pink-500 ring-2 ring-[var(--primary)]/30 flex items-center justify-center text-xs font-medium text-white">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg"
                  onClick={() => setCollapsed(false)}
                >
                  <PanelLeft className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between px-3 py-2">
                <Link to="/settings/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                  {user?.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.name}
                      className="h-8 w-8 rounded-full ring-2 ring-[var(--primary)]/30"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[var(--primary)] to-pink-500 ring-2 ring-[var(--primary)]/30 flex items-center justify-center text-xs font-medium text-white">
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                  <span className="text-[13px] font-medium truncate max-w-[100px]">
                    {user?.name || 'User'}
                  </span>
                </Link>
                <ThemeToggle />
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className={cn(
        "flex flex-1 flex-col transition-all duration-300",
        collapsed ? "lg:pl-[104px]" : "lg:pl-[300px]"
      )}>
        {/* Header - macOS Liquid Toolbar Style with scroll effects */}
        <header className={cn(
          "sticky top-0 z-40 mx-3 mt-3 mb-0 transition-all duration-300",
          scrolled && "mt-0"
        )}>
          <div className={cn(
            "flex h-14 items-center justify-between px-4 transition-all duration-300",
            scrolled
              ? "header-glass-scrolled rounded-none rounded-b-[20px] shadow-lg"
              : "header-glass rounded-[20px]"
          )}>
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
                  onClick={() => canGoForward && navigate(1)}
                  disabled={!canGoForward}
                  className={cn(
                    "p-1.5 px-2 rounded-md transition-colors",
                    canGoForward
                      ? "hover:bg-white/10 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                      : "text-[var(--muted-foreground)]/30 cursor-not-allowed"
                  )}
                  title="Go forward"
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
                <UserMenu />
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
