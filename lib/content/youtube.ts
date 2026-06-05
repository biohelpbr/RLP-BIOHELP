/**
 * Academy UX 05/06 — helpers de YouTube derivados do content_url
 * (sem campo novo no banco): id → embed e thumbnail.
 * Aceita youtu.be/<id> e youtube.com/watch?v=<id>.
 */
export function youtubeId(url: string | null): string | null {
  if (!url) return null
  try {
    const u = new URL(url)
    if (u.hostname.includes("youtu.be")) {
      const id = u.pathname.replace(/^\//, "").split("/")[0]
      return id || null
    }
    if (u.hostname.includes("youtube.com")) {
      return u.searchParams.get("v")
    }
    return null
  } catch {
    return null
  }
}

export function youtubeEmbedUrl(url: string | null): string | null {
  const id = youtubeId(url)
  return id ? `https://www.youtube.com/embed/${id}` : null
}

export function youtubeThumbUrl(url: string | null): string | null {
  const id = youtubeId(url)
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null
}
