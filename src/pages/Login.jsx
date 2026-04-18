import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Target, Lock, Mail, Loader2, ArrowRight, Shield, Zap, Sparkles } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); }
    setLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) { setError(error.message); }
    else { alert('¡Cuenta Creada! Ahora intenta loguearte con esos datos.'); }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 min-h-[100dvh] w-full bg-slate-950 flex flex-col items-center justify-center p-4">
      
      {/* Background Gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[80vw] md:w-[500px] h-[80vw] md:h-[500px] bg-primary/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[80vw] md:w-[600px] h-[80vw] md:h-[600px] bg-indigo-600/10 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3" />
      </div>
      
      <div className="w-full max-w-[400px] flex flex-col gap-8 relative z-10">
        
        {/* Header */}
        <div className="flex flex-col items-center text-center">
           <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-indigo-500 flex items-center justify-center shadow-xl shadow-primary/20 mb-6">
              <Target className="w-8 h-8 text-white" />
           </div>
           <h1 className="text-3xl font-bold tracking-tight text-white">
             Korat<span className="text-primary">Flow</span>
           </h1>
           <p className="text-slate-400 text-sm mt-2">Plataforma CRM Premium</p>
        </div>

        {/* Minimalist Form */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 md:p-8 rounded-3xl w-full shadow-2xl">
          <form className="flex flex-col gap-5">
            
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium rounded-xl text-center">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 ml-1">Correo Electrónico</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input 
                  type="email" 
                  autoFocus
                  required
                  placeholder="admin@correo.com"
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-900/50 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-slate-600"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 ml-1">Contraseña</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input 
                  type="password" 
                  required
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-900/50 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-slate-600"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 mt-4">
              <button 
                type="button" 
                onClick={handleLogin}
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Entrar'}
              </button>
              
              <button 
                type="button" 
                onClick={handleRegister}
                disabled={loading}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-3.5 rounded-xl transition-all border border-white/5 active:scale-95 disabled:opacity-50 text-sm"
              >
                Crear cuenta
              </button>
            </div>
          </form>
        </div>
        
      </div>
    </div>
  );
}
