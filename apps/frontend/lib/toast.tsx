import { create } from 'zustand';
import { CheckCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
    id: string;
    type: ToastType;
    message: string;
    duration?: number;
}

interface ToastStore {
    toasts: Toast[];
    addToast: (toast: Omit<Toast, 'id'>) => void;
    removeToast: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
    toasts: [],
    addToast: (toast) => {
        const id = Math.random().toString(36).substring(7);
        const newToast = { ...toast, id };

        set((state) => ({
            toasts: [...state.toasts, newToast],
        }));

        // Auto remove after duration
        setTimeout(() => {
            set((state) => ({
                toasts: state.toasts.filter((t) => t.id !== id),
            }));
        }, toast.duration || 4000);
    },
    removeToast: (id) =>
        set((state) => ({
            toasts: state.toasts.filter((t) => t.id !== id),
        })),
}));

// Helper function
export const toast = {
    success: (message: string, duration?: number) =>
        useToastStore.getState().addToast({ type: 'success', message, duration }),
    error: (message: string, duration?: number) =>
        useToastStore.getState().addToast({ type: 'error', message, duration }),
    info: (message: string, duration?: number) =>
        useToastStore.getState().addToast({ type: 'info', message, duration }),
    warning: (message: string, duration?: number) =>
        useToastStore.getState().addToast({ type: 'warning', message, duration }),
};

// Toast Container Component
export function ToastContainer() {
    const { toasts, removeToast } = useToastStore();

    return (
        <div className="fixed top-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={`pointer-events-auto px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 min-w-[320px] max-w-md animate-in slide-in-from-right duration-300 ${toast.type === 'success'
                            ? 'bg-green-600 text-white'
                            : toast.type === 'error'
                                ? 'bg-red-600 text-white'
                                : toast.type === 'warning'
                                    ? 'bg-yellow-600 text-white'
                                    : 'bg-blue-600 text-white'
                        }`}
                >
                    {toast.type === 'success' && <CheckCircle size={20} className="flex-shrink-0" />}
                    {toast.type === 'error' && <AlertTriangle size={20} className="flex-shrink-0" />}
                    {toast.type === 'info' && <Info size={20} className="flex-shrink-0" />}
                    {toast.type === 'warning' && <AlertTriangle size={20} className="flex-shrink-0" />}

                    <span className="font-medium flex-1">{toast.message}</span>

                    <button
                        onClick={() => removeToast(toast.id)}
                        className="ml-2 hover:opacity-80 transition-opacity flex-shrink-0"
                    >
                        <X size={18} />
                    </button>
                </div>
            ))}
        </div>
    );
}
