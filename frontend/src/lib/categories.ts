const CAT: Record<string, { icon: string; text: string }> = {
  'Sains & Alam': { icon: 'fa-flask', text: 'text-emerald-500' },
  Matematika: { icon: 'fa-calculator', text: 'text-blue-500' },
  'Seni & Kriya': { icon: 'fa-palette', text: 'text-purple-500' },
  'Sosial & Budaya': { icon: 'fa-globe', text: 'text-amber-500' },
};

export const catOf = (name?: string | null) =>
  CAT[name ?? ''] ?? { icon: 'fa-book-open', text: 'text-slate-500' };

export function toEmbed(url: string | null) {
  const m = url?.match(/(?:youtu\.be\/|v=|embed\/)([\w-]{11})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}
