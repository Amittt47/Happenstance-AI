"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navigation/Navbar";
import { Card } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { useToast } from "@/components/common/Toast";
import { api, saveSession } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);

    try {
      const result = await api.login(email.trim(), password);
      saveSession(result);
      toast(`Welcome back, ${result.user.displayName || "Member"}!`, "success");
      router.push("/dashboard");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Authentication failed.", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex flex-col">
      <Navbar user={null} activeTab="login" />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <Card className="max-w-md w-full p-6 sm:p-8">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">
              Sign in to HappenStance
            </h1>
            <p className="text-sm text-[#64748B] mt-1.5">
              Stay updated on your professional relationships
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#334155] uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full px-3.5 py-2.5 bg-white border border-[#CBD5E1] rounded-lg text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0A66C2] focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#334155] uppercase tracking-wider mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 bg-white border border-[#CBD5E1] rounded-lg text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0A66C2] focus:border-transparent transition-all"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={busy}
              className="w-full mt-2 font-bold"
            >
              Sign in
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-[#F1F5F9] text-center">
            <p className="text-sm text-[#64748B]">
              New to HappenStance?{" "}
              <Link
                href="/register"
                className="font-bold text-[#0A66C2] hover:underline"
              >
                Join now
              </Link>
            </p>
          </div>
        </Card>
      </main>
    </div>
  );
}
