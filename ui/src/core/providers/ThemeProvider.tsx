import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { useEffect, useState, type ReactNode } from 'react';

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [mounted, setMounted] = useState(false);
  const [darkVariant, setDarkVariant] = useState('dark');

  useEffect(() => {
    setMounted(true);
    // Load preference on mount
    const saved = localStorage.getItem('glinr-dark-variant') || 'dark';
    setDarkVariant(saved);

    // Listen for custom event from ThemeToggle
    const handleVariantChange = (e: any) => {
      setDarkVariant(e.detail);
    };

    window.addEventListener('glinr-theme-variant-change', handleVariantChange);
    return () => window.removeEventListener('glinr-theme-variant-change', handleVariantChange);
  }, []);

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      themes={['light', 'dark', 'midnight']}
      // This mapping ensures that 'system' mode (which resolves to 'dark')
      // uses the user's last selected dark variant (Blue or Black).
      value={{
        light: 'light',
        dark: darkVariant, 
        midnight: 'midnight'
      }}
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
