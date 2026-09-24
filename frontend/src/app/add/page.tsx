'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { api } from '@/lib/api';

type BlockForm = { text: string; files: { file: File; caption: string }[]; video_url: string };
const emptyBlock = (): BlockForm => ({ text: '', files: [], video_url: '' });

export default function AddActivity() {
  const router = useRouter();
  const [cats, setCats] = useState<{ id: number; name: string }[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [blocks, setBlocks] = useState<BlockForm[]>([emptyBlock()]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [f, setF] = useState({
    title: '', activity_date: new Date().toISOString().slice(0, 10), category_id: '', location: '', description: '',
  });
  const set = (k: string) => (e: React.ChangeEvent<any>) => setF({ ...f, [k]: e.target.value });
  const setBlock = (i: number, patch: Partial<BlockForm>) =>
    setBlocks((bs) => bs.map((b, j) => (j === i ? { ...b, ...patch } : b)));

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.replace('/login');
      else setUserId(data.session.user.id);
    });
    api<{ id: number; name: string }[]>('/api/categories').then(setCats).catch(() => {});
  }, [router]);

  async function upload(file: File) {
    const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${file.name.replace(/[^\w.-]/g, '_')}`;
    const { error } = await supabase.storage.from('journal').upload(path, file);
    if (error) throw new Error('Foto gagal diunggah: ' + error.message);
    return supabase.storage.from('journal').getPublicUrl(path).data.publicUrl;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    setBusy(true); setMsg('');
    try {
      const out = [];
      for (const b of blocks) {
        const images: string[] = [];
        const captions: string[] = [];
        for (const { file, caption } of b.files) { images.push(await upload(file)); captions.push(caption.trim()); }
        const block = { text: b.text.trim(), images, captions, video_url: b.video_url.trim() };
        if (block.text || images.length || block.video_url) out.push(block);
      }
      await api('/api/activities', {
        method: 'POST', auth: true,
        body: {
          title: f.title, activity_date: f.activity_date,
          category_id: f.category_id ? Number(f.category_id) : null,
          location: f.location, description: f.description, blocks: out,
        },
      });
      router.push('/');
    } catch (err) {
      setMsg((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-xl space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold text-slate-900">Tulis jurnal</h1>
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
      <label className="block">Ringkasan kegiatan
        <textarea className="field mt-1" rows={3} required value={f.description} onChange={set('description')} /></label>

      <h2 className="pt-2 font-bold text-slate-900">Bagian kegiatan</h2>
      {blocks.map((b, i) => (
        <div key={i} className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
          <div className="flex items-center justify-between text-sm font-semibold">
            Bagian {i + 1}
            {blocks.length > 1 && (
              <button type="button" className="text-xs text-red-600 underline"
                onClick={() => setBlocks((bs) => bs.filter((_, j) => j !== i))}>Hapus bagian</button>
            )}
          </div>
          <textarea className="field" rows={3} placeholder="Cerita bagian ini…" value={b.text}
            onChange={(e) => setBlock(i, { text: e.target.value })} />
          <input type="file" accept="image/*" multiple className="field"
            onChange={(e) => { setBlock(i, { files: [...b.files, ...Array.from(e.target.files ?? []).map((file) => ({ file, caption: '' }))] }); e.target.value = ''; }} />
          {b.files.length > 0 && (
            <ul className="space-y-2">
              {b.files.map((it, k) => (
                <li key={k} className="flex items-center gap-2 text-xs text-slate-600">
                  <span className="w-24 shrink-0 truncate">{it.file.name}</span>
                  <input className="field !py-1.5 !text-xs" placeholder="Keterangan foto (opsional)" value={it.caption}
                    onChange={(e) => setBlock(i, { files: b.files.map((x, j) => (j === k ? { ...x, caption: e.target.value } : x)) })} />
                  <button type="button" aria-label="Hapus foto" className="px-2 text-red-600"
                    onClick={() => setBlock(i, { files: b.files.filter((_, j) => j !== k) })}>×</button>
                </li>
              ))}
            </ul>
          )}
          <input type="url" className="field" placeholder="Tautan video YouTube (opsional)" value={b.video_url}
            onChange={(e) => setBlock(i, { video_url: e.target.value })} />
        </div>
      ))}
      <button type="button" className="text-sm font-medium text-orange-600 underline"
        onClick={() => setBlocks((bs) => [...bs, emptyBlock()])}>+ Tambah bagian</button>

      {msg && <p role="alert" className="text-sm text-red-700">{msg}</p>}
      <button className="btn w-full" disabled={busy}>{busy ? 'Menyimpan… (foto sedang diunggah)' : 'Simpan jurnal'}</button>
    </form>
  );
}
