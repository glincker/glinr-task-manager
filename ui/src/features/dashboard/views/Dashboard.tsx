import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  ListTodo,
  CheckCircle2,
  AlertCircle,
  Clock,
  Bot,
  FileText,
  Loader2,
  TrendingUp,
  WifiOff,
  RefreshCw,
} from 'lucide-react';
import { api } from '@/core/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { StatusIndicator } from '@/components/shared/StatusIndicator';

// Polling interval for real-time updates (5 seconds)
const POLL_INTERVAL = 5000;

function StatCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  glowColor,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  description?: string;
  trend?: 'up' | 'down' | 'neutral';
  glowColor?: string;
}) {
  return (
    <Card className="glass hover-lift transition-liquid overflow-hidden relative group">
      {/* Background glow */}
      {glowColor && (
        <div
          className={cn(
            'absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity',
            glowColor
          )}
        />
      )}
      <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="h-8 w-8 rounded-lg glass-heavy flex items-center justify-center">
          <Icon className="h-4 w-4 text-blue-400" />
        </div>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="flex items-end gap-2">
          <span className="text-3xl font-bold">{value}</span>
          {trend && (
            <TrendingUp
              className={cn(
                'h-4 w-4 mb-1',
                trend === 'up' && 'text-green-500',
                trend === 'down' && 'text-red-500 rotate-180',
                trend === 'neutral' && 'text-muted-foreground'
              )}
            />
          )}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

function BackendOffline({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground text-sm">
            Real-time overview of your AI agent operations.
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full glass border-red-500/20">
          <StatusIndicator status="error" label="OFFLINE" showLabel={true} />
        </div>
      </header>

      <Card className="glass rounded-[28px] border-red-500/10">
        <CardContent className="p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="h-20 w-20 rounded-full glass-heavy flex items-center justify-center mb-6 border border-red-500/20">
              <WifiOff className="h-10 w-10 text-red-400" />
            </div>
            <h3 className="text-xl font-bold mb-2">Backend Not Running</h3>
            <p className="text-muted-foreground max-w-md mb-6">
              Unable to connect to the API server. Make sure the backend is running on port 3000.
            </p>
            <div className="space-y-3">
              <code className="block px-4 py-2 rounded-lg bg-black/20 font-mono text-sm text-muted-foreground">
                pnpm dev
              </code>
              <p className="text-xs text-muted-foreground">
                This will start both the API server and UI together
              </p>
            </div>
            <Button
              onClick={onRetry}
              variant="outline"
              className="mt-6 rounded-xl"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry Connection
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function Dashboard() {
  // Tasks with real-time polling (only when no error)
  const {
    data: tasksData,
    isLoading: tasksLoading,
    error: tasksError,
    refetch: refetchTasks,
  } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => api.tasks.list({ limit: 100 }),
    refetchInterval: (query) => query.state.error ? false : POLL_INTERVAL,
    refetchIntervalInBackground: false,
  });

  // Summary stats with polling
  const {
    data: statsData,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ['summaries', 'stats'],
    queryFn: () => api.summaries.stats(),
    refetchInterval: (query) => query.state.error ? false : POLL_INTERVAL * 2,
  });

  // Recent summaries with polling
  const {
    data: recentSummaries,
    isLoading: summariesLoading,
    error: summariesError,
    refetch: refetchSummaries,
  } = useQuery({
    queryKey: ['summaries', 'recent'],
    queryFn: () => api.summaries.recent(5),
    refetchInterval: (query) => query.state.error ? false : POLL_INTERVAL,
  });

  const hasError = tasksError || statsError || summariesError;
  const isLoading = tasksLoading || statsLoading || summariesLoading;

  const handleRetry = () => {
    refetchTasks();
    refetchStats();
    refetchSummaries();
  };

  // Show offline state if any API call fails
  if (hasError && !isLoading) {
    return <BackendOffline onRetry={handleRetry} />;
  }

  const tasks = tasksData?.tasks ?? [];
  const pendingCount = tasks.filter((t) => t.status === 'pending').length;
  const runningCount = tasks.filter((t) => t.status === 'in_progress').length;
  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const failedCount = tasks.filter((t) => t.status === 'failed').length;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
            <p className="text-muted-foreground text-sm">
              Real-time overview of your AI agent operations.
            </p>
          </div>
        </header>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-32 rounded-[20px] glass animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground text-sm">
            Real-time overview of your AI agent operations.
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full glass border-white/10">
          <StatusIndicator status="online" label="LIVE" showLabel={true} />
        </div>
      </header>

      {/* Main Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Total Tasks"
          value={tasks.length}
          icon={ListTodo}
          description="All tasks in queue"
          glowColor="bg-blue-500"
        />
        <StatCard
          title="Pending"
          value={pendingCount}
          icon={Clock}
          description="Waiting to start"
          glowColor="bg-yellow-500"
        />
        <StatCard
          title="Running"
          value={runningCount}
          icon={Loader2}
          description="Currently executing"
          glowColor="bg-blue-500"
        />
        <StatCard
          title="Completed"
          value={completedCount}
          icon={CheckCircle2}
          description="Successfully finished"
          trend={completedCount > 0 ? 'up' : 'neutral'}
          glowColor="bg-green-500"
        />
        <StatCard
          title="Failed"
          value={failedCount}
          icon={AlertCircle}
          description="Need attention"
          trend={failedCount > 0 ? 'down' : 'neutral'}
          glowColor="bg-red-500"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Summaries"
          value={statsData?.totalCount ?? 0}
          icon={FileText}
          glowColor="bg-purple-500"
        />
        <StatCard
          title="Active Agents"
          value={Object.keys(statsData?.byAgent ?? {}).length}
          icon={Bot}
          glowColor="bg-cyan-500"
        />
        <StatCard
          title="Files Changed"
          value={statsData?.filesChangedCount ?? 0}
          icon={FileText}
          glowColor="bg-orange-500"
        />
      </div>

      {/* Recent Activity Panels */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Tasks */}
        <Card className="glass rounded-[28px]">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-bold">Recent Tasks</CardTitle>
            <Link
              to="/tasks"
              className="text-xs text-primary hover:underline font-bold tracking-tight"
            >
              VIEW ALL →
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tasks.slice(0, 5).map((task) => (
                <Link
                  key={task.id}
                  to={`/tasks/${task.id}`}
                  className="flex items-center justify-between rounded-2xl glass-heavy p-4 hover-lift transition-liquid group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-bold group-hover:text-primary transition-colors">
                      {task.title}
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">{task.source}</p>
                  </div>
                  <Badge
                    variant={
                      task.status === 'completed'
                        ? 'success'
                        : task.status === 'failed'
                          ? 'destructive'
                          : task.status === 'in_progress'
                            ? 'info'
                            : 'secondary'
                    }
                    className={cn(
                      "rounded-full px-3 py-1 text-[10px] font-bold uppercase",
                      task.status === 'in_progress' && 'animate-pulse'
                    )}
                  >
                    {task.status}
                  </Badge>
                </Link>
              ))}
              {tasks.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center opacity-40">
                  <ListTodo className="h-16 w-16 text-muted-foreground mb-4" />
                  <p className="font-bold">No tasks found</p>
                  <p className="text-xs">Connect a webhook or CLI to get started</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Summaries */}
        <Card className="glass rounded-[28px]">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-bold">Recent Summaries</CardTitle>
            <Link
              to="/summaries"
              className="text-xs text-primary hover:underline font-bold tracking-tight"
            >
              VIEW ALL →
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(recentSummaries ?? []).map((summary) => (
                <div
                  key={summary.id}
                  className="rounded-2xl glass-heavy p-4 hover-lift transition-liquid"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="truncate font-bold">{summary.title}</p>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/5 border border-white/5 uppercase tracking-tighter">
                      {summary.agent}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                    {summary.whatChanged}
                  </p>
                </div>
              ))}
              {(recentSummaries ?? []).length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center opacity-40">
                  <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                  <p className="font-bold">No summaries yet</p>
                  <p className="text-xs">Agent reports will appear here</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
