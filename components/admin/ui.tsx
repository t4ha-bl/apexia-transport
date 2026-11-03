'use client';
import { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { CheckCircle, WarningCircle, X } from '@phosphor-icons/react';

/* ---------- Shared style tokens ---------- */

export const inputClass =
  'w-full bg-offblack border border-white/10 px-4 py-3 font-sans text-[14px] text-ghost placeholder:text-muted/40 outline-none focus:border-white/40 transition-colors rounded-[2px]';

export const labelClass = 'block font-sans text-[11px] text-muted tracking-[0.2em] uppercase mb-2';

export const primaryBtn =
  'inline-flex items-center justify-center gap-2 bg-ghost text-offblack font-sans font-medium text-[12px] uppercase tracking-[0.16em] px-5 py-2.5 rounded-[2px] hover:bg-goldpale transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

export const ghostBtn =
  'inline-flex items-center justify-center gap-2 border border-white/15 text-ghost font-sans font-medium text-[12px] uppercase tracking-[0.16em] px-5 py-2.5 rounded-[2px] hover:border-white/50 transition-colors disabled:opacity-50';

export const dangerBtn =
  'inline-flex items-center justify-center gap-2 border border-red-500/30 text-red-400 font-sans font-medium text-[12px] uppercase tracking-[0.16em] px-5 py-2.5 rounded-[2px] hover:bg-red-500/10 transition-colors disabled:opacity-50';

/* ---------- Page header ---------- */

export function PageHeader({ eyebrow, title, subtitle, action }: {
  eyebrow?: string; title: string; subtitle?: string; action?: ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 pb-6 border-b border-white/10">
      <div>
        {eyebrow && <div className="font-sans text-[10px] text-muted tracking-label uppercase mb-2">{eyebrow}</div>}
        <h1 className="font-display text-[36px] md:text-[42px] leading-none text-ghost">{title}</h1>
        {subtitle && <p className="font-sans text-[13px] text-muted mt-3">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/* ---------- Modal ---------- */

export function Modal({ open, onClose, title, children, maxWidth = 'max-w-[600px]' }: {
  open: boolean; onClose: () => void; title: string; children: ReactNode; maxWidth?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${maxWidth} max-h-[90vh] overflow-y-auto bg-ink border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] rounded-[2px]`}>
        <div className="flex items-center justify-between px-6 md:px-8 py-5 border-b border-white/10">
          <h3 className="font-display italic text-[26px] text-ghost">{title}</h3>
          <button onClick={onClose} className="text-muted hover:text-ghost transition-colors" aria-label="Fermer">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 md:p-8">{children}</div>
      </div>
    </div>
  );
}

export function ConfirmDialog({ open, title, message, confirmLabel = 'Supprimer', onConfirm, onCancel }: {
  open: boolean; title: string; message: string; confirmLabel?: string; onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <Modal open={open} onClose={onCancel} title={title} maxWidth="max-w-[460px]">
      <p className="font-sans text-[14px] text-muted leading-relaxed">{message}</p>
      <div className="flex justify-end gap-3 mt-8">
        <button onClick={onCancel} className={ghostBtn}>Annuler</button>
        <button onClick={onConfirm} className={dangerBtn}>{confirmLabel}</button>
      </div>
    </Modal>
  );
}

/* ---------- Toasts ---------- */

type Toast = { id: number; kind: 'success' | 'error'; text: string };
const ToastContext = createContext<(kind: Toast['kind'], text: string) => void>(() => {});

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  const push = useCallback((kind: Toast['kind'], text: string) => {
    const id = nextId.current++;
    setToasts(t => [...t, { id, kind, text }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }, []);

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="fixed bottom-6 right-6 z-[120] flex flex-col gap-2">
        {toasts.map(t => (
          <div key={t.id} className={`flex items-center gap-3 px-4 py-3 bg-ink border rounded-[2px] shadow-xl font-sans text-[13px] ${t.kind === 'success' ? 'border-green-500/30 text-ghost' : 'border-red-500/30 text-ghost'}`}>
            {t.kind === 'success'
              ? <CheckCircle size={18} weight="fill" className="text-green-400" />
              : <WarningCircle size={18} weight="fill" className="text-red-400" />}
            {t.text}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
