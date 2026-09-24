'use client';
import { useState } from 'react';
import { api } from '@/lib/api';

export type Activity = {
  id: number;
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
};

const dot: Record<string, string> = {
  emerald: 'bg-emerald-600', blue: 'bg-blue-600', purple: 'bg-purple-600', amber: 'bg-amber-500',
};

export default function ActivityCard({ a }: { a: Activity }) {
  const [likes, setLikes] = useState(a.likes_count);
  const [liked, setLiked] = useState(false);
  const d = new Date(a.activity_date + 'T00:00:00');

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

  return (
    <article className="grid gap-4 border-t border-line py-8 md:grid-cols-[6rem_1fr]">
      <time dateTime={a.activity_date} className="font-display leading-none">
        <span className="block text-5xl font-bold">{d.getDate()}</span>
        <span className="mt-1 block text-sm text-ink/70">
          {d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
        </span>
      </time>
      <div>
        <p className="flex items-center gap-2 text-sm text-ink/70">
          <span className={`h-2.5 w-2.5 rounded-full ${dot[a.category_color ?? ''] ?? 'bg-ink'}`} />
          {a.category_name ?? 'Umum'} · {a.location}
        </p>
        <h2 className="mt-1 font-display text-2xl font-semibold">{a.title}</h2>
        <p className="mt-2 max-w-prose whitespace-pre-line leading-relaxed">{a.description}</p>
        {a.image_url && (
          <figure className="mt-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={a.image_url} alt={a.image_caption ?? a.title} className="max-h-96 w-full rounded-md object-cover" />
            {a.image_caption && <figcaption className="mt-1 text-sm text-ink/70">{a.image_caption}</figcaption>}
          </figure>
        )}
        <div className="mt-4 flex items-center gap-4 text-sm">
          <button onClick={like} disabled={liked} aria-label="Suka jurnal ini"
            className="rounded-full border border-line bg-white px-3 py-1 hover:border-sun disabled:bg-sun/20">
            ♥ {likes}
          </button>
          {a.video_url && <a href={a.video_url} target="_blank" rel="noreferrer" className="underline">Tonton video</a>}
          <span className="text-ink/60">oleh {a.author_name ?? 'Keluarga'}</span>
        </div>
      </div>
    </article>
  );
}
