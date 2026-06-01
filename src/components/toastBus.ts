export type AppToastIntent = "none" | "primary" | "success" | "warning" | "danger";

export type AppToast = {
  id: string;
  message: string;
  intent: AppToastIntent;
};

type ToastInput = Omit<AppToast, "id">;
type ToastListener = (toasts: AppToast[]) => void;

let toastState: AppToast[] = [];
const toastListeners = new Set<ToastListener>();
const toastTimers = new Map<string, number>();

function emitToasts() {
  for (const listener of toastListeners) {
    listener(toastState);
  }
}

export function dismissToast(id: string) {
  const timeoutId = toastTimers.get(id);
  if (timeoutId) {
    window.clearTimeout(timeoutId);
    toastTimers.delete(id);
  }

  toastState = toastState.filter((toast) => toast.id !== id);
  emitToasts();
}

export function pushAppToast(input: ToastInput) {
  const toast: AppToast = {
    id: crypto.randomUUID(),
    message: input.message,
    intent: input.intent,
  };

  toastState = [...toastState, toast];
  emitToasts();

  const timeoutId = window.setTimeout(() => dismissToast(toast.id), 4200);
  toastTimers.set(toast.id, timeoutId);
}

export function subscribeToasts(listener: ToastListener) {
  toastListeners.add(listener);
  return () => {
    toastListeners.delete(listener);
  };
}

export function getToastState() {
  return toastState;
}
