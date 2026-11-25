"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navigation/Navbar";
import { Card } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { useToast } from "@/components/common/Toast";
import { api, saveSession } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 12) {
      toast("Password must be at least 12 characters long.", "error");
      return;
    }

    setBusy(true);

    try {
      const result = await api.register(name.trim(), email.trim(), password);
      saveSession(result);
      toast(`Account created! Welcome, ${result.user.displayName}!`, "success");
      router.push("/dashboard");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Registration failed.", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex flex-col">
      <Navbar user={null} activeTab="register" />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <Card className="max-w-md w-full p-6 sm:p-8">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">
              Join HappenStance
            </h1>
            <p className="text-sm text-[#64748B] mt-1.5">
              Make the most of your professional network
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#334155] uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                required
                minLength={2}
                maxLength={80}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full px-3.5 py-2.5 bg-white border border-[#CBD5E1] rounded-lg text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0A66C2] focus:border-transparent transition-all"
              />
            </div>

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
                Password <span className="text-[#64748B] font-normal">(12+ characters)</span>
              </label>
              <input
                type="password"
                required
                minLength={12}
                maxLength={72}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 bg-white border border-[#CBD5E1] rounded-lg text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0A66C2] focus:border-transparent transition-all"
              />
              <p className="text-[11px] text-[#64748B] mt-1">
                Must be at least 12 characters for your security.
              </p>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={busy}
              className="w-full mt-2 font-bold"
            >
              Agree & Join
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-[#F1F5F9] text-center">
            <p className="text-sm text-[#64748B]">
              Already on HappenStance?{" "}
              <Link
                href="/login"
                className="font-bold text-[#0A66C2] hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        </Card>
      </main>
    </div>
  );
}
