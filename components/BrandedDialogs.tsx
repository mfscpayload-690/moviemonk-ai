import React, { useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { CheckIcon, InfoIcon, TrashIcon, XMarkIcon } from './icons';

type DialogTone = 'default' | 'destructive' | 'success';

interface DialogShellProps {
  open: boolean;
  title: string;
  description?: string;
  tone?: DialogTone;
  mobileSheet?: boolean;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  onClose: () => void;
}

const FOCUSABLE_SELECTOR = [
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[href]',
  '[tabindex]:not([tabindex="-1"])'
].join(', ');

function toneIcon(tone: DialogTone) {
  if (tone === 'destructive') return <TrashIcon className="w-5 h-5" />;
  if (tone === 'success') return <CheckIcon className="w-5 h-5" />;
  return <InfoIcon className="w-5 h-5" />;
}

function DialogShell({
  open,
  title,
  description,
  tone = 'default',
  mobileSheet = true,
  children,
  footer,
  onClose
}: DialogShellProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useMemo(() => `dialog-title-${Math.random().toString(36).slice(2, 8)}`, []);
  const descriptionId = useMemo(() => `dialog-description-${Math.random().toString(36).slice(2, 8)}`, []);

  useEffect(() => {
    if (!open) return;

    const previousBodyOverflow = document.body.style.overflow;
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = 'hidden';

    const focusFirst = () => {
      const node = containerRef.current;
      if (!node) return;
      const focusable = node.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (focusable.length > 0) {
        focusable[0].focus();
        return;
      }
      node.focus();
    };

    const frame = window.requestAnimationFrame(focusFirst);

    const onKeyDown = (event: KeyboardEvent) => {
      if (!containerRef.current) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== 'Tab') return;

      const focusable = Array.from(containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      if (focusable.length === 0) {
        event.preventDefault();
        containerRef.current.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (event.shiftKey && (active === first || !containerRef.current.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !containerRef.current.contains(active))) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousBodyOverflow;
      previousFocusRef.current?.focus();
    };
  }, [onClose, open]);

  if (!open) return null;

  const portalTarget = typeof document !== 'undefined'
    ? document.getElementById('modal-root') || document.body
    : null;

  if (!portalTarget) return null;

  return createPortal(
    <div
      className="mm-dialog-backdrop"
      role="presentation"
      onClick={onClose}
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={`mm-dialog-panel ${mobileSheet ? 'mm-dialog-panel-sheet' : ''}`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={`mm-dialog-tone mm-dialog-tone-${tone}`} aria-hidden="true">
          {toneIcon(tone)}
        </div>
        <div className="mm-dialog-header">
          <div className="min-w-0">
            <h2 id={titleId} className="mm-dialog-title">{title}</h2>
            {description && <p id={descriptionId} className="mm-dialog-description">{description}</p>}
          </div>
          <button
            type="button"
            className="mm-dialog-close"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
        {children && <div className="mm-dialog-body">{children}</div>}
        {footer && <div className="mm-dialog-footer">{footer}</div>}
      </div>
    </div>,
    portalTarget
  );
}

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: DialogTone;
  mobileSheet?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'default',
  mobileSheet,
  busy = false,
  onConfirm,
  onClose
}: ConfirmDialogProps) {
  return (
    <DialogShell
      open={open}
      title={title}
      description={description}
      tone={tone}
      mobileSheet={mobileSheet}
      onClose={busy ? () => undefined : onClose}
      footer={(
        <>
          <button type="button" className="mm-dialog-button mm-dialog-button-secondary" onClick={onClose} disabled={busy}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`mm-dialog-button ${tone === 'destructive' ? 'mm-dialog-button-danger' : 'mm-dialog-button-primary'}`}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? 'Working...' : confirmLabel}
          </button>
        </>
      )}
    />
  );
}

export interface PromptDialogProps {
  open: boolean;
  title: string;
  description?: string;
  placeholder?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: DialogTone;
  mobileSheet?: boolean;
  busy?: boolean;
  value: string;
  error?: string | null;
  onChange: (nextValue: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}

export function PromptDialog({
  open,
  title,
  description,
  placeholder,
  confirmLabel = 'Continue',
  cancelLabel = 'Cancel',
  tone = 'default',
  mobileSheet,
  busy = false,
  value,
  error,
  onChange,
  onConfirm,
  onClose
}: PromptDialogProps) {
  return (
    <DialogShell
      open={open}
      title={title}
      description={description}
      tone={tone}
      mobileSheet={mobileSheet}
      onClose={busy ? () => undefined : onClose}
      footer={(
        <>
          <button type="button" className="mm-dialog-button mm-dialog-button-secondary" onClick={onClose} disabled={busy}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`mm-dialog-button ${tone === 'destructive' ? 'mm-dialog-button-danger' : 'mm-dialog-button-primary'}`}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? 'Working...' : confirmLabel}
          </button>
        </>
      )}
    >
      <div className="space-y-3">
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`mm-dialog-input ${error ? 'is-invalid' : ''}`}
          placeholder={placeholder}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !busy) {
              event.preventDefault();
              onConfirm();
            }
          }}
        />
        {error && <p className="mm-dialog-error" role="alert">{error}</p>}
      </div>
    </DialogShell>
  );
}

export interface NoticeDialogProps {
  open: boolean;
  title: string;
  description?: string;
  tone?: DialogTone;
  mobileSheet?: boolean;
  closeLabel?: string;
  children?: React.ReactNode;
  onClose: () => void;
}

export function NoticeDialog({
  open,
  title,
  description,
  tone = 'default',
  mobileSheet,
  closeLabel = 'Close',
  children,
  onClose
}: NoticeDialogProps) {
  return (
    <DialogShell
      open={open}
      title={title}
      description={description}
      tone={tone}
      mobileSheet={mobileSheet}
      onClose={onClose}
      footer={(
        <button type="button" className="mm-dialog-button mm-dialog-button-primary" onClick={onClose}>
          {closeLabel}
        </button>
      )}
    >
      {children}
    </DialogShell>
  );
}
