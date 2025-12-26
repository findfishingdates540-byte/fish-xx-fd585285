import { useState, useRef, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Reply, Trash2, Forward, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface MessageContextMenuProps {
  children: ReactNode;
  onReply: () => void;
  onDelete: () => void;
  onForward?: () => void;
  messageContent: string;
  isMine: boolean;
  isDeleted?: boolean;
  className?: string;
}

interface MenuPosition {
  x: number;
  y: number;
}

const LONG_PRESS_DURATION = 500;

export function MessageContextMenu({
  children,
  onReply,
  onDelete,
  onForward,
  messageContent,
  isMine,
  isDeleted = false,
  className,
}: MessageContextMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<MenuPosition>({ x: 0, y: 0 });
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (isDeleted) return;
    
    const touch = e.touches[0];
    longPressTimer.current = setTimeout(() => {
      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
      
      // Calculate position - center the menu on the touch point
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        setPosition({
          x: touch.clientX - rect.left,
          y: touch.clientY - rect.top,
        });
      }
      
      setIsOpen(true);
    }, LONG_PRESS_DURATION);
  }, [isDeleted]);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleTouchMove = useCallback(() => {
    // Cancel long press if user moves finger
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(messageContent);
    toast.success('Message copied');
    setIsOpen(false);
  }, [messageContent]);

  const handleReply = useCallback(() => {
    onReply();
    setIsOpen(false);
  }, [onReply]);

  const handleDelete = useCallback(() => {
    onDelete();
    setIsOpen(false);
  }, [onDelete]);

  const handleForward = useCallback(() => {
    onForward?.();
    setIsOpen(false);
  }, [onForward]);

  const closeMenu = useCallback(() => {
    setIsOpen(false);
  }, []);

  const menuItems = [
    { icon: Copy, label: 'Copy', action: handleCopy, show: true },
    { icon: Reply, label: 'Reply', action: handleReply, show: true },
    { icon: Forward, label: 'Forward', action: handleForward, show: !!onForward },
    { icon: Trash2, label: 'Delete', action: handleDelete, show: true, destructive: true },
  ].filter(item => item.show);

  return (
    <div 
      ref={containerRef}
      className={cn("relative", className)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
      onContextMenu={(e) => {
        if (isDeleted) return;
        e.preventDefault();
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
          setPosition({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
          });
        }
        setIsOpen(true);
      }}
    >
      {children}

      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={closeMenu}
              onTouchStart={closeMenu}
            />
            
            {/* Context Menu */}
            <motion.div
              className={cn(
                "fixed z-50 min-w-[160px] rounded-xl bg-popover border border-border shadow-xl overflow-hidden",
              )}
              style={{
                left: `min(${position.x}px, calc(100vw - 180px))`,
                top: `min(${position.y}px, calc(100vh - 250px))`,
                transform: 'translate(-50%, -100%)',
              }}
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 10 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              {/* Message preview */}
              <div className="px-3 py-2 border-b border-border bg-muted/50">
                <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                  {messageContent.slice(0, 50)}{messageContent.length > 50 ? '...' : ''}
                </p>
              </div>
              
              {/* Actions */}
              <div className="py-1">
                {menuItems.map((item, index) => (
                  <motion.button
                    key={item.label}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors",
                      item.destructive 
                        ? "text-destructive hover:bg-destructive/10" 
                        : "text-foreground hover:bg-muted"
                    )}
                    onClick={item.action}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </motion.button>
                ))}
              </div>
              
              {/* Close button for mobile */}
              <div className="border-t border-border">
                <button
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted transition-colors"
                  onClick={closeMenu}
                >
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}