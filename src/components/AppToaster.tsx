import { useEffect, useMemo, useState } from "react";
import { dismissToast, getToastState, subscribeToasts, type AppToast } from "./toastBus";

export function AppToaster() {
  const [toasts, setToasts] = useState<AppToast[]>(getToastState());

  useEffect(() => {
    return subscribeToasts(setToasts);
  }, []);

  const visibleToasts = useMemo(() => toasts.slice(-4), [toasts]);

  return (
    <div aria-live="polite" aria-atomic="true" className="app-toaster">
      {visibleToasts.map((toast) => (
        <div className={`app-toast intent-${toast.intent}`} key={toast.id} role="status">
          <span>{toast.message}</span>
          <button aria-label="Dismiss toast" onClick={() => dismissToast(toast.id)} type="button">
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
