import type { ReactNode } from 'react';
import { ThemeProvider } from './ThemeProvider';
import { QueryProvider } from './QueryProvider';
import { EventStreamProvider } from './EventStreamProvider';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <QueryProvider>
      <ThemeProvider>
        <EventStreamProvider>
          {children}
        </EventStreamProvider>
      </ThemeProvider>
    </QueryProvider>
  );
}

export { ThemeProvider } from './ThemeProvider';
export { QueryProvider } from './QueryProvider';
export { EventStreamProvider } from './EventStreamProvider';
