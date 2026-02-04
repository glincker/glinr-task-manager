/**
 * Collapsible Sidebar Component
 *
 * A reusable collapsible sidebar that slides in/out.
 * Can be positioned on left or right side.
 *
 * @example
 * ```tsx
 * <CollapsibleSidebar
 *   isOpen={sidebarOpen}
 *   onToggle={() => setSidebarOpen(!sidebarOpen)}
 *   title="History"
 *   icon={<History className="h-4 w-4" />}
 *   width={280}
 * >
 *   <YourContent />
 * </CollapsibleSidebar>
 * ```
 */

import { type ReactNode } from 'react';
import { PanelLeftClose, PanelLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CollapsibleSidebarProps {
  /** Whether the sidebar is open */
  isOpen: boolean;
  /** Callback when toggle button is clicked */
  onToggle: () => void;
  /** Sidebar title */
  title?: string;
  /** Optional subtitle/description */
  subtitle?: string;
  /** Icon to display next to title */
  icon?: ReactNode;
  /** Width of the sidebar when open (in pixels) */
  width?: number;
  /** Position of the sidebar */
  position?: 'left' | 'right';
  /** Content to render in the sidebar */
  children: ReactNode;
  /** Optional header actions (buttons, etc.) */
  headerActions?: ReactNode;
  /** Optional footer content */
  footer?: ReactNode;
  /** Additional class names for the container */
  className?: string;
  /** Whether to show the collapsed toggle button when closed */
  showCollapsedToggle?: boolean;
}

export function CollapsibleSidebar({
  isOpen,
  onToggle,
  title,
  subtitle,
  icon,
  width = 280,
  position = 'left',
  children,
  headerActions,
  footer,
  className,
  showCollapsedToggle = true,
}: CollapsibleSidebarProps) {
  const collapsedWidth = showCollapsedToggle ? 48 : 0;

  return (
    <div
      className={cn(
        'relative shrink-0 transition-all duration-300 ease-out h-full',
        className
      )}
      style={{ width: isOpen ? width : collapsedWidth }}
    >
      {/* Collapsed Toggle Button */}
      {!isOpen && showCollapsedToggle && (
        <div className="h-full flex flex-col items-center py-3 bg-muted/20 border-r border-border/30">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="h-9 w-9 rounded-xl hover:bg-muted/80"
            title={`Open ${title || 'sidebar'}`}
          >
            {position === 'left' ? (
              <PanelLeft className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </Button>
        </div>
      )}

      {/* Expanded Sidebar */}
      {isOpen && (
        <div
          className={cn(
            'relative flex flex-col h-full overflow-hidden',
            'bg-card/95 backdrop-blur-xl',
            'border-r border-border/30',
            'shadow-[2px_0_12px_-4px_rgba(0,0,0,0.1)]',
            'dark:shadow-[2px_0_16px_-4px_rgba(0,0,0,0.3)]',
            'animate-in slide-in-from-left-2 duration-200',
            position === 'right' && 'border-l border-r-0 slide-in-from-right-2 shadow-[-2px_0_12px_-4px_rgba(0,0,0,0.1)] dark:shadow-[-2px_0_16px_-4px_rgba(0,0,0,0.3)]'
          )}
          style={{ width }}
        >
          {/* Header */}
          {(title || headerActions) && (
            <div className="flex items-center justify-between p-3 border-b border-border/50">
              <div className="flex items-center gap-2 min-w-0">
                {icon && <span className="text-muted-foreground shrink-0">{icon}</span>}
                <div className="min-w-0">
                  {title && (
                    <h3 className="text-sm font-semibold truncate">{title}</h3>
                  )}
                  {subtitle && (
                    <p className="text-[10px] text-muted-foreground truncate">{subtitle}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                {headerActions}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onToggle}
                  className="h-7 w-7 rounded-lg hover:bg-muted shrink-0"
                  title="Collapse sidebar"
                >
                  {position === 'left' ? (
                    <PanelLeftClose className="h-3.5 w-3.5" />
                  ) : (
                    <PanelLeft className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto scrollbar-none liquid-fade-y">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="border-t border-border/50 p-3">
              {footer}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default CollapsibleSidebar;
