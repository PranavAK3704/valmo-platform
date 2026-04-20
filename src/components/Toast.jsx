import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";

const ToastContext = createContext(null);
export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);

  const show = useCallback((msg, kind = "success") => {
    setToast({ msg, kind });
    setTimeout(() => setToast(null), 2400);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {toast && (
        <div className={`toast ${toast.kind}`}>
          {toast.kind === "error" ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}
          {toast.msg}
        </div>
      )}
    </ToastContext.Provider>
  );
}
