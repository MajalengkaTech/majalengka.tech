import type { MarkdownDocument } from 'comark'

// Cerita proyek dan tutorial dirender di server lewat Comark (server/utils/comark.ts); client hanya menampilkan
// dokumen hasilnya dengan komponen Prose Nuxt UI.

export interface MarkdownTocLink {
	id: string
	text: string
	depth: number
	children?: MarkdownTocLink[]
}

export type RenderedMarkdown = MarkdownDocument<{ toc?: { links: MarkdownTocLink[] } }>

// Versi teks polos untuk meta description dan hasil pencarian: sintaks Markdown dan komponen Comark dibuang.
export function storyPlainText(markdown: string | null | undefined, maxLength = 155) {
	const text = (markdown || '')
		.replace(/```[\s\S]*?(```|$)/g, ' ')
		.replace(/<[^>]*>/g, ' ')
		.replace(/^\s*:{2,}[\w-]*(\{[^}]*\})?\s*$/gm, ' ')
		.replace(/^\s*#[\w-]+\s*$/gm, ' ')
		.replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
		.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
		.replace(/\{[^}\n]*\}/g, '')
		.replace(/^\s*(#{1,6}|>|[-*+]\s+\[[ x]\]|[-*+]|\d+\.)\s+/gm, '')
		.replace(/^\s*\|?\s*:?-{3,}.*$/gm, ' ')
		.replace(/[*_~`|]/g, '')
		.replace(/\s+/g, ' ')
		.trim()
	return text.length > maxLength ? `${text.slice(0, maxLength - 1).trimEnd()}…` : text
}

// Video hanya YouTube (lewat youtube-nocookie) dan Vimeo; URL embed dibangun ulang dari ID-nya saja.
export function videoEmbedUrl(value: unknown): string | null {
	if (typeof value !== 'string') return null
	let url: URL
	try {
		url = new URL(value.trim())
	} catch {
		return null
	}
	if (url.protocol !== 'https:' && url.protocol !== 'http:') return null
	const host = url.hostname.replace(/^www\.|^m\./, '')
	let youtube: string | undefined
	if (host === 'youtu.be') youtube = url.pathname.slice(1)
	else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
		youtube = url.pathname === '/watch' ? url.searchParams.get('v') ?? undefined : url.pathname.match(/^\/(?:embed|shorts|live)\/([^/]+)/)?.[1]
	}
	if (youtube) return /^[\w-]{11}$/.test(youtube) ? `https://www.youtube-nocookie.com/embed/${youtube}` : null
	if (host === 'vimeo.com' || host === 'player.vimeo.com') {
		const id = url.pathname.match(/^\/(?:video\/)?(\d{6,12})(?:\/|$)/)?.[1]
		return id ? `https://player.vimeo.com/video/${id}` : null
	}
	return null
}
