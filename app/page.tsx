"use client";
import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) setError(error.message);
    else window.location.href = "/dashboard";
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/50">
            <span className="text-4xl">📦</span>
          </div>
          <h1 className="text-3xl font-black text-slate-100 tracking-wide">
            Proveeduría
          </h1>
          <p className="text-slate-400 mt-1">Dirección Administrativa</p>
        </div>

        {/* Card */}
        <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700 shadow-xl">
          <h2 className="text-xl font-bold text-slate-100 mb-1">
            Iniciar Sesión
          </h2>
          <p className="text-slate-500 text-sm mb-6">
            Ingresa tus credenciales para continuar
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2 tracking-wide">
                CORREO ELECTRÓNICO
              </label>
              <div className="flex items-center bg-slate-900 border border-slate-700 rounded-xl px-4">
                <span className="mr-3">✉️</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="correo@ejemplo.com"
                  className="flex-1 bg-transparent py-3 text-slate-100 placeholder-slate-600 outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2 tracking-wide">
                CONTRASEÑA
              </label>
              <div className="flex items-center bg-slate-900 border border-slate-700 rounded-xl px-4">
                <span className="mr-3">🔒</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="flex-1 bg-transparent py-3 text-slate-100 placeholder-slate-600 outline-none"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-900/30 border border-red-700 rounded-xl p-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-indigo-500/30 disabled:opacity-60"
            >
              {loading ? "Ingresando..." : "Ingresar →"}
            </button>
          </form>
        </div>

        <p className="text-center text-slate-700 text-xs mt-6">
          Sistema de Control de Bodega v1.0
        </p>
      </div>
    </div>
  );
}
