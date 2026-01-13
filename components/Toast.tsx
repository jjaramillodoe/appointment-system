import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

export interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
  onClose: () => void;
}

export interface ToastConfig {
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({ message, type, duration = 5000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => {
        setIsVisible(false);
        onClose();
      }, 300); // Animation duration
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, 300);
  };

  if (!isVisible) return null;

  const getToastStyles = () => {
    const baseStyles = `fixed top-4 right-4 z-50 flex items-center p-4 rounded-lg shadow-lg transition-all duration-300 transform max-w-sm`;
    
    if (isExiting) {
      return `${baseStyles} translate-x-full opacity-0`;
    }

    const typeStyles = {
      success: 'bg-green-50 border border-green-200 text-green-800',
      error: 'bg-red-50 border border-red-200 text-red-800',
      info: 'bg-blue-50 border border-blue-200 text-blue-800'
    };

    return `${baseStyles} ${typeStyles[type]} translate-x-0 opacity-100`;
  };

  const getIcon = () => {
    const iconStyles = 'h-5 w-5 mr-3 flex-shrink-0';
    
    switch (type) {
      case 'success':
        return <CheckCircle className={`${iconStyles} text-green-500`} />;
      case 'error':
        return <XCircle className={`${iconStyles} text-red-500`} />;
      case 'info':
        return <Info className={`${iconStyles} text-blue-500`} />;
      default:
        return <Info className={`${iconStyles} text-blue-500`} />;
    }
  };

  return (
    <div className={getToastStyles()}>
      {getIcon()}
      <div className="flex-1 text-sm font-medium">
        {message}
      </div>
      <button
        onClick={handleClose}
        className="ml-4 text-gray-400 hover:text-gray-600 transition-colors"
        aria-label="Close notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

// Toast Container Component
export const ToastContainer: React.FC<{ toasts: (ToastProps & { id: string })[], removeToast: (id: string) => void }> = ({ 
  toasts, 
  removeToast 
}) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
};

export default Toast; 