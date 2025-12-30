import { useTheme } from 'next-themes';
import { useEffect } from 'react';

interface ForceLightThemeProps {
  children: React.ReactNode;
}

/**
 * Wrapper component that forces light theme for public pages.
 * Restores the user's preferred theme when unmounting.
 */
export function ForceLightTheme({ children }: ForceLightThemeProps) {
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    // Store the current theme before forcing light
    const previousTheme = theme;
    
    // Force light theme
    setTheme('light');

    // Restore previous theme on unmount (when navigating to app pages)
    return () => {
      if (previousTheme && previousTheme !== 'light') {
        setTheme(previousTheme);
      }
    };
  }, []);

  return <>{children}</>;
}
