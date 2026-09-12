import React from "react";
import { createRoot } from "react-dom/client";
import Part5App from "./Part5App";
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: boolean }
> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? (
      <main
        style={{
          maxWidth: 520,
          margin: "80px auto",
          padding: 24,
          fontFamily: "sans-serif",
        }}
      >
        <h1>画面を開けませんでした</h1>
        <p>学習記録は消去していません。再読み込みしてお試しください。</p>
        <button onClick={() => location.reload()}>再読み込み</button>
      </main>
    ) : (
      this.props.children
    );
  }
}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <Part5App />
    </ErrorBoundary>
  </React.StrictMode>,
);
if ("serviceWorker" in navigator && import.meta.env.PROD)
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* Learning still works online if the browser blocks offline storage. */
    });
  });
