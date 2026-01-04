import { useTheme } from 'next-themes';
import { useEffect, useRef } from 'react';

interface ForceLightThemeProps {
  children: React.ReactNode;
}

/**
 * Wrapper component that forces light theme for public pages.
 * Restores the user's preferred theme when unmounting.
 */
export function ForceLightTheme({ children }: ForceLightThemeProps) {
  const { theme, setTheme } = useTheme();
  const previousThemeRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    // Store the current theme before forcing light (only on mount)
    if (previousThemeRef.current === undefined) {
      previousThemeRef.current = theme;
    }
    
    // Force light theme
    setTheme('light');

    // Restore previous theme on unmount (when navigating to app pages)
    return () => {
      if (previousThemeRef.current && previousThemeRef.current !== 'light') {
        setTheme(previousThemeRef.current);
      }
    };
  }, [setTheme]);

  return <>{children}</>;
}
