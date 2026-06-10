import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/axios';
import { Send, Key, Mail, AlertTriangle, Activity } from 'lucide-react';

export const AdminLoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await api.post('/api/admin/login', { email, password });
      
      if (response.data.success) {
        // Save token in localStorage
        localStorage.setItem('admin_token', response.data.token);
        localStorage.setItem('admin_user', JSON.stringify(response.data.admin));
        
        // Redirect to admin panel
        navigate('/admin');
      } else {
        setError(response.data.error?.message || 'Login failed.');
      }
    } catch (err: any) {
      console.error('Admin login error:', err);
      setError(err.response?.data?.error?.message || 'Invalid credentials or connection issue.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] flex flex-col justify-center items-center p-6 text-[#fafafa] font-sans">
      {/* Glow Effect */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#7f22fe]/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md bg-[#121214] border border-white/5 p-8 rounded-2xl shadow-2xl flex flex-col gap-6 relative z-10">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="size-12 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500 shadow-lg shadow-red-500/10 animate-pulse">
            <Send className="size-5 rotate-45" />
          </div>
          <h2 className="font-bold text-xl leading-8 text-white mt-2">GramFlow Operations</h2>
          <p className="text-zinc-500 text-sm leading-5 max-w-xs">
            Authenticate with staff credentials to access administrative systems and telemetry.
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-3.5 text-xs flex gap-2.5 items-start">
            <AlertTriangle className="size-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">
              Staff Email Address
            </label>
            <div className="rounded-lg bg-[#09090b] border border-white/5 flex px-3 py-2.5 items-center gap-2 focus-within:border-[#7f22fe]/40 transition-colors">
              <Mail className="size-4 text-zinc-600" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-transparent outline-none text-sm text-white placeholder:text-zinc-600 w-full"
                placeholder="name@company.com"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">
              Security Passcode
            </label>
            <div className="rounded-lg bg-[#09090b] border border-white/5 flex px-3 py-2.5 items-center gap-2 focus-within:border-[#7f22fe]/40 transition-colors">
              <Key className="size-4 text-zinc-600" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-transparent outline-none text-sm text-white placeholder:text-zinc-600 w-full"
                placeholder="••••••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 hover:border-red-500/40 font-semibold text-sm transition-all shadow-lg shadow-red-500/5 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Activity className="size-4 animate-spin" />
                <span>Authorizing Staff...</span>
              </>
            ) : (
              <span>Decrypt & Authenticate</span>
            )}
          </button>
        </form>

        <div className="flex justify-between items-center text-xs text-zinc-600 border-t border-white/5 pt-4 mt-2">
          <span>GramFlow Staff Portal v1.0</span>
          <a href="/login" className="text-zinc-500 hover:text-zinc-300 transition-colors">
            Standard Login
          </a>
        </div>
      </div>
    </div>
  );
};
