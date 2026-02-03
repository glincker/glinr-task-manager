import { Toaster } from 'sonner';

export function ToastProvider() {
  return (
    <Toaster
      position="bottom-center"
      expand={true}
      richColors={false}
      closeButton
      duration={5000}
      toastOptions={{
        className: 'toast-glass',
        style: {
          padding: '16px',
        },
      }}
    />
  );
}
