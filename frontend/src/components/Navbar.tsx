'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export default function Navbar() {
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    const read = (s: Session | null) =>
      setName(s?.user ? (s.user.user_metadata?.full_name ?? s.user.email ?? 'Pengguna') : null);
    supabase.auth.getSession().then(({ data }) => read(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => read(s));
    return () => data.subscription.unsubscribe();
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-orange-400 text-white shadow-md shadow-orange-500/20">
            <i className="fa-solid fa-graduation-cap text-lg" />
          </span>
          <span>
            <span className="block text-lg font-bold leading-tight text-slate-900">RumahBelajar Journal</span>
            <span className="block text-xs text-slate-500">Aktivitas & Portofolio Homeschooling</span>
          </span>
        </Link>
        <div className="flex items-center gap-3">
          {name ? (
            <>
              <Link href="/add" className="btn"><i className="fa-solid fa-plus" /><span className="hidden sm:inline">Tambah Aktivitas</span></Link>
              <span className="h-8 w-px bg-slate-200" />
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-100 font-bold text-orange-700 ring-2 ring-orange-500/20">
                {name[0].toUpperCase()}
              </span>
              <span className="hidden text-left md:block">
                <span className="block text-xs font-semibold text-slate-800">{name}</span>
                <button onClick={() => supabase.auth.signOut()} className="block text-[10px] text-slate-500 underline">Keluar</button>
              </span>
            </>
          ) : (
            <Link href="/login" className="btn">Masuk</Link>
          )}
        </div>
      </div>
    </header>
  );
}
