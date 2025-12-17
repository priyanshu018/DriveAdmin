"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./components/Sidebar";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();
  const isAuthPage = pathname?.startsWith("/auth");

  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <div className="flex min-h-screen">
          {!isAuthPage && (
            <Sidebar
              isSidebarOpen={isSidebarOpen}
              setIsSidebarOpen={setIsSidebarOpen}
            />
          )}

          {/* Responsive padding for mobile header + desktop sidebar */}
          <div
            className={`flex-1 ${!isAuthPage ? "pt-14 lg:pt-0 lg:ml-64" : ""}`}
          >
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
