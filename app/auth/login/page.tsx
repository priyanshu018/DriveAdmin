// app/auth/login/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import AuthForm from "@/app/components/AuthForm";
import { Shield } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is already logged in via Supabase
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.push("/traffic-signs");
      }
    });
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-lg">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome Back
          </h1>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
          <AuthForm type="login" />
        </div>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            Don't have an account?{" "}
            <Link
              href="/auth/signup"
              className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
            >
              Sign up
            </Link>
          </p>
        </div>

        <div className="text-center mt-8 text-xs text-gray-500">
          Protected by industry-standard encryption
        </div>
      </div>
    </div>
  );
}
