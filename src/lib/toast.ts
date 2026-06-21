import { create } from "zustand";

export type ToastType = "success" | "error";
export type Toast = { id: number; msg: string; type: ToastType };

type ToastState = {
  toasts: Toast[];
  show: (msg: string, type?: ToastType) => void;
  dismiss: (id: number) => void;
};

let seq = 0;

export const useToast = create<ToastState>((set) => ({
  toasts: [],
  show: (msg, type = "success") => {
    const id = ++seq;
    set((s) => ({ toasts: [...s.toasts, { id, msg, type }] }));
    setTimeout(
      () => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
      2500
    );
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

/** เรียกได้จากนอก React (เช่นใน store) */
export const toast = {
  success: (msg: string) => useToast.getState().show(msg, "success"),
  error: (msg: string) => useToast.getState().show(msg, "error"),
};
