import { createHash } from 'node:crypto'
import { parseMarkdown } from 'comark'
import type { ComarkPlugin, ElementNode, Node } from 'comark'
import breaks from 'comark/plugins/breaks'
import rangi from 'comark/plugins/rangi'
import toc from 'comark/plugins/toc'
import type { RenderedMarkdown } from '../../shared/utils/markdown'

// Cerita proyek dan tutorial ditulis pengguna, lalu dirender @comark/vue yang otomatis memakai komponen Prose
// Nuxt UI (termasuk ProseScript). Karena itu tag dan prop disaring dengan allowlist ketat di sini; plugin
// security bawaan Comark tidak cukup karena meloloskan style, class, dan prop `to`.

type Props = Record<string, unknown>
type Mode = 'cerita' | 'tutorial'

const COLORS = ['primary', 'secondary', 'success', 'info', 'warning', 'error', 'neutral']
const CALLOUT_PROPS = ['icon', 'color', 'to', 'target']
const COLLAPSE_PROPS = ['icon', 'name', 'openText', 'closeText']

const HTML_ALLOWED = ['p', 'br', 'hr', 'span', 'strong', 'em', 'b', 'i', 'u', 's', 'del', 'mark', 'small', 'sub', 'sup', 'kbd', 'blockquote', 'code', 'ul', 'ol', 'li', 'a', 'img', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'pre', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'input', 'iframe', 'template']

// Prop ditulis camelCase; `open-text` dari Markdown diubah ke `openText` sebelum dicocokkan.
const ALLOWED: Record<string, string[]> = {
	'p': [], 'br': [], 'hr': [], 'span': [], 'strong': [], 'em': [], 'b': [], 'i': [], 'u': [], 's': [], 'del': [],
	'mark': [], 'small': [], 'sub': [], 'sup': [], 'kbd': [], 'blockquote': [], 'code': [],
	'ul': [], 'ol': ['start'], 'li': [],
	'a': ['href', 'title'],
	'img': ['src', 'alt', 'title', 'width', 'height'],
	'h1': ['id'], 'h2': ['id'], 'h3': ['id'], 'h4': ['id'], 'h5': ['id'], 'h6': ['id'],
	'pre': ['language', 'filename', 'highlights', 'meta'],
	'table': [], 'thead': [], 'tbody': [], 'tr': [], 'th': ['style'], 'td': ['style'],
	'input': [], 'iframe': [], 'template': ['name'],
	'callout': CALLOUT_PROPS, 'note': CALLOUT_PROPS, 'tip': CALLOUT_PROPS, 'warning': CALLOUT_PROPS, 'caution': CALLOUT_PROPS,
	'card': [...CALLOUT_PROPS, 'title', 'description'],
	'card-group': [],
	'code-group': ['defaultValue'],
	'code-collapse': COLLAPSE_PROPS,
	'code-tree': ['defaultValue', 'expandAll'],
	'collapsible': COLLAPSE_PROPS,
	'steps': ['level'],
	'tabs': ['defaultValue'],
	'tabs-item': ['label', 'icon', 'description'],
	'accordion': ['type'],
	'accordion-item': ['label', 'icon', 'description'],
	'field-group': [],
	'field': ['name', 'type', 'description', 'required'],
	'badge': [],
	'icon': ['name']
}

const COMPONENTS = new Set(Object.keys(ALLOWED).filter(tag => !HTML_ALLOWED.includes(tag)))

// Tag HTML yang tidak diizinkan cukup dibuka (isinya dipertahankan); nama lain dianggap komponen tak dikenal.
const HTML_TAGS = new Set([...HTML_ALLOWED, 'div', 'section', 'article', 'aside', 'header', 'footer', 'main', 'nav', 'center', 'font', 'abbr', 'cite', 'q', 'dl', 'dt', 'dd', 'figure', 'figcaption', 'details', 'summary', 'caption', 'colgroup', 'col', 'tfoot', 'label', 'ins', 'samp', 'var', 'time', 'address', 'picture', 'source', 'big', 'tt', 'strike'])

// Tag yang isinya ikut dibuang, bukan sekadar dibuka.
const DROPPED = new Set(['script', 'style', 'object', 'embed', 'frame', 'frameset', 'template', 'textarea', 'title', 'noscript', 'svg', 'math', 'form', 'button', 'select', 'link', 'meta', 'base', 'head', 'video', 'audio', 'canvas'])

const IMAGE_ORIGIN = 'https://res.cloudinary.com/daton7ry4/'

function camel(name: string) {
	return name.replace(/-([a-z])/g, (_, char: string) => char.toUpperCase())
}

// Link boleh http(s), mailto, path internal, atau anchor. Mengembalikan null bila tidak aman.
export function safeHref(value: unknown): string | null {
	if (typeof value !== 'string') return null
	const raw = value.trim()
	if (raw.startsWith('#')) return /^#[\w-]+$/.test(raw) ? raw : null
	if (raw.startsWith('/') && !raw.startsWith('//') && !raw.startsWith('/\\')) {
		try {
			const url = new URL(raw, 'https://majalengka.tech')
			return url.origin === 'https://majalengka.tech' ? `${url.pathname}${url.search}${url.hash}` : null
		} catch {
			return null
		}
	}
	try {
		const url = new URL(raw)
		return ['http:', 'https:', 'mailto:'].includes(url.protocol) ? url.href : null
	} catch {
		return null
	}
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

function cleanProps(tag: string, props: Props): Props | null {
	const allowed = ALLOWED[tag]
	if (!allowed) return null
	const result: Props = {}
	for (const [key, value] of Object.entries(props)) {
		const name = camel(key)
		if (!allowed.includes(name)) continue
		if (name === 'href' || name === 'to') {
			const href = safeHref(value)
			if (href) result[name] = href
		} else if (name === 'src') {
			const href = safeHref(value)
			if (href?.startsWith(IMAGE_ORIGIN)) result.src = href
		} else if (name === 'style') {
			// Hanya perataan kolom tabel dari GFM.
			if (typeof value === 'string' && /^text-align:(left|right|center)$/.test(value)) result.style = value
		} else if (name === 'color') {
			if (COLORS.includes(String(value))) result.color = value
		} else if (name === 'icon' || (tag === 'icon' && name === 'name')) {
			if (typeof value === 'string' && /^i-(lucide|simple-icons|tabler|mage)-[a-z0-9-]+$/.test(value)) result[name] = value
		} else if (name === 'target') {
			if (value === '_blank') result.target = '_blank'
		} else if (name === 'highlights') {
			if (Array.isArray(value) && value.every(line => Number.isInteger(line))) result.highlights = value
		} else if (name === 'expandAll' || name === 'required') {
			result[name] = value === true || value === 'true' || value === ''
		} else if (typeof value === 'string' || typeof value === 'number') {
			result[name] = String(value).slice(0, 300)
		}
	}
	return result
}

function headingTag(tag: string, mode: Mode) {
	const depth = Number(tag[1])
	if (mode === 'cerita') return depth <= 2 ? 'h3' : 'h4'
	return depth <= 2 ? 'h2' : depth === 3 ? 'h3' : 'h4'
}

function sanitize(nodes: Node[], mode: Mode, parent?: string): Node[] {
	const result: Node[] = []
	for (const node of nodes) {
		if (typeof node === 'string') {
			result.push(node)
			continue
		}
		const [rawTag, rawProps = {}, ...rawChildren] = node
		if (rawTag === null) continue
		let tag = rawTag.toLowerCase()
		const props = rawProps as Props
		// Slot (#judul) hanya bermakna di dalam komponen; template di tempat lain dibuang.
		const isSlot = tag === 'template' && !!parent && COMPONENTS.has(parent)
		if (DROPPED.has(tag) && !isSlot) continue
		if (tag === 'iframe') {
			const src = videoEmbedUrl(props.src)
			if (src) {
				result.push(['iframe', {
					src,
					title: typeof props.title === 'string' ? props.title.slice(0, 120) : 'Video',
					loading: 'lazy',
					allow: 'accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
					allowfullscreen: true,
					referrerpolicy: 'strict-origin-when-cross-origin',
					class: 'my-5 aspect-video w-full rounded-md border border-default'
				}])
			}
			continue
		}
		if (tag === 'input') {
			if (props.type === 'checkbox' && parent === 'li') {
				const checked = props.checked ?? props[':checked']
				result.push(['input', { type: 'checkbox', disabled: true, checked: checked === true || checked === 'true' || checked === '' }])
			}
			continue
		}
		if (/^h[1-6]$/.test(tag)) tag = headingTag(tag, mode)
		const clean = cleanProps(tag, props)
		const children = sanitize(rawChildren as Node[], mode, tag)
		if (!clean) {
			// Komponen tak dikenal tanpa isi kemungkinan teks biasa seperti ":penting"; kembalikan sebagai teks.
			if (!children.length && !HTML_TAGS.has(tag)) result.push(`:${rawTag}`)
			else result.push(...children)
			continue
		}
		if (tag === 'a' && !clean.href) {
			result.push(...children)
			continue
		}
		if (tag === 'a' && /^https?:/.test(String(clean.href)) && !String(clean.href).startsWith('https://majalengka.tech')) {
			clean.target = '_blank'
			clean.rel = 'noopener noreferrer nofollow ugc'
		}
		if (tag === 'img' && !clean.src) {
			const alt = typeof props.alt === 'string' ? props.alt : ''
			if (alt) result.push(alt)
			continue
		}
		result.push([tag, clean, ...children] as ElementNode)
	}
	return result
}

function sanitizePlugin(mode: Mode): ComarkPlugin {
	return {
		name: 'majalengka-sanitize',
		post(state) {
			state.tree.nodes = sanitize(state.tree.nodes, mode)
		}
	}
}

async function render(markdown: string, mode: Mode): Promise<RenderedMarkdown> {
	const doc = await parseMarkdown(markdown, {
		plugins: [
			...(mode === 'cerita' ? [breaks()] : []),
			sanitizePlugin(mode),
			rangi(),
			toc({ depth: 3, searchDepth: 3 })
		]
	})
	return { nodes: doc.nodes, frontmatter: {}, meta: mode === 'tutorial' ? { toc: doc.meta.toc } : {} }
}

// Highlight kode tetap ada biayanya, jadi hasil render disimpan per isi; halaman yang sama tidak di-highlight ulang tiap kunjungan.
const cache = new Map<string, Promise<RenderedMarkdown>>()

export function renderComark(markdown: string | null | undefined, mode: Mode): Promise<RenderedMarkdown> {
	const key = `${mode}:${createHash('sha1').update(markdown || '').digest('base64')}`
	let result = cache.get(key)
	if (!result) {
		result = render(markdown || '', mode)
		result.catch(() => cache.delete(key))
		cache.set(key, result)
		if (cache.size > 300) cache.delete(cache.keys().next().value!)
	}
	return result
}
