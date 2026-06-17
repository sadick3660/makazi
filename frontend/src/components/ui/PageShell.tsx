import type { ReactNode } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { Toaster } from "react-hot-toast";

interface Props {
  children: ReactNode;
  hideFooter?: boolean;
}

export default function PageShell({ children, hideFooter = false }: Props) {
  return (
    <div className="min-h-screen flex flex-col bg-surface-50">
      <Navbar />
      <main className="flex-1 pt-16">
        {children}
      </main>
      {!hideFooter && <Footer />}
      <Toaster position="top-right" toastOptions={{
        className: "!rounded-xl !shadow-card !text-sm !font-medium",
        success: { iconTheme: { primary: "#1B3A6B", secondary: "#fff" } },
        error:   { iconTheme: { primary: "#800020", secondary: "#fff" } },
      }} />
    </div>
  );
}
