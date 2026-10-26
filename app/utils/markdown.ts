import { Marked } from 'marked'

// Cerita proyek ditulis pengguna, jadi markdown dirender dengan aturan ketat:
// HTML mentah selalu jadi teks biasa, link hanya http(s)/mailto, dan gambar tampil sebagai link.
// Cerita lama berupa teks polos dengan baris kosong tetap terbaca sebagai paragraf.

const ALLOWED_PROTOCOLS = ['http:', 'https:', 'mailto:']

function escapeHtml(text: string) {
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;')
}

function safeUrl(href: string) {
	try {
		const url = new URL(href, 'https://majalengka.tech')
		return ALLOWED_PROTOCOLS.includes(url.protocol) ? url.href : null
	} catch {
		return null
	}
}

function externalLink(href: string, label: string) {
	return `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer nofollow ugc">${label}</a>`
}

const storyMarked = new Marked({
	gfm: true,
	// Baris baru tunggal tetap jadi baris baru, sama seperti tampilan cerita sebelum ada editor.
	breaks: true,
	renderer: {
		html({ text, block }) {
			return block ? `<p>${escapeHtml(text)}</p>` : escapeHtml(text)
		},
		// Judul halaman sudah h1 dan bagian cerita h2, jadi judul di dalam cerita mulai dari h3.
		heading({ tokens, depth }) {
			const level = depth <= 2 ? 3 : 4
			return `<h${level}>${this.parser.parseInline(tokens)}</h${level}>`
		},
		link({ href, tokens }) {
			const label = this.parser.parseInline(tokens)
			const url = safeUrl(href)
			return url ? externalLink(url, label) : label
		},
		image({ href, text }) {
			const url = safeUrl(href)
			return url ? externalLink(url, escapeHtml(text || url)) : escapeHtml(text)
		}
	}
})

export function renderStory(markdown: string | null | undefined) {
	if (!markdown) return ''
	return storyMarked.parse(markdown, { async: false })
}

// Versi teks polos untuk meta description dan hasil pencarian.
export function storyPlainText(markdown: string | null | undefined, maxLength = 155) {
	const text = renderStory(markdown)
		.replace(/<[^>]+>/g, ' ')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, '\'')
		.replace(/&amp;/g, '&')
		.replace(/\s+/g, ' ')
		.trim()
	return text.length > maxLength ? `${text.slice(0, maxLength - 1).trimEnd()}…` : text
}

export interface TutorialHeading {
	id: string
	text: string
	depth: 2 | 3
}

function headingId(text: string, used: Map<string, number>) {
	const base = text.toLowerCase().replace(/<[^>]+>/g, '').replace(/&[a-z#0-9]+;/g, '').replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-') || 'bagian'
	const count = used.get(base) ?? 0
	used.set(base, count + 1)
	return count ? `${base}-${count}` : base
}

// Tutorial memakai aturan aman yang sama dengan cerita proyek, ditambah id pada judul bagian (untuk daftar isi)
// dan gambar https yang dimuat lambat tanpa referrer, karena tutorial butuh tangkapan layar.
export function renderTutorial(markdown: string | null | undefined) {
	const headings: TutorialHeading[] = []
	const used = new Map<string, number>()
	const marked = new Marked({
		gfm: true,
		renderer: {
			html({ text, block }) {
				return block ? `<p>${escapeHtml(text)}</p>` : escapeHtml(text)
			},
			heading({ tokens, depth }) {
				const inner = this.parser.parseInline(tokens)
				const level = depth <= 2 ? 2 : 3
				const id = headingId(inner, used)
				headings.push({ id, text: inner.replace(/<[^>]+>/g, ''), depth: level })
				return `<h${level} id="${id}">${inner}</h${level}>`
			},
			link({ href, tokens }) {
				const label = this.parser.parseInline(tokens)
				const url = safeUrl(href)
				return url ? externalLink(url, label) : label
			},
			image({ href, text }) {
				const url = safeUrl(href)
				if (!url || !url.startsWith('https:')) return escapeHtml(text)
				return `<img src="${escapeHtml(url)}" alt="${escapeHtml(text || '')}" loading="lazy" decoding="async" referrerpolicy="no-referrer">`
			}
		}
	})
	const html = markdown ? marked.parse(markdown, { async: false }) : ''
	return { html, headings }
}
