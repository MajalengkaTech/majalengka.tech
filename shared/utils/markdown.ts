import { Marked } from 'marked'
import type { MarkedExtension, Tokens } from 'marked'

// Cerita proyek dan tutorial ditulis pengguna, jadi Markdown dirender dengan aturan ketat:
// HTML mentah selalu jadi teks biasa, link hanya http(s)/mailto, dan gambar hanya dari Cloudinary majalengka.tech.
// Dipakai server (yang menambahkan warna kode lewat Shiki) dan browser (pratinjau tanpa warna).

const ALLOWED_PROTOCOLS = ['http:', 'https:', 'mailto:']

export function escapeHtml(text: string) {
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

// Hanya gambar unggahan di Cloudinary majalengka.tech yang tampil sebagai gambar; alamat lain jadi tautan biasa,
// supaya tidak ada gambar pelacak dari situs luar.
const IMAGE_ORIGIN = 'https://res.cloudinary.com/daton7ry4/'

function imageHtml(href: string, text: string) {
	const url = safeUrl(href)
	if (!url) return escapeHtml(text)
	if (!url.startsWith(IMAGE_ORIGIN)) return externalLink(url, escapeHtml(text || url))
	return `<img src="${escapeHtml(url)}" alt="${escapeHtml(text || '')}" loading="lazy" decoding="async" referrerpolicy="no-referrer">`
}

// Tabel dibungkus supaya tabel lebar bisa digeser di dalam wadahnya tanpa melebarkan halaman. Aman: HTML mentah
// dari penulis sudah di-escape, jadi <table> di sini pasti hasil Markdown.
function wrapTables(html: string) {
	return html.replace(/<table>/g, '<div class="table-wrap"><table>').replace(/<\/table>/g, '</table></div>')
}

// Info blok kode mengikuti Nuxt Content: ```ts [nuxt.config.ts]
export function parseCodeInfo(info: string | null | undefined) {
	const match = (info || '').trim().match(/^([\w+#.-]*)\s*(?:\[([^\]]+)\])?/)
	return { language: match?.[1] || '', filename: match?.[2]?.trim() || '' }
}

function codePre(text: string, language: string) {
	const lang = escapeHtml(language || 'text')
	return `<pre><code class="language-${lang}" data-lang="${lang}">${escapeHtml(text)}</code></pre>`
}

function codeBlockHtml(text: string, info: string | undefined) {
	const { language, filename } = parseCodeInfo(info)
	const header = filename
		? `<div class="code-filename"><span>${escapeHtml(filename)}</span>${language ? `<span class="code-lang">${escapeHtml(language)}</span>` : ''}</div>`
		: ''
	return `<div class="code-block${filename ? ' has-filename' : ''}">${header}${codePre(text, language)}</div>`
}

// :::code-group berisi beberapa blok kode yang tampil sebagai tab. Tab dibuat dengan radio + CSS :has(),
// jadi tetap jalan di dalam v-html tanpa JavaScript.
function codeGroupExtension(nextId: () => number): MarkedExtension {
	return {
		extensions: [{
			name: 'codeGroup',
			level: 'block',
			start(src: string) {
				return src.match(/^:::code-group/m)?.index
			},
			tokenizer(src: string) {
				const match = /^:::code-group[^\n]*\n([\s\S]*?)\n:::[ \t]*(?:\n|$)/.exec(src)
				if (!match) return undefined
				return { type: 'codeGroup', raw: match[0], tokens: this.lexer.blockTokens(match[1] ?? '', []) }
			},
			renderer(token) {
				const codes = (token.tokens ?? []).filter((item): item is Tokens.Code => item.type === 'code')
				if (!codes.length) return ''
				const id = `cg-${nextId()}`
				const tabs = codes.map((code, index) => {
					const { language, filename } = parseCodeInfo(code.lang)
					const label = escapeHtml(filename || language || `Tab ${index + 1}`)
					return `<input type="radio" name="${id}" id="${id}-${index}"${index === 0 ? ' checked' : ''}><label for="${id}-${index}">${label}</label>`
				}).join('')
				const panels = codes.map(code => `<div class="code-group-panel">${codePre(code.text, parseCodeInfo(code.lang).language)}</div>`).join('')
				return `<div class="code-group"><div class="code-group-tabs">${tabs}</div><div class="code-group-panels">${panels}</div></div>`
			}
		}]
	}
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

let groupCounter = 0

// mode 'cerita': judul halaman h1 dan bagian cerita h2, jadi judul di dalam cerita mulai dari h3.
// mode 'tutorial': judul bagian h2/h3 diberi id untuk daftar isi.
function renderMarkdown(markdown: string | null | undefined, mode: 'cerita' | 'tutorial') {
	const headings: TutorialHeading[] = []
	const used = new Map<string, number>()
	const marked = new Marked(codeGroupExtension(() => ++groupCounter), {
		gfm: true,
		// Cerita lama berupa teks polos: baris baru tunggal tetap jadi baris baru.
		breaks: mode === 'cerita',
		renderer: {
			html({ text, block }) {
				return block ? `<p>${escapeHtml(text)}</p>` : escapeHtml(text)
			},
			heading({ tokens, depth }) {
				const inner = this.parser.parseInline(tokens)
				if (mode === 'cerita') {
					const level = depth <= 2 ? 3 : 4
					return `<h${level}>${inner}</h${level}>`
				}
				const level = depth <= 2 ? 2 : 3
				const id = headingId(inner, used)
				headings.push({ id, text: inner.replace(/<[^>]+>/g, ''), depth: level })
				return `<h${level} id="${id}">${inner}</h${level}>`
			},
			code({ text, lang }) {
				return codeBlockHtml(text, lang)
			},
			link({ href, tokens }) {
				const label = this.parser.parseInline(tokens)
				const url = safeUrl(href)
				return url ? externalLink(url, label) : label
			},
			image({ href, text }) {
				return imageHtml(href, text)
			}
		}
	})
	const html = wrapTables(markdown ? marked.parse(markdown, { async: false }) : '')
	return { html, headings }
}

export function renderStory(markdown: string | null | undefined) {
	return renderMarkdown(markdown, 'cerita').html
}

export function renderTutorial(markdown: string | null | undefined) {
	return renderMarkdown(markdown, 'tutorial')
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
