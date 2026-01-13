import { useState, useCallback } from 'react';
import { ToastConfig, ToastProps } from '../components/Toast';

interface ToastWithId extends ToastProps {
  id: string;
}

export const useToast = () => {
  const [toasts, setToasts] = useState<ToastWithId[]>([]);

  const addToast = useCallback((config: ToastConfig) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastWithId = {
      id,
      message: config.message,
      type: config.type,
      duration: config.duration || 5000,
      onClose: () => removeToast(id)
    };

    setToasts(prev => [...prev, newToast]);
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const showSuccess = useCallback((message: string, duration?: number) => {
    return addToast({ message, type: 'success', duration });
  }, [addToast]);

  const showError = useCallback((message: string, duration?: number) => {
    return addToast({ message, type: 'error', duration });
  }, [addToast]);

  const showInfo = useCallback((message: string, duration?: number) => {
    return addToast({ message, type: 'info', duration });
  }, [addToast]);

  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  return {
    toasts,
    addToast,
    removeToast,
    showSuccess,
    showError,
    showInfo,
    clearAll
  };
}; 