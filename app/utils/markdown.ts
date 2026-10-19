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
