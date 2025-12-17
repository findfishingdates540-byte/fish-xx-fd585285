import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface SelectableCardProps {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export function SelectableCard({
  selected,
  onClick,
  children,
  className,
  disabled,
}: SelectableCardProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "relative p-4 rounded-xl border-2 text-left transition-colors",
        selected
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/50 bg-background",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      whileHover={!disabled ? { scale: 1.02 } : undefined}
      whileTap={!disabled ? { scale: 0.98 } : undefined}
      transition={{ duration: 0.15 }}
    >
      {/* Selection indicator */}
      <motion.div
        className={cn(
          "absolute top-3 right-3 w-5 h-5 rounded-full border-2 flex items-center justify-center",
          selected ? "border-primary bg-primary" : "border-border bg-background"
        )}
        animate={{
          scale: selected ? 1 : 0.9,
        }}
        transition={{ duration: 0.15 }}
      >
        <AnimatePresence>
          {selected && (
            <motion.svg
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="w-3 h-3 text-primary-foreground"
              fill="currentColor"
              viewBox="0 0 12 12"
            >
              <path d="M10.28 2.28L3.989 8.575 1.695 6.28A1 1 0 00.28 7.695l3 3a1 1 0 001.414 0l7-7A1 1 0 0010.28 2.28z" />
            </motion.svg>
          )}
        </AnimatePresence>
      </motion.div>

      {children}
    </motion.button>
  );
}

interface SelectableChipProps {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export function SelectableChip({
  selected,
  onClick,
  children,
  icon,
  className,
}: SelectableChipProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-2.5 rounded-full border-2 transition-colors",
        selected
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background hover:border-primary/50 text-foreground",
        className
      )}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.15 }}
    >
      {icon && (
        <motion.span
          animate={{
            color: selected ? "currentColor" : "hsl(var(--muted-foreground))",
          }}
        >
          {icon}
        </motion.span>
      )}
      <span className="text-sm font-medium">{children}</span>
      <AnimatePresence>
        {selected && (
          <motion.svg
            initial={{ scale: 0, width: 0 }}
            animate={{ scale: 1, width: 16 }}
            exit={{ scale: 0, width: 0 }}
            transition={{ duration: 0.15 }}
            className="w-4 h-4"
            fill="currentColor"
            viewBox="0 0 12 12"
          >
            <path d="M10.28 2.28L3.989 8.575 1.695 6.28A1 1 0 00.28 7.695l3 3a1 1 0 001.414 0l7-7A1 1 0 0010.28 2.28z" />
          </motion.svg>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
