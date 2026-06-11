"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error);
      return;
    }

    router.push("/staff");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream px-4">
      <div className="film-strip bg-cream-card rounded-2xl shadow-2xl shadow-amber/10 w-full max-w-md p-10 border border-amber/10">

        <div className="space-y-6">
          {/* Brand */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 bg-amber/10 rounded-full px-4 py-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber" />
              <span className="text-xs font-semibold text-amber tracking-widest uppercase">
                Staff Panel
              </span>
            </div>
            <h1 className="font-display text-4xl font-black italic text-espresso">
              Kygoo <span className="text-amber">Frame</span>
            </h1>
            <hr className="golden-divider w-24 mx-auto" />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-4 rounded-xl font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-mahogany/50 uppercase tracking-wider mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@kygoo.com"
                className="w-full bg-cream border-2 border-amber/10 rounded-xl px-4 py-3 text-sm text-espresso placeholder:text-mahogany/20 focus:outline-none focus:border-amber focus:ring-4 focus:ring-amber/10 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-mahogany/50 uppercase tracking-wider mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full bg-cream border-2 border-amber/10 rounded-xl px-4 py-3 text-sm text-espresso placeholder:text-mahogany/20 focus:outline-none focus:border-amber focus:ring-4 focus:ring-amber/10 transition-all"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-espresso text-cream rounded-xl py-3.5 text-sm font-bold hover:bg-mahogany transition-all duration-200 shadow-lg shadow-espresso/10 hover:shadow-xl hover:shadow-espresso/20 hover:-translate-y-0.5"
            >
              Masuk ke Dashboard
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
