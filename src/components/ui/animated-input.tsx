import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Check, AlertCircle } from "lucide-react";

export interface AnimatedInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: boolean;
  icon?: React.ReactNode;
}

const AnimatedInput = React.forwardRef<HTMLInputElement, AnimatedInputProps>(
  ({ className, type, label, error, success, icon, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);
    const [hasValue, setHasValue] = React.useState(!!props.value || !!props.defaultValue);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      props.onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      props.onBlur?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setHasValue(!!e.target.value);
      props.onChange?.(e);
    };

    return (
      <div className="space-y-2">
        {label && (
          <motion.label
            className="text-sm font-medium text-foreground block"
            animate={{
              color: error ? "hsl(var(--destructive))" : isFocused ? "hsl(var(--primary))" : "hsl(var(--foreground))",
            }}
            transition={{ duration: 0.2 }}
          >
            {label}
          </motion.label>
        )}
        <div className="relative">
          <motion.div
            className="absolute inset-0 rounded-xl pointer-events-none"
            animate={{
              boxShadow: isFocused
                ? error
                  ? "0 0 0 2px hsl(var(--destructive) / 0.2)"
                  : "0 0 0 3px hsl(var(--primary) / 0.1)"
                : "0 0 0 0px transparent",
            }}
            transition={{ duration: 0.2 }}
          />
          <motion.div
            animate={{
              scale: isFocused ? 1.01 : 1,
            }}
            transition={{ duration: 0.15 }}
          >
            <input
              type={type}
              className={cn(
                "flex h-12 w-full rounded-xl border bg-background px-4 py-3 text-base transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
                icon && "pr-12",
                error && "border-destructive",
                success && "border-green-500",
                !error && !success && "border-border focus:border-primary",
                className
              )}
              ref={ref}
              onFocus={handleFocus}
              onBlur={handleBlur}
              onChange={handleChange}
              {...props}
            />
          </motion.div>
          
          {/* Right side icon */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.15 }}
                >
                  <AlertCircle className="w-5 h-5 text-destructive" />
                </motion.div>
              )}
              {success && !error && hasValue && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.15 }}
                >
                  <Check className="w-5 h-5 text-green-500" />
                </motion.div>
              )}
              {icon && !error && !success && (
                <motion.div
                  animate={{ 
                    color: isFocused ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))" 
                  }}
                  transition={{ duration: 0.2 }}
                >
                  {icon}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Error message */}
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              transition={{ duration: 0.2 }}
              className="text-sm text-destructive flex items-center gap-1"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

AnimatedInput.displayName = "AnimatedInput";

export { AnimatedInput };
