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
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6 selection:bg-primary/30 transition-colors duration-500 relative overflow-hidden">
      
      {/* Ambient Glows - Nilah IA signature */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden h-full w-full">
        <div className="absolute -top-[10%] -left-[10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] dark:bg-primary/10 animate-pulse" />
        <div className="absolute top-[20%] -right-[5%] w-[400px] h-[400px] bg-accent/20 rounded-full blur-[100px] dark:bg-accent/10 transition-all duration-1000" />
        <div className="absolute -bottom-[10%] left-[20%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[140px] dark:bg-violet-900/10" />
      </div>
      
      <div className="w-full max-w-md relative z-10 flex flex-col gap-10">
        
        {/* Header Section */}
        <div className="flex flex-col items-center text-center animate-in fade-in slide-in-from-top-4 duration-1000">
           <div className="relative mb-8 group">
             <div className="absolute -inset-4 bg-primary/20 rounded-full blur-2xl group-hover:bg-primary/30 transition-all duration-500" />
             <div className="h-20 w-20 bg-gradient-to-br from-primary to-accent rounded-[24px] flex items-center justify-center relative shadow-2xl shadow-primary/20 rotate-3 group-hover:rotate-0 transition-transform duration-500">
                <Target className="h-10 w-10 text-white" />
             </div>
           </div>
           
           <div className="space-y-2">
              <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-foreground uppercase leading-none">
                Nilah<span className="text-gemini">FLOW</span>
              </h1>
              <div className="flex items-center justify-center gap-3">
                 <div className="h-px w-8 bg-border" />
                 <span className="text-xs font-black text-muted-foreground uppercase tracking-[0.4em] opacity-80">
                   Premium CRM Engine
                 </span>
                 <div className="h-px w-8 bg-border" />
              </div>
           </div>
        </div>

        {/* Form Container with Glassmorphism */}
        <div className="glass-widget p-8 md:p-12 rounded-[2.5rem] shadow-2xl border border-white/10 relative overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
          
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
             <Sparkles size={120} className="text-primary" />
          </div>

          <div className="flex items-center gap-3 mb-10">
             <div className="w-8 h-8 rounded-xl bg-primary/20 text-primary flex items-center justify-center">
                <Shield size={16} />
             </div>
             <div>
                <p className="text-xs font-black text-foreground uppercase tracking-widest leading-none mb-1">Vault Access</p>
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Identidad Protegida</p>
             </div>
          </div>

          <form className="flex flex-col gap-8">
            
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-2xl text-[11px] font-black uppercase tracking-wider text-center animate-in zoom-in-95">
                [ ERROR: {error} ]
              </div>
            )}

            <div className="space-y-3">
              <label className="text-xs font-black text-muted-foreground uppercase tracking-[0.3em] ml-2">Vector de Acceso (Email)</label>
              <div className="relative group">
                <Mail className="w-4 h-4 text-primary absolute left-6 top-1/2 -translate-y-1/2 transition-transform group-focus-within:scale-110" />
                <input 
                  type="email" 
                  autoFocus
                  required
                  placeholder="admin@koratflow.com"
                  className="premium-input w-full pl-14 py-5 h-auto text-sm font-bold bg-muted/30 border-transparent focus:bg-background focus:border-primary/50"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-black text-muted-foreground uppercase tracking-[0.3em] ml-2">Protocolo de Seguridad (Password)</label>
              <div className="relative group">
                <Lock className="w-4 h-4 text-primary absolute left-6 top-1/2 -translate-y-1/2 transition-transform group-focus-within:scale-110" />
                <input 
                  type="password" 
                  required
                  placeholder="••••••••"
                  className="premium-input w-full pl-14 py-5 h-auto text-sm font-bold bg-muted/30 border-transparent focus:bg-background focus:border-primary/50"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-5 mt-4">
              <button 
                type="button" 
                onClick={handleLogin}
                disabled={loading}
                className="btn-gradient-primary w-full h-16 group relative overflow-hidden"
              >
                {loading 
                  ? <Loader2 className="w-6 h-6 animate-spin" /> 
                  : <span className="flex items-center justify-center gap-3 relative z-10 transition-transform group-hover:gap-5">
                      Iniciar Secuencia
                      <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </span>
                }
              </button>
              
              <button 
                type="button" 
                onClick={handleRegister}
                disabled={loading}
                className="w-full py-4 rounded-full font-black text-xs uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all border border-transparent hover:border-border"
              >
                Registrar Nuevo Nodo
              </button>
            </div>
          </form>
        </div>

        <div className="flex items-center justify-between px-6 opacity-30">
           <div className="h-px flex-1 bg-border" />
           <p className="px-6 text-xs font-black tracking-[0.6em] uppercase whitespace-nowrap">
             KORAT FLOW EST. 2026
           </p>
           <div className="h-px flex-1 bg-border" />
        </div>

      </div>
    </div>
  );
}
