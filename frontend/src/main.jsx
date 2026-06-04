import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";

function BootScreen() {
  const [status, setStatus] = useState("connecting"); // connecting | ready | timeout
  const [dots, setDots] = useState("");

  useEffect(() => {
    // 等待动画
    const dotTimer = setInterval(() => setDots((d) => (d.length >= 3 ? "" : d + ".")), 500);

    // 轮询后端直到苏醒
    let attempts = 0;
    const check = async () => {
      try {
        const res = await fetch("/api/health", { signal: AbortSignal.timeout(5000) });
        if (res.ok) {
          setStatus("ready");
          clearInterval(dotTimer);
          return;
        }
      } catch {}
      attempts++;
      if (attempts > 20) {
        setStatus("timeout");
        clearInterval(dotTimer);
        return;
      }
      setTimeout(check, 3000);
    };
    check();

    return () => clearInterval(dotTimer);
  }, []);

  if (status === "ready") return <App />;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-white to-pink-50">
      <div className="text-center">
        <div className="text-5xl mb-6 animate-bounce">✍️</div>
        <h1 className="text-xl font-bold text-gray-800 mb-2">RedWriter</h1>
        {status === "connecting" ? (
          <>
            <p className="text-gray-500 text-sm mb-4">正在连接服务器{dots}</p>
            <div className="w-10 h-10 mx-auto border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-gray-400 mt-4">免费服务器休眠中，首次唤醒约需 30 秒</p>
          </>
        ) : (
          <>
            <p className="text-gray-500 text-sm mb-4">连接超时</p>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary text-sm"
            >
              重新连接
            </button>
          </>
        )}
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <BootScreen />
    </BrowserRouter>
  </React.StrictMode>
);
