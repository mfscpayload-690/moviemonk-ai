import React from 'react';
import { XMarkIcon } from './icons';

interface ErrorBannerProps {
  message: string;
  onClose: () => void;
}

const ErrorBanner: React.FC<ErrorBannerProps> = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <div className="bg-red-600/90 text-white p-3 rounded-lg flex items-center justify-between animate-fade-in shadow-lg backdrop-blur-sm border border-red-400/50" role="alert">
      <p className="text-sm font-medium pr-4">{message}</p>
      <button 
        onClick={onClose} 
        aria-label="Dismiss error message"
        className="p-1 rounded-full hover:bg-red-500/50 focus:outline-none focus:ring-2 focus:ring-white/50 transition-colors flex-shrink-0"
      >
        <XMarkIcon className="w-5 h-5" />
      </button>
    </div>
  );
};

export default ErrorBanner;
