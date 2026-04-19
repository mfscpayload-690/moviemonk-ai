import React from 'react';
import { TagIcon, WatchedIcon, XMarkIcon } from './icons';

interface ActionToastProps {
  kind: 'watchlist' | 'watched';
  message: string;
  onUndo?: () => void;
  onDismiss: () => void;
  isUndoing?: boolean;
}

const ActionToast: React.FC<ActionToastProps> = ({
  kind,
  message,
  onUndo,
  onDismiss,
  isUndoing = false
}) => {
  return (
    <div className="mm-action-toast animate-fade-in" role="status" aria-live="polite">
      <div className="mm-action-toast-icon">
        {kind === 'watchlist' ? (
          <TagIcon className="w-4 h-4" />
        ) : (
          <WatchedIcon className="w-4 h-4" filled={true} />
        )}
      </div>
      <div className="mm-action-toast-body">
        <p className="mm-action-toast-message">{message}</p>
      </div>
      {onUndo && (
        <button
          type="button"
          className="mm-action-toast-undo"
          onClick={onUndo}
          disabled={isUndoing}
        >
          {isUndoing ? 'Undoing...' : 'Undo'}
        </button>
      )}
      <button
        type="button"
        className="mm-action-toast-close"
        aria-label="Dismiss action toast"
        onClick={onDismiss}
      >
        <XMarkIcon className="w-4 h-4" />
      </button>
    </div>
  );
};

export default ActionToast;

