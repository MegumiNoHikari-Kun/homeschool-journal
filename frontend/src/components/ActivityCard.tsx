'use client';
import { useState } from 'react';
import { api } from '@/lib/api';
import { catOf, toEmbed } from '@/lib/categories';

export type Block = { text: string; images: string[]; video_url: string };

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

function BlockView({ b, title }: { b: Block; title: string }) {
  const embed = toEmbed(b.video_url);
  const imgs = b.images ?? [];
  return (
    <div className="space-y-3 border-t border-slate-100 pt-4">
      {b.text && <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600">{b.text}</p>}
      {imgs.length > 0 && (
        <div className={`grid gap-2 ${imgs.length > 1 ? 'grid-cols-2' : ''}`}>
          {imgs.map((u) => (
            <img key={u} src={u} alt={title} className="aspect-video w-full rounded-2xl border border-slate-100 object-cover" />
          ))}
        </div>
      )}
      {embed ? (
        <div className="aspect-video overflow-hidden rounded-2xl bg-slate-900">
          <iframe src={embed} title={title} className="h-full w-full" allowFullScreen />
        </div>
      ) : (
        b.video_url && <a href={b.video_url} target="_blank" rel="noreferrer" className="text-sm text-orange-600 underline">Tonton video</a>
      )}
    </div>
  );
}

export default function ActivityCard({
  a, isOwner, onDeleted,
}: { a: Activity; isOwner: boolean; onDeleted: (id: number) => void }) {
  const [likes, setLikes] = useState(a.likes_count);
  const [liked, setLiked] = useState(false);
  const c = catOf(a.category_name);
  const embed = toEmbed(a.video_url);
  const date = new Date(a.activity_date + 'T00:00:00').toLocaleDateString('id-ID', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

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
        <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600">{a.description}</p>
        {a.blocks?.map((b, i) => <BlockView key={i} b={b} title={a.title} />)}
        {a.image_url && (
          <div className="space-y-1.5 pt-2">
            <div className="aspect-video overflow-hidden rounded-2xl border border-slate-100 bg-slate-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={a.image_url} alt={a.image_caption ?? a.title} className="h-full w-full object-cover" />
            </div>
            {a.image_caption && (
              <p className="text-xs italic text-slate-500"><i className="fa-solid fa-camera mr-1 text-slate-400" />{a.image_caption}</p>
            )}
          </div>
        )}
        {embed && (
          <div className="aspect-video overflow-hidden rounded-2xl border border-slate-100 bg-slate-900">
            <iframe src={embed} title={a.title} className="h-full w-full" allowFullScreen />
          </div>
        )}
        {a.video_url && !embed && (
          <a href={a.video_url} target="_blank" rel="noreferrer" className="text-sm text-orange-600 underline">Tonton video</a>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-6 py-4 text-xs text-slate-500">
        <button onClick={like} disabled={liked} className="flex items-center gap-1.5 font-medium transition-colors hover:text-orange-600">
          <i className="fa-solid fa-heart text-red-500" /><span>{likes} Suka</span>
        </button>
        <span>oleh {a.author_name ?? 'Keluarga'}</span>
      </div>
    </article>
  );
}
