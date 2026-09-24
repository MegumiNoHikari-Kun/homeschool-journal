'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function Login() {
  const router = useRouter();
  const [signup, setSignup] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMsg('');
    const { data, error } = signup
      ? await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } })
      : await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return setMsg(error.message);
    if (data.session) router.push('/');
    else setMsg('Akun dibuat. Buka email Anda untuk konfirmasi, lalu masuk.');
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-sm space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold text-slate-900">{signup ? 'Buat akun keluarga' : 'Masuk'}</h1>
      {signup && (
        <label className="block">Nama lengkap
          <input className="field mt-1" required value={name} onChange={(e) => setName(e.target.value)} />
        </label>
      )}
      <label className="block">Email
        <input type="email" className="field mt-1" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <label className="block">Kata sandi
        <input type="password" minLength={6} className="field mt-1" required value={password} onChange={(e) => setPassword(e.target.value)} />
      </label>
      {msg && <p role="alert" className="text-sm text-red-700">{msg}</p>}
      <button className="btn w-full" disabled={busy}>{signup ? 'Buat akun' : 'Masuk'}</button>
      <button type="button" className="text-sm underline" onClick={() => setSignup(!signup)}>
        {signup ? 'Sudah punya akun? Masuk' : 'Belum punya akun? Daftar'}
      </button>
    </form>
  );
}
