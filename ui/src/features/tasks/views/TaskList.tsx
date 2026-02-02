import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { Loader2, Search, Filter, X, ListTodo, Clock, CheckCircle2, AlertCircle, Play } from 'lucide-react';
import { api, type Task } from '@/core/api/client';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status', icon: ListTodo },
  { value: 'pending', label: 'Pending', icon: Clock },
  { value: 'in_progress', label: 'Running', icon: Play },
  { value: 'completed', label: 'Completed', icon: CheckCircle2 },
  { value: 'failed', label: 'Failed', icon: AlertCircle },
];

const SOURCE_OPTIONS = ['all', 'github', 'jira', 'linear', 'manual', 'webhook'];
const AGENT_OPTIONS = ['all', 'openclaw', 'claude-code', 'auto'];

export function TaskList() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Get filters from URL params for shareability
  const statusFilter = searchParams.get('status') || 'all';
  const sourceFilter = searchParams.get('source') || 'all';
  const agentFilter = searchParams.get('agent') || 'all';
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [page, setPage] = useState(0);
  const limit = 20;

  // Update URL when filters change
  const updateFilter = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value === 'all' || value === '') {
      newParams.delete(key);
    } else {
      newParams.set(key, value);
    }
    setSearchParams(newParams);
    setPage(0);
  };

  const clearFilters = () => {
    setSearchParams({});
    setSearchQuery('');
    setPage(0);
  };

  const hasActiveFilters = statusFilter !== 'all' || sourceFilter !== 'all' || agentFilter !== 'all' || searchQuery;

  const { data, isLoading, error } = useQuery({
    queryKey: ['tasks', { status: statusFilter === 'all' ? undefined : statusFilter, limit, offset: page * limit }],
    queryFn: () =>
      api.tasks.list({
        status: statusFilter === 'all' ? undefined : statusFilter,
        limit,
        offset: page * limit,
      }),
  });

  const tasks = data?.tasks ?? [];
  const total = data?.total ?? 0;

  // Client-side filtering for source, agent, and search
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch = !searchQuery ||
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSource = sourceFilter === 'all' || task.source.toLowerCase() === sourceFilter;
      const matchesAgent = agentFilter === 'all' ||
        (task.assignedAgent?.toLowerCase() === agentFilter) ||
        (agentFilter === 'auto' && !task.assignedAgent);
      return matchesSearch && matchesSource && matchesAgent;
    });
  }, [tasks, searchQuery, sourceFilter, agentFilter]);

  const getStatusBadge = (status: Task['status']) => {
    const config: Record<string, { variant: 'success' | 'destructive' | 'info' | 'secondary', icon: typeof CheckCircle2 }> = {
      completed: { variant: 'success', icon: CheckCircle2 },
      failed: { variant: 'destructive', icon: AlertCircle },
      running: { variant: 'info', icon: Play },
      pending: { variant: 'secondary', icon: Clock },
    };
    const statusConfig = config[status] || { variant: 'secondary' as const, icon: Clock };
    const { variant, icon: Icon } = statusConfig;
    return (
      <Badge variant={variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  if (error) {
    return (
      <div className="glass rounded-[28px] p-12 text-center">
        <AlertCircle className="h-12 w-12 mx-auto text-red-400 mb-4" />
        <p className="text-lg font-bold text-red-400">Error loading tasks</p>
        <p className="text-sm text-muted-foreground mt-1">{(error as Error).message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Tasks</h2>
          <p className="text-muted-foreground text-sm">
            {total} total tasks • {filteredTasks.length} showing
          </p>
        </div>
      </header>

      {/* Filters Bar */}
      <div className="glass rounded-[20px] p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks by title or description..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                updateFilter('q', e.target.value);
              }}
              className="pl-10 bg-white/5 border-white/10 rounded-xl h-10"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap gap-2">
            <Select value={statusFilter} onValueChange={(v) => updateFilter('status', v)}>
              <SelectTrigger className="w-[140px] bg-white/5 border-white/10 rounded-xl">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="glass-heavy rounded-xl border-white/10">
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <span className="flex items-center gap-2">
                      <opt.icon className="h-3.5 w-3.5" />
                      {opt.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sourceFilter} onValueChange={(v) => updateFilter('source', v)}>
              <SelectTrigger className="w-[130px] bg-white/5 border-white/10 rounded-xl">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent className="glass-heavy rounded-xl border-white/10">
                {SOURCE_OPTIONS.map((src) => (
                  <SelectItem key={src} value={src} className="capitalize">
                    {src === 'all' ? 'All Sources' : src}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={agentFilter} onValueChange={(v) => updateFilter('agent', v)}>
              <SelectTrigger className="w-[140px] bg-white/5 border-white/10 rounded-xl">
                <SelectValue placeholder="Agent" />
              </SelectTrigger>
              <SelectContent className="glass-heavy rounded-xl border-white/10">
                {AGENT_OPTIONS.map((agent) => (
                  <SelectItem key={agent} value={agent} className="capitalize">
                    {agent === 'all' ? 'All Agents' : agent}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="rounded-xl text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Active Filters Pills */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-white/5">
            <Filter className="h-4 w-4 text-muted-foreground" />
            {statusFilter !== 'all' && (
              <span className="px-2 py-0.5 rounded-lg bg-blue-500/10 text-blue-400 text-xs font-medium">
                Status: {statusFilter}
              </span>
            )}
            {sourceFilter !== 'all' && (
              <span className="px-2 py-0.5 rounded-lg bg-purple-500/10 text-purple-400 text-xs font-medium capitalize">
                Source: {sourceFilter}
              </span>
            )}
            {agentFilter !== 'all' && (
              <span className="px-2 py-0.5 rounded-lg bg-green-500/10 text-green-400 text-xs font-medium capitalize">
                Agent: {agentFilter}
              </span>
            )}
            {searchQuery && (
              <span className="px-2 py-0.5 rounded-lg bg-orange-500/10 text-orange-400 text-xs font-medium">
                Search: "{searchQuery}"
              </span>
            )}
          </div>
        )}
      </div>

      {/* Task List */}
      {isLoading ? (
        <div className="glass rounded-[28px] p-12 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="glass rounded-[28px] p-12 text-center">
          <ListTodo className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
          <p className="text-lg font-bold text-muted-foreground">No tasks found</p>
          <p className="text-sm text-muted-foreground/60 mt-1">
            {hasActiveFilters ? 'Try adjusting your filters' : 'Create a task to get started'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredTasks.map((task) => (
            <Link
              key={task.id}
              to={`/tasks/${task.id}`}
              className="block glass rounded-[16px] p-4 hover-lift transition-liquid group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
                      {task.title}
                    </h3>
                    {getStatusBadge(task.status)}
                  </div>
                  {task.description && (
                    <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                      {task.description}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 px-2 py-0.5 rounded-md bg-white/5">
                      {task.source}
                    </span>
                    {task.assignedAgent && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary/80 px-2 py-0.5 rounded-md bg-primary/10">
                        {task.assignedAgent}
                      </span>
                    )}
                    {task.labels.slice(0, 3).map((label) => (
                      <Badge key={label} variant="outline" className="text-[10px] px-1.5 py-0">
                        {label}
                      </Badge>
                    ))}
                    <span className="text-[10px] text-muted-foreground/50 ml-auto">
                      {new Date(task.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {filteredTasks.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page + 1} • Showing {Math.min(filteredTasks.length, limit)} of {total}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page === 0}
              className="rounded-xl border-white/10"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={(page + 1) * limit >= total}
              className="rounded-xl border-white/10"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
