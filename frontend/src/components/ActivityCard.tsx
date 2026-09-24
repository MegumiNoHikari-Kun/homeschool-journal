'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { catOf, toEmbed } from '@/lib/categories';

export type Block = { text: string; images: string[]; captions?: string[]; video_url: string };

export type Activity = {
  id: number;
  user_id: string;
  title: string;
  activity_date: string;
  location: string;
  description: string;
  image_url: string | null;
  image_caption: string | null;
  video_url: string | null;
  likes_count: number;
  category_name: string | null;
  category_color: string | null;
  author_name: string | null;
  blocks: Block[];
};

type Photo = { url: string; caption: string };

function PhotoView({ p, title, onOpen, tall }: { p: Photo; title: string; onOpen: (p: Photo) => void; tall?: boolean }) {
  return (
    <figure className="space-y-1">
      <button type="button" onClick={() => onOpen(p)} aria-label="Perbesar foto"
        className="block w-full overflow-hidden rounded-2xl border border-slate-100 bg-slate-100">
        <img src={p.url} alt={p.caption || title} loading="lazy"
          className={`mx-auto w-full object-contain ${tall ? 'max-h-96' : 'max-h-64'}`} />
      </button>
      {p.caption && (
        <figcaption className="text-xs italic text-slate-500">
          <i className="fa-solid fa-camera mr-1 text-slate-400" />{p.caption}
        </figcaption>
      )}
    </figure>
  );
}

function Video({ url, title }: { url: string; title: string }) {
  const embed = toEmbed(url);
  return embed ? (
    <div className="aspect-video overflow-hidden rounded-2xl bg-slate-900">
      <iframe src={embed} title={title} className="h-full w-full" allowFullScreen />
    </div>
  ) : (
    <a href={url} target="_blank" rel="noreferrer" className="text-sm text-orange-600 underline">Tonton video</a>
  );
}

function BlockView({ b, title, onOpen }: { b: Block; title: string; onOpen: (p: Photo) => void }) {
  const imgs = b.images ?? [];
  return (
    <div className="space-y-3 border-t border-slate-100 pt-4">
      {b.text && <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600">{b.text}</p>}
      {imgs.length > 0 && (
        <div className={`grid gap-3 ${imgs.length > 1 ? 'sm:grid-cols-2' : ''}`}>
          {imgs.map((u, i) => (
            <PhotoView key={u} p={{ url: u, caption: b.captions?.[i] ?? '' }} title={title}
              onOpen={onOpen} tall={imgs.length === 1} />
          ))}
        </div>
      )}
      {b.video_url && <Video url={b.video_url} title={title} />}
    </div>
  );
}

export default function ActivityCard({
  a, isOwner, onDeleted,
}: { a: Activity; isOwner: boolean; onDeleted: (id: number) => void }) {
  const [likes, setLikes] = useState(a.likes_count);
  const [liked, setLiked] = useState(false);
  const [open, setOpen] = useState(false);
  const [box, setBox] = useState<Photo | null>(null);
  const c = catOf(a.category_name);
  const date = new Date(a.activity_date + 'T00:00:00').toLocaleDateString('id-ID', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  const legacy: Photo | null = a.image_url ? { url: a.image_url, caption: a.image_caption ?? '' } : null;
  const all: Photo[] = [
    ...(legacy ? [legacy] : []),
    ...(a.blocks ?? []).flatMap((b) => (b.images ?? []).map((u, i) => ({ url: u, caption: b.captions?.[i] ?? '' }))),
  ];
  const cover = all[0];
  const hasMore = (a.blocks?.length ?? 0) > 0 || all.length > 1 || a.description.length > 200 || !!a.video_url;

  useEffect(() => {
    if (!box) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setBox(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [box]);

  async function like() {
    if (liked) return;
    setLiked(true);
    setLikes((n) => n + 1);
    try {
      await api(`/api/activities/${a.id}/like`, { method: 'POST' });
    } catch {
      setLiked(false);
      setLikes((n) => n - 1);
    }
  }

  async function remove() {
    if (!confirm('Yakin ingin menghapus jurnal ini?')) return;
    try {
      await api(`/api/activities/${a.id}`, { method: 'DELETE', auth: true });
      onDeleted(a.id);
    } catch (e) {
      alert((e as Error).message);
    }
  }

  return (
    <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center justify-between border-b border-slate-100 p-6 pb-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
            <i className={`fa-solid ${c.icon}`} />
          </span>
          <div>
            <span className="mb-1 inline-block rounded-full bg-orange-100 px-2.5 py-0.5 text-[10px] font-bold text-orange-700">
              {a.category_name ?? 'Umum'}
            </span>
            <div className="flex flex-wrap items-center gap-x-3 text-xs text-slate-500">
              <span><i className="fa-regular fa-calendar mr-1" />{date}</span>
              <span><i className="fa-solid fa-location-dot mr-1 text-red-400" />{a.location}</span>
            </div>
          </div>
        </div>
        {isOwner && (
          <button onClick={remove} title="Hapus" aria-label="Hapus jurnal"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500">
            <i className="fa-solid fa-trash-can text-xs" />
          </button>
        )}
      </div>

      <div className="space-y-4 p-6">
        <h2 className="text-lg font-bold leading-snug text-slate-900 sm:text-xl">{a.title}</h2>
        <p className={`whitespace-pre-line text-sm leading-relaxed text-slate-600 ${open ? '' : 'line-clamp-3'}`}>
          {a.description}
        </p>

        {!open && cover && (
          <div className="relative">
            <PhotoView p={cover} title={a.title} onOpen={setBox} tall />
            {all.length > 1 && (
              <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-slate-900/70 px-2.5 py-1 text-xs font-medium text-white">
                +{all.length - 1} foto
              </span>
            )}
          </div>
        )}

        {open && (
          <>
            {legacy && <PhotoView p={legacy} title={a.title} onOpen={setBox} tall />}
            {a.blocks?.map((b, i) => <BlockView key={i} b={b} title={a.title} onOpen={setBox} />)}
            {a.video_url && <Video url={a.video_url} title={a.title} />}
          </>
        )}

        {hasMore && (
          <button onClick={() => setOpen(!open)} aria-expanded={open}
            className="text-sm font-semibold text-orange-600 hover:underline">
            {open ? 'Tampilkan lebih sedikit' : 'Lihat selengkapnya'}
            <i className={`fa-solid ${open ? 'fa-chevron-up' : 'fa-chevron-down'} ml-1.5 text-xs`} />
          </button>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-6 py-4 text-xs text-slate-500">
        <button onClick={like} disabled={liked} className="flex items-center gap-1.5 font-medium transition-colors hover:text-orange-600">
          <i className="fa-solid fa-heart text-red-500" /><span>{likes} Suka</span>
        </button>
        <span>oleh {a.author_name ?? 'Keluarga'}</span>
      </div>

      {box && (
        <div role="dialog" aria-modal="true" onClick={() => setBox(null)}
          className="fixed inset-0 z-50 flex cursor-zoom-out flex-col items-center justify-center bg-slate-900/90 p-4">
          <img src={box.url} alt={box.caption || a.title} className="max-h-[85vh] max-w-full object-contain" />
          {box.caption && <p className="mt-3 max-w-2xl text-center text-sm text-white">{box.caption}</p>}
          <button aria-label="Tutup" className="absolute right-4 top-4 text-3xl leading-none text-white">×</button>
        </div>
      )}
    </article>
  );
}
