import { createContext, useCallback, useContext, useState } from 'react';
import { Toast, ToastContainer } from 'react-bootstrap';

const ToastContext = createContext(() => {});
export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const show = useCallback((message, variant = 'success') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, message, variant }]);
  }, []);
  const close = (id) => setToasts((t) => t.filter((x) => x.id !== id));
  return (
    <ToastContext.Provider value={show}>
      {children}
      <ToastContainer position="bottom-end" className="p-3" style={{ zIndex: 2000 }} role="status" aria-live="polite">
        {toasts.map((t) => (
          <Toast key={t.id} bg={t.variant} autohide delay={4000} onClose={() => close(t.id)} show>
            <Toast.Body className={t.variant === 'light' ? '' : 'text-white'}>{t.message}</Toast.Body>
          </Toast>
        ))}
      </ToastContainer>
    </ToastContext.Provider>
  );
}
