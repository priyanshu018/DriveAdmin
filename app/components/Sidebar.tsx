"use client";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Activity,
  TrendingUp,
  Users,
  LogOut,
  BadgeQuestionMark,
  X,
  Menu,
} from "lucide-react";

interface SidebarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
}

export default function Sidebar({
  isSidebarOpen,
  setIsSidebarOpen,
}: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    router.push("/auth/login");
  };

  const handleTabClick = (path: string) => {
    router.push(path);
    setIsSidebarOpen(false); // Close sidebar on mobile after navigation
  };

  const tabs = [
    {
      id: "traffic-signs",
      label: "Traffic Signs",
      path: "/traffic-signs",
      icon: LayoutDashboard,
    },
    {
      id: "user-activity",
      label: "User Activity",
      path: "/user-activity",
      icon: Activity,
    },
    {
      id: "user-progress",
      label: "User Progress",
      path: "/user-progress",
      icon: TrendingUp,
    },
    { id: "users", label: "Users", path: "/users", icon: Users },
    {
      id: "questions",
      label: "Questions",
      path: "/questions",
      icon: BadgeQuestionMark,
    },
  ];

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      {/* Mobile Header Bar (Visible only on mobile) */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-30 px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">Admin Dashboard</h1>
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <Menu className="w-6 h-6 text-gray-700" />
        </button>
      </div>

      {/* Backdrop Overlay (Mobile only) */}
      {isSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-screen bg-white border-r border-gray-200 z-50 flex flex-col
          transition-transform duration-300 ease-in-out
          
          /* Mobile: Slide from left, 80% width */
          w-80
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
          
          /* Desktop: Always visible, fixed width */
          lg:translate-x-0 lg:w-64
        `}
      >
        {/* Close Button (Mobile Only) */}
        <div className="lg:hidden flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-700" />
          </button>
        </div>

        {/* Header (Desktop Only) */}
        <div className="hidden lg:block p-6 mb-2">
          <h2 className="text-xl font-semibold text-gray-900 mb-1">
            Admin Dashboard
          </h2>
          <p className="text-sm text-gray-500">Management Console</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 lg:px-6 overflow-y-auto">
          <ul className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = pathname === tab.path;
              return (
                <li key={tab.id}>
                  <button
                    onClick={() => handleTabClick(tab.path)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      isActive
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium text-sm">{tab.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout Button */}
        <div className="p-4 lg:p-6 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium text-sm">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
