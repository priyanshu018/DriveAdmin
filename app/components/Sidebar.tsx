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
} from "lucide-react";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
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

  const handleTabClick = (tabId: string, path: string) => {
    onTabChange(tabId);
    router.push(path);
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
    <aside className="w-64 bg-white border-r border-gray-200 p-6 h-screen fixed left-0 top-0 flex flex-col">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-1">
          Admin Dashboard
        </h2>
        <p className="text-sm text-gray-500">Management Console</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1">
        <ul className="space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = pathname === tab.path;

            return (
              <li key={tab.id}>
                <button
                  onClick={() => handleTabClick(tab.id, tab.path)}
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
      <div className="pt-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium text-sm">Logout</span>
        </button>
      </div>
    </aside>
  );
}
