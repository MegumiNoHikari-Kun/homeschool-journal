'use client';
import { useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { api } from '@/lib/api';
import { catOf } from '@/lib/categories';
import ActivityCard, { Activity } from '@/components/ActivityCard';

type Category = { id: number; name: string };
const TARGET = 20;

export default function Home() {
  const [items, setItems] = useState<Activity[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [cat, setCat] = useState('all');
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    api<Category[]>('/api/categories').then(setCats).catch(() => {});
    api<Activity[]>('/api/activities?category=0')
      .then(setItems)
      .catch(() => setError('Jurnal gagal dimuat. Pastikan server API berjalan, lalu muat ulang halaman.'))
      .finally(() => setLoading(false));
    const read = (s: Session | null) =>
      setUser(s?.user ? { id: s.user.id, name: s.user.user_metadata?.full_name ?? s.user.email ?? 'Keluarga' } : null);
    supabase.auth.getSession().then(({ data }) => read(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => read(s));
    return () => data.subscription.unsubscribe();
  }, []);

  const shown = useMemo(() => {
    const term = q.toLowerCase();
    return items
      .filter((i) => (cat === 'all' || i.category_name === cat) &&
        [i.title, i.location, i.description].some((t) => t.toLowerCase().includes(term)))
      .sort((a, b) => sort === 'newest'
        ? b.activity_date.localeCompare(a.activity_date)
        : a.activity_date.localeCompare(b.activity_date));
  }, [items, cat, q, sort]);

  const month = new Date().toISOString().slice(0, 7);
  const monthCount = items.filter((i) => i.activity_date.startsWith(month)).length;
  const btn = (active: boolean) =>
    `flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs transition-colors ${
      active ? 'bg-orange-50 font-semibold text-orange-700' : 'font-medium text-slate-600 hover:bg-slate-50'}`;

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
      <aside className="space-y-6 lg:col-span-1">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm">
          <span className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-400 text-3xl font-bold text-white shadow-md ring-4 ring-orange-50">
            {user ? user.name[0].toUpperCase() : <i className="fa-solid fa-house-chimney text-2xl" />}
          </span>
          <h2 className="text-base font-bold text-slate-900">{user ? user.name : 'Keluarga Homeschooling'}</h2>
          <p className="mb-3 text-xs text-slate-500">{user ? 'Selamat datang kembali' : 'Masuk untuk menulis jurnal'}</p>
          <div className="space-y-1 rounded-xl border border-orange-100 bg-orange-50 p-3 text-left">
            <div className="flex justify-between text-xs font-medium text-orange-800">
              <span>Jurnal bulan ini</span>
              <span className="font-bold">{monthCount} / {TARGET}</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-orange-200">
              <div className="h-full rounded-full bg-orange-500" style={{ width: `${Math.min(100, (monthCount / TARGET) * 100)}%` }} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-900">Kategori Pembelajaran</h3>
          <div className="space-y-1">
            <button onClick={() => setCat('all')} aria-pressed={cat === 'all'} className={btn(cat === 'all')}>
              <span className="flex items-center gap-2"><i className="fa-solid fa-border-all w-5 text-center" />Semua Aktivitas</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px]">{items.length}</span>
            </button>
            {cats.map((c) => (
              <button key={c.id} onClick={() => setCat(c.name)} aria-pressed={cat === c.name} className={btn(cat === c.name)}>
                <span className="flex items-center gap-2">
                  <i className={`fa-solid ${catOf(c.name).icon} w-5 text-center ${catOf(c.name).text}`} />{c.name}
                </span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px]">
                  {items.filter((i) => i.category_name === c.name).length}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 p-5 text-white shadow-sm">
          <div className="flex items-start gap-3">
            <span className="rounded-xl bg-white/10 p-2.5"><i className="fa-solid fa-lightbulb text-lg text-amber-300" /></span>
            <div>
              <h4 className="mb-1 text-sm font-bold">Tips Homeschooling</h4>
              <p className="text-xs leading-relaxed text-indigo-100">Catat proses eksplorasi anak, bukan hanya hasil akhirnya. Foto dan video membantu evaluasi perkembangan minat.</p>
            </div>
          </div>
        </div>
      </aside>

      <section className="space-y-6 lg:col-span-3">
        <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row">
          <div className="relative w-full sm:w-80">
            <i className="fa-solid fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} aria-label="Cari jurnal"
              placeholder="Cari topik aktivitas, lokasi..." className="field pl-10" />
          </div>
          <label className="flex w-full items-center justify-end gap-2 text-xs text-slate-500 sm:w-auto">
            Urutkan:
            <select value={sort} onChange={(e) => setSort(e.target.value as 'newest' | 'oldest')}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700">
              <option value="newest">Terbaru</option>
              <option value="oldest">Terlama</option>
            </select>
          </label>
        </div>

        {error && <p role="alert" className="text-red-700">{error}</p>}
        {loading && <p className="text-slate-500">Memuat jurnal…</p>}
        {!loading && !error && shown.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
            <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-50 text-2xl text-orange-500">
              <i className="fa-solid fa-folder-open" />
            </span>
            <h4 className="mb-1 text-base font-bold text-slate-800">Tidak ada aktivitas ditemukan</h4>
            <p className="text-xs text-slate-500">Coba kata kunci lain, pilih kategori berbeda, atau tulis jurnal pertama Anda.</p>
          </div>
        )}
        {shown.map((a) => (
          <ActivityCard key={a.id} a={a} isOwner={user?.id === a.user_id}
            onDeleted={(id) => setItems((xs) => xs.filter((x) => x.id !== id))} />
        ))}
      </section>
    </div>
  );
}
