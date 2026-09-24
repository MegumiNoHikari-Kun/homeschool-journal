'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import ActivityCard, { Activity } from '@/components/ActivityCard';

type Category = { id: number; name: string };

export default function Home() {
  const [items, setItems] = useState<Activity[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [cat, setCat] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api<Category[]>('/api/categories').then(setCats).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    setError('');
    api<Activity[]>(`/api/activities?category=${cat ?? 0}`)
      .then(setItems)
      .catch(() => setError('Jurnal gagal dimuat. Pastikan server API berjalan, lalu muat ulang halaman.'))
      .finally(() => setLoading(false));
  }, [cat]);

  return (
    <>
      <h1 className="font-display text-4xl font-bold">Catatan belajar hari ini</h1>
      <div className="mt-6 flex flex-wrap gap-2">
        {[{ id: null, name: 'Semua' }, ...cats].map((c) => (
          <button key={c.name} onClick={() => setCat(c.id)} aria-pressed={cat === c.id}
            className={`rounded-full border px-4 py-1 text-sm ${cat === c.id ? 'border-leaf bg-leaf text-white' : 'border-line bg-white'}`}>
            {c.name}
          </button>
        ))}
      </div>
      <div className="mt-8">
        {error && <p role="alert" className="text-red-700">{error}</p>}
        {loading && <p>Memuat jurnal…</p>}
        {!loading && !error && items.length === 0 && (
          <p>Belum ada jurnal di kategori ini. Masuk lalu pilih “Tulis jurnal” untuk membuat yang pertama.</p>
        )}
        {items.map((a) => <ActivityCard key={a.id} a={a} />)}
      </div>
    </>
  );
}
