/**
 * Chat Sidebar Component
 *
 * Collapsible sidebar for chat history with:
 * - Time-based grouping (Today, Yesterday, Last 7 days, etc.)
 * - Relative time display
 * - Search functionality
 * - Delete conversations
 * - Project grouping
 * - localStorage persistence for open/close state
 */

import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  History,
  MessageSquarePlus,
  Search,
  X,
  Trash2,
  ChevronDown,
  ChevronRight,
  Plus,
  FolderOpen,
  Folder,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { CollapsibleSidebar } from '@/components/shared/CollapsibleSidebar';
import { cn } from '@/lib/utils';
import type { Conversation } from '../types';

// Storage key for sidebar state
const SIDEBAR_STATE_KEY = 'chat-sidebar-open';

// Project type
interface Project {
  id: string;
  name: string;
  color?: string;
}

// Time grouping categories
type TimeGroup = 'today' | 'yesterday' | 'last7days' | 'last30days' | 'older';

const TIME_GROUP_LABELS: Record<TimeGroup, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  last7days: 'Last 7 Days',
  last30days: 'Last 30 Days',
  older: 'Older',
};

/**
 * Get relative time string (e.g., "2h ago", "yesterday")
 */
function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
}

/**
 * Get time group for a date
 */
function getTimeGroup(date: Date): TimeGroup {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const last7days = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const last30days = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  if (date >= today) return 'today';
  if (date >= yesterday) return 'yesterday';
  if (date >= last7days) return 'last7days';
  if (date >= last30days) return 'last30days';
  return 'older';
}

/**
 * Group conversations by time period
 */
function groupConversationsByTime(conversations: Conversation[]): Record<TimeGroup, Conversation[]> {
  const groups: Record<TimeGroup, Conversation[]> = {
    today: [],
    yesterday: [],
    last7days: [],
    last30days: [],
    older: [],
  };

  conversations.forEach((conv) => {
    const date = new Date(conv.updatedAt);
    const group = getTimeGroup(date);
    groups[group].push(conv);
  });

  return groups;
}

type GroupBy = 'time' | 'project';

interface ChatSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  conversations: Conversation[];
  currentConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation?: (id: string) => void;
  projects?: Project[];
  width?: number;
  persistState?: boolean;
}

export function ChatSidebar({
  isOpen,
  onToggle,
  conversations,
  currentConversationId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  projects = [],
  width = 300,
  persistState = true,
}: ChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [groupBy, setGroupBy] = useState<GroupBy>('time');

  // Persist sidebar state to localStorage
  useEffect(() => {
    if (persistState) {
      localStorage.setItem(SIDEBAR_STATE_KEY, JSON.stringify(isOpen));
    }
  }, [isOpen, persistState]);

  // Filter and group conversations
  const { filteredConversations, groupedByTime, groupedByProject } = useMemo(() => {
    const filtered = searchQuery.trim()
      ? conversations.filter((conv) =>
          conv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          conv.preview?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : conversations;

    // Group by project
    const byProject: Record<string, Conversation[]> = { _none: [] };
    projects.forEach((p) => {
      byProject[p.id] = [];
    });
    filtered.forEach((conv) => {
      const projectId = (conv as Conversation & { projectId?: string }).projectId;
      if (projectId && byProject[projectId]) {
        byProject[projectId].push(conv);
      } else {
        byProject._none.push(conv);
      }
    });

    return {
      filteredConversations: filtered,
      groupedByTime: groupConversationsByTime(filtered),
      groupedByProject: byProject,
    };
  }, [conversations, searchQuery, projects]);

  const toggleGroup = useCallback((group: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) {
        next.delete(group);
      } else {
        next.add(group);
      }
      return next;
    });
  }, []);

  const timeGroups: TimeGroup[] = ['today', 'yesterday', 'last7days', 'last30days', 'older'];
  const projectGroups = ['_none', ...projects.map((p) => p.id)];

  return (
    <CollapsibleSidebar
      isOpen={isOpen}
      onToggle={onToggle}
      title="Chats"
      subtitle={`${conversations.length} conversation${conversations.length !== 1 ? 's' : ''}`}
      icon={<History className="h-4 w-4" />}
      width={width}
      headerActions={
        <div className="flex items-center gap-1">
          {projects.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setGroupBy(groupBy === 'time' ? 'project' : 'time')}
              className="h-7 w-7 rounded-lg hover:bg-primary/10"
              title={groupBy === 'time' ? 'Group by project' : 'Group by time'}
            >
              {groupBy === 'time' ? (
                <FolderOpen className="h-3.5 w-3.5" />
              ) : (
                <History className="h-3.5 w-3.5" />
              )}
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onNewChat}
            className="h-7 w-7 rounded-lg hover:bg-primary/10"
            title="New conversation"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
      }
      footer={
        <Button
          variant="default"
          size="sm"
          className="w-full text-xs shadow-sm"
          onClick={onNewChat}
        >
          <MessageSquarePlus className="h-3.5 w-3.5 mr-1.5" />
          New Conversation
        </Button>
      }
    >
      {/* Search */}
      <div className="p-3 border-b border-border/30">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/70" />
          <Input
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 pl-9 pr-9 text-xs bg-muted/30 border border-border/40 rounded-xl focus:bg-background focus:border-primary/30 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted/80 transition-colors"
            >
              <X className="h-3 w-3 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 px-2">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center px-4">
            <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mb-3">
              <MessageSquarePlus className="h-7 w-7 text-muted-foreground/40" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              {searchQuery ? 'No matching chats' : 'No chats yet'}
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1 max-w-45">
              {searchQuery ? 'Try a different search term' : 'Start a new conversation to see it here'}
            </p>
          </div>
        ) : groupBy === 'time' ? (
          <div className="py-2 space-y-1">
            {timeGroups.map((group) => {
              const groupConvs = groupedByTime[group];
              if (groupConvs.length === 0) return null;

              const isCollapsed = collapsedGroups.has(group);

              return (
                <div key={group}>
                  {/* Group Header */}
                  <button
                    onClick={() => toggleGroup(group)}
                    className="w-full flex items-center gap-2 px-2 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 hover:text-muted-foreground rounded-lg hover:bg-muted/40 transition-colors"
                  >
                    {isCollapsed ? (
                      <ChevronRight className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5" />
                    )}
                    <span>{TIME_GROUP_LABELS[group]}</span>
                    <span className="ml-auto text-[10px] font-medium bg-muted/60 px-1.5 py-0.5 rounded-full">
                      {groupConvs.length}
                    </span>
                  </button>

                  {/* Group Items */}
                  {!isCollapsed && (
                    <div className="mt-1 space-y-1">
                      {groupConvs.map((conv) => (
                        <ConversationItem
                          key={conv.id}
                          conversation={conv}
                          isActive={currentConversationId === conv.id}
                          onSelect={() => onSelectConversation(conv.id)}
                          onDelete={onDeleteConversation ? () => onDeleteConversation(conv.id) : undefined}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-2 space-y-1">
            {projectGroups.map((projectId) => {
              const groupConvs = groupedByProject[projectId] || [];
              if (groupConvs.length === 0) return null;

              const isCollapsed = collapsedGroups.has(projectId);
              const project = projects.find((p) => p.id === projectId);
              const projectName = projectId === '_none' ? 'No Project' : project?.name || 'Unknown';

              return (
                <div key={projectId}>
                  {/* Group Header */}
                  <button
                    onClick={() => toggleGroup(projectId)}
                    className="w-full flex items-center gap-2 px-2 py-2 text-[11px] font-semibold text-muted-foreground/70 hover:text-muted-foreground rounded-lg hover:bg-muted/40 transition-colors"
                  >
                    {isCollapsed ? (
                      <Folder className="h-3.5 w-3.5" />
                    ) : (
                      <FolderOpen className="h-3.5 w-3.5" />
                    )}
                    <span className="truncate">{projectName}</span>
                    <span className="ml-auto text-[10px] font-medium bg-muted/60 px-1.5 py-0.5 rounded-full shrink-0">
                      {groupConvs.length}
                    </span>
                  </button>

                  {/* Group Items */}
                  {!isCollapsed && (
                    <div className="mt-1 space-y-1">
                      {groupConvs.map((conv) => (
                        <ConversationItem
                          key={conv.id}
                          conversation={conv}
                          isActive={currentConversationId === conv.id}
                          onSelect={() => onSelectConversation(conv.id)}
                          onDelete={onDeleteConversation ? () => onDeleteConversation(conv.id) : undefined}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </CollapsibleSidebar>
  );
}

/**
 * Individual conversation item
 */
function ConversationItem({
  conversation,
  isActive,
  onSelect,
  onDelete,
}: {
  conversation: Conversation;
  isActive: boolean;
  onSelect: () => void;
  onDelete?: () => void;
}) {
  const relativeTime = useMemo(
    () => getRelativeTime(new Date(conversation.updatedAt)),
    [conversation.updatedAt]
  );

  return (
    <div
      className={cn(
        'group relative flex items-start gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer',
        'border border-transparent',
        isActive
          ? 'bg-primary/8 border-primary/20 text-foreground shadow-sm'
          : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground hover:border-border/50'
      )}
      onClick={onSelect}
    >
      <div className={cn(
        'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors',
        isActive ? 'bg-primary/15' : 'bg-muted/50 group-hover:bg-muted'
      )}>
        <MessageSquarePlus className={cn(
          'h-4 w-4',
          isActive ? 'text-primary' : 'text-muted-foreground/70'
        )} />
      </div>
      <div className="flex-1 min-w-0 py-0.5">
        <p className={cn(
          'text-[13px] font-medium truncate leading-tight',
          isActive && 'text-foreground'
        )}>{conversation.title}</p>
        <p className="text-[11px] text-muted-foreground/70 truncate mt-1 leading-tight">
          {conversation.preview || 'No messages yet'}
        </p>
        <div className="flex items-center gap-2 mt-1.5 text-[10px] text-muted-foreground/50">
          <span className="flex items-center gap-1">
            <span className="font-medium">{conversation.messageCount}</span>
            <span>msgs</span>
          </span>
          <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
          <span>{relativeTime}</span>
        </div>
      </div>

      {/* Delete button - show on hover */}
      {onDelete && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              className={cn(
                'absolute right-2 top-2 p-1.5 rounded-lg transition-all',
                'opacity-0 group-hover:opacity-100',
                'hover:bg-destructive/10 hover:text-destructive',
                'focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-destructive/20'
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent onClick={(e) => e.stopPropagation()}>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-destructive" />
                Delete Conversation
              </AlertDialogTitle>
              <AlertDialogDescription className="pt-2">
                Are you sure you want to delete <span className="font-medium text-foreground">"{conversation.title}"</span>?
                This will permanently remove all {conversation.messageCount} messages and cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-4">
              <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}

export default ChatSidebar;
