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
  const [activeTab, setActiveTab] = useState("traffic-signs");
  const pathname = usePathname();

  // Check if current page is an auth page (login or signup)
  const isAuthPage = pathname?.startsWith("/auth");

  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <div className="flex">
          {/* Only show sidebar if NOT on auth pages */}
          {!isAuthPage && (
            <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
          )}

          {/* Remove left margin on auth pages for full width */}
          <div className={`flex-1 ${!isAuthPage ? "ml-60" : ""}`}>
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
