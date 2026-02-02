import * as React from "react"
import { Bell, CheckCircle2, AlertCircle, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface Notification {
  id: string
  title: string
  description: string
  time: string
  type: 'success' | 'error' | 'info'
  read: boolean
}

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    title: 'Task Completed',
    description: 'Documentation enrichment for glinr-v3 is finished.',
    time: '2m ago',
    type: 'success',
    read: false,
  },
  {
    id: '2',
    title: 'Agent Offline',
    description: 'Claude Code adapter lost connection.',
    time: '15m ago',
    type: 'error',
    read: false,
  },
  {
    id: '3',
    title: 'New Summary',
    description: 'Release notes generated for branch main.',
    time: '1h ago',
    type: 'info',
    read: true,
  },
]

export function NotificationBell() {
  const [notifications, setNotifications] = React.useState(MOCK_NOTIFICATIONS)
  const unreadCount = notifications.filter(n => !n.read).length

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })))
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-full hover-lift transition-liquid"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5 text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></span>
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[320px] glass-heavy rounded-3xl p-0 overflow-hidden shadow-2xl border-white/10">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-white/[0.02]">
          <DropdownMenuLabel className="p-0 text-sm font-bold uppercase tracking-widest">Notifications</DropdownMenuLabel>
          {unreadCount > 0 && (
            <button 
              onClick={markAllRead}
              className="text-[10px] font-bold text-primary hover:underline uppercase tracking-tight"
            >
              Mark all read
            </button>
          )}
        </div>
        
        <div className="max-h-[400px] overflow-y-auto scrollbar-none">
          {notifications.length > 0 ? (
            notifications.map((n, i) => (
              <React.Fragment key={n.id}>
                <DropdownMenuItem className="flex flex-col items-start gap-1 p-5 cursor-default focus:bg-white/5 transition-colors group">
                  <div className="flex w-full items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                       {n.type === 'success' && <CheckCircle2 className="h-4 w-4 text-green-400" />}
                       {n.type === 'error' && <AlertCircle className="h-4 w-4 text-red-400" />}
                       {n.type === 'info' && <Clock className="h-4 w-4 text-blue-400" />}
                       <span className={cn("text-[13px] font-bold", !n.read && "text-foreground")}>
                         {n.title}
                       </span>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-medium">{n.time}</span>
                  </div>
                  <p className="text-[12px] text-muted-foreground leading-relaxed pr-4">
                    {n.description}
                  </p>
                  {!n.read && (
                    <div className="absolute top-5 right-2 h-1.5 w-1.5 rounded-full bg-primary" />
                  )}
                </DropdownMenuItem>
                {i < notifications.length - 1 && <DropdownMenuSeparator className="bg-white/5 m-0" />}
              </React.Fragment>
            ))
          ) : (
            <div className="py-12 text-center">
              <Bell className="h-10 w-10 mx-auto text-muted-foreground opacity-20 mb-3" />
              <p className="text-sm text-muted-foreground">No new notifications</p>
            </div>
          )}
        </div>
        
        <div className="px-5 py-3 border-t border-white/5 bg-white/[0.02] text-center">
             <button className="text-[11px] font-bold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest">
                View All Activity
             </button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
