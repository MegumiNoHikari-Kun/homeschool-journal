'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function Navbar() {
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSignedIn(!!s));
    return () => data.subscription.unsubscribe();
  }, []);

  return (
    <header className="border-b border-line bg-white">
      <nav className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-display text-xl font-bold text-leaf">Jurnal Belajar Rumah</Link>
        <div className="flex items-center gap-4 text-sm">
          {signedIn ? (
            <>
              <Link href="/add" className="btn">Tulis jurnal</Link>
              <button onClick={() => supabase.auth.signOut()} className="underline">Keluar</button>
            </>
          ) : (
            <Link href="/login" className="underline">Masuk</Link>
          )}
        </div>
      </nav>
    </header>
  );
}
