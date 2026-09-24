'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { api } from '@/lib/api';

export default function AddActivity() {
  const router = useRouter();
  const [cats, setCats] = useState<{ id: number; name: string }[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [f, setF] = useState({
    title: '', activity_date: new Date().toISOString().slice(0, 10), category_id: '',
    location: '', description: '', image_caption: '', video_url: '',
  });
  const set = (k: string) => (e: React.ChangeEvent<any>) => setF({ ...f, [k]: e.target.value });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.replace('/login');
      else setUserId(data.session.user.id);
    });
    api<{ id: number; name: string }[]>('/api/categories').then(setCats).catch(() => {});
  }, [router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    setBusy(true); setMsg('');
    let image_url: string | null = null;
    if (file) {
      const path = `${userId}/${Date.now()}-${file.name.replace(/[^\w.-]/g, '_')}`;
      const { error } = await supabase.storage.from('journal').upload(path, file);
      if (error) { setBusy(false); return setMsg('Foto gagal diunggah: ' + error.message); }
      image_url = supabase.storage.from('journal').getPublicUrl(path).data.publicUrl;
    }
    try {
      await api('/api/activities', {
        method: 'POST', auth: true,
        body: {
          title: f.title, activity_date: f.activity_date,
          category_id: f.category_id ? Number(f.category_id) : null,
          location: f.location, description: f.description,
          image_url, image_caption: f.image_caption || null, video_url: f.video_url || null,
        },
      });
      router.push('/');
    } catch (err) {
      setMsg('Jurnal gagal disimpan: ' + (err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="max-w-xl space-y-4">
      <h1 className="font-display text-3xl font-bold">Tulis jurnal</h1>
      <label className="block">Judul kegiatan
        <input className="field mt-1" required value={f.title} onChange={set('title')} /></label>
      <div className="grid grid-cols-2 gap-4">
        <label className="block">Tanggal
          <input type="date" className="field mt-1" required value={f.activity_date} onChange={set('activity_date')} /></label>
        <label className="block">Kategori
          <select className="field mt-1" value={f.category_id} onChange={set('category_id')}>
            <option value="">Pilih kategori</option>
            {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select></label>
      </div>
      <label className="block">Lokasi
        <input className="field mt-1" required value={f.location} onChange={set('location')} /></label>
      <label className="block">Cerita kegiatan
        <textarea className="field mt-1" rows={6} required value={f.description} onChange={set('description')} /></label>
      <label className="block">Foto
        <input type="file" accept="image/*" className="field mt-1" onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></label>
      <label className="block">Keterangan foto
        <input className="field mt-1" value={f.image_caption} onChange={set('image_caption')} /></label>
      <label className="block">Tautan video (opsional)
        <input type="url" className="field mt-1" value={f.video_url} onChange={set('video_url')} /></label>
      {msg && <p role="alert" className="text-sm text-red-700">{msg}</p>}
      <button className="btn" disabled={busy}>{busy ? 'Menyimpan…' : 'Simpan jurnal'}</button>
    </form>
  );
}
