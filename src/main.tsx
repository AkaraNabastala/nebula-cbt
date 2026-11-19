import { StrictMode } from "react";
import { Toaster } from "sonner";
import { createRoot } from "react-dom/client";
import "@fontsource/poppins/400.css";
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/600.css";
import "@fontsource/poppins/700.css";
import "./index.css";
import App from "./App";
import { AuthProvider } from "./contexts/AuthContext";
import { useTheme } from "./hooks/useTheme";

function ApplicationRoot() {
  const { resolvedTheme } = useTheme();

  return (
    <>
      <AuthProvider>
        <App />
      </AuthProvider>
      <Toaster theme={resolvedTheme} position="top-right" richColors closeButton duration={3500} visibleToasts={4} />
    </>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ApplicationRoot />
  </StrictMode>,
);
