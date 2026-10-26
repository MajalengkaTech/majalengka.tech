import { Node, mergeAttributes } from '@tiptap/core'
import type { JSONContent, MarkdownLexerConfiguration, MarkdownToken, NodeViewRenderer } from '@tiptap/core'
import { CodeBlock } from '@tiptap/extension-code-block'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import ComarkBlockView from './ComarkBlockView.vue'
import CodeBlockView from './CodeBlockView.vue'
import VideoEmbedView from './VideoEmbedView.vue'

// Komponen tipografi Nuxt UI untuk editor tutorial. Disimpan sebagai sintaks Comark (::tabs ... ::) supaya halaman
// tutorial merendernya lewat server/utils/comark.ts. Helper bawaan TipTap (createBlockMarkdownSpec) tidak dipakai
// karena memakai gaya Pandoc (`:::nama {attr}`) dan jumlah titik dua yang sama untuk blok bersarang.

function parseComarkAttributes(raw: string) {
	const attrs: Record<string, string> = {}
	for (const match of raw.matchAll(/([a-z][\w-]*)(?:="([^"]*)")?/gi)) {
		if (match[1]) attrs[match[1]] = match[2] ?? 'true'
	}
	return attrs
}

function serializeAttributes(attrs: Record<string, unknown>) {
	const parts = Object.entries(attrs)
		.filter(([, value]) => value !== null && value !== undefined && value !== '')
		.map(([key, value]) => `${key}="${String(value).replace(/"/g, '\'')}"`)
	return parts.length ? `{${parts.join(' ')}}` : ''
}

// Komponen luar memakai lebih banyak titik dua daripada komponen terdalam di dalamnya, supaya penutupnya tidak tertukar.
function colonsFor(inner: string) {
	let max = 1
	for (const match of inner.matchAll(/^(:{2,})[a-z]/gm)) max = Math.max(max, match[1]!.length)
	return ':'.repeat(max + 1)
}

function escapeRegex(text: string) {
	return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

interface ComarkToken extends MarkdownToken {
	tag: string
	attributes: Record<string, string>
}

function comarkTokenizer(nodeName: string, tags: string[]) {
	const names = tags.map(escapeRegex).join('|')
	const opening = new RegExp(`^(:{2,})(${names})(\\{[^\\n]*\\})?[ \\t]*(?:\\n|$)`)
	const anywhere = new RegExp(`^:{2,}(?:${names})(?![\\w-])`, 'm')
	return {
		name: nodeName,
		level: 'block' as const,
		start(src: string) {
			return src.match(anywhere)?.index ?? -1
		},
		tokenize(src: string, _tokens: MarkdownToken[], lexer: MarkdownLexerConfiguration): ComarkToken | undefined {
			const open = opening.exec(src)
			if (!open) return undefined
			const colons = open[1]!.length
			let depth = 1
			let inFence = false
			let offset = open[0].length
			while (offset <= src.length) {
				const end = src.indexOf('\n', offset)
				const line = src.slice(offset, end === -1 ? src.length : end)
				if (/^\s*(`{3,}|~{3,})/.test(line)) {
					inFence = !inFence
				} else if (!inFence) {
					const marker = /^(:{2,})([a-z][\w-]*)?(.*)$/i.exec(line)
					if (marker && marker[1]!.length === colons) {
						if (marker[2]) depth++
						else if (!marker[3]!.trim()) depth--
					}
				}
				if (depth === 0) {
					const inner = src.slice(open[0].length, offset)
					const tokens = lexer.blockTokens(inner)
					for (const token of tokens) {
						if (token.text && !token.tokens?.length && token.type !== 'code') token.tokens = lexer.inlineTokens(token.text)
					}
					return {
						type: nodeName,
						raw: src.slice(0, end === -1 ? src.length : end + 1),
						tag: open[2]!,
						attributes: parseComarkAttributes(open[3]?.slice(1, -1) ?? ''),
						tokens
					}
				}
				if (end === -1) return undefined
				offset = end + 1
			}
			return undefined
		}
	}
}

interface ComarkBlockConfig {
	name: string
	// Nama komponen Comark; yang pertama dipakai untuk blok baru.
	tags: string[]
	content: string
	// Atribut Comark (kebab-case) yang disimpan ke Markdown.
	attrs?: string[]
	// Tipe anak yang sah; anak lain dari Markdown dibuang supaya skema tetap valid.
	childType?: string
	group?: string
}

function comarkBlock(config: ComarkBlockConfig) {
	const attrs = config.attrs ?? []
	return Node.create({
		name: config.name,
		group: config.group,
		content: config.content,
		defining: true,
		isolating: !config.group,
		draggable: config.group === 'block',
		addAttributes() {
			return Object.fromEntries([['tag', { default: config.tags[0] }], ...attrs.map(key => [key, { default: null }])])
		},
		parseHTML() {
			return [{ tag: `div[data-comark="${config.name}"]` }]
		},
		renderHTML({ HTMLAttributes }) {
			return ['div', mergeAttributes(HTMLAttributes, { 'data-comark': config.name }), 0]
		},
		addNodeView(): NodeViewRenderer {
			return VueNodeViewRenderer(ComarkBlockView)
		},
		markdownTokenizer: comarkTokenizer(config.name, config.tags),
		parseMarkdown(token, helpers) {
			const { tag, attributes } = token as ComarkToken
			const nodeAttrs: Record<string, string> = { tag }
			for (const key of attrs) {
				if (attributes[key] !== undefined) nodeAttrs[key] = attributes[key]
			}
			let children = helpers.parseChildren(token.tokens ?? []) as JSONContent[]
			if (config.childType) children = children.filter(child => child.type === config.childType)
			if (!children.length) children = [config.childType ? { type: config.childType } : { type: 'paragraph' }]
			return helpers.createNode(config.name, nodeAttrs, children)
		},
		renderMarkdown(node, helpers) {
			const inner = helpers.renderChildren(node.content ?? [], '\n\n')
			const colons = colonsFor(inner)
			const saved = Object.fromEntries(attrs.map(key => [key, node.attrs?.[key]]))
			return `${colons}${node.attrs?.tag ?? config.tags[0]}${serializeAttributes(saved)}\n${inner}\n${colons}`
		}
	})
}

export const Callout = comarkBlock({ name: 'callout', tags: ['note', 'tip', 'warning', 'caution', 'callout'], content: 'block+', attrs: ['icon', 'color', 'to'], group: 'block' })
export const Steps = comarkBlock({ name: 'steps', tags: ['steps'], content: 'block+', attrs: ['level'], group: 'block' })
export const Tabs = comarkBlock({ name: 'tabs', tags: ['tabs'], content: 'tabsItem+', childType: 'tabsItem', group: 'block' })
export const TabsItem = comarkBlock({ name: 'tabsItem', tags: ['tabs-item'], content: 'block+', attrs: ['label', 'icon'] })
export const Accordion = comarkBlock({ name: 'accordion', tags: ['accordion'], content: 'accordionItem+', childType: 'accordionItem', group: 'block' })
export const AccordionItem = comarkBlock({ name: 'accordionItem', tags: ['accordion-item'], content: 'block+', attrs: ['label', 'icon'] })
export const CardGroup = comarkBlock({ name: 'cardGroup', tags: ['card-group'], content: 'card+', childType: 'card', group: 'block' })
export const Card = comarkBlock({ name: 'card', tags: ['card'], content: 'block+', attrs: ['title', 'icon', 'to'] })
export const CodeGroup = comarkBlock({ name: 'codeGroup', tags: ['code-group'], content: 'codeBlock+', childType: 'codeBlock', group: 'block' })
export const CodeTree = comarkBlock({ name: 'codeTree', tags: ['code-tree'], content: 'codeBlock+', childType: 'codeBlock', attrs: ['default-value'], group: 'block' })
export const CodeCollapse = comarkBlock({ name: 'codeCollapse', tags: ['code-collapse'], content: 'codeBlock', childType: 'codeBlock', group: 'block' })

// Video disimpan sebagai <iframe> dengan alamat embed yang sudah dibersihkan; server menyaringnya lagi saat render.
export const VideoEmbed = Node.create({
	name: 'videoEmbed',
	group: 'block',
	atom: true,
	draggable: true,
	addAttributes() {
		return { src: { default: null } }
	},
	parseHTML() {
		return [{ tag: 'div[data-type="video-embed"]' }]
	},
	renderHTML({ HTMLAttributes }) {
		return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'video-embed' })]
	},
	addNodeView(): NodeViewRenderer {
		return VueNodeViewRenderer(VideoEmbedView)
	},
	markdownTokenizer: {
		name: 'videoEmbed',
		level: 'block',
		start(src: string) {
			return src.search(/^<iframe\s/m)
		},
		tokenize(src: string) {
			const match = /^<iframe\s[^>]*?src="([^"]+)"[^>]*>\s*<\/iframe>[ \t]*(?:\n|$)/.exec(src)
			if (!match) return undefined
			return { type: 'videoEmbed', raw: match[0], src: match[1] }
		}
	},
	parseMarkdown(token, helpers) {
		return helpers.createNode('videoEmbed', { src: videoEmbedUrl((token as MarkdownToken & { src?: string }).src) })
	},
	renderMarkdown(node) {
		const src = videoEmbedUrl(node.attrs?.src)
		return src ? `<iframe src="${src}"></iframe>` : ''
	}
})

// Blok kode dengan kolom bahasa dan nama file; disimpan seperti Nuxt Content: ```ts [nuxt.config.ts]
export const CodeBlockWithFile = CodeBlock.extend({
	addNodeView(): NodeViewRenderer {
		return VueNodeViewRenderer(CodeBlockView)
	}
})

export const comarkExtensions = [Callout, Steps, Tabs, TabsItem, Accordion, AccordionItem, CardGroup, Card, CodeGroup, CodeTree, CodeCollapse, VideoEmbed, CodeBlockWithFile]

const paragraph: JSONContent = { type: 'paragraph' }
const text = (value: string): JSONContent[] => [{ type: 'text', text: value }]
const code = (language: string, value = ''): JSONContent => ({ type: 'codeBlock', attrs: { language }, content: value ? text(value) : undefined })

// Isi awal tiap komponen saat disisipkan dari menu.
export const COMARK_TEMPLATES: Record<string, JSONContent> = {
	callout: { type: 'callout', attrs: { tag: 'note' }, content: [paragraph] },
	steps: { type: 'steps', content: [{ type: 'heading', attrs: { level: 3 }, content: text('Langkah pertama') }, paragraph] },
	tabs: { type: 'tabs', content: [1, 2].map(n => ({ type: 'tabsItem', attrs: { tag: 'tabs-item', label: `Tab ${n}` }, content: [paragraph] })) },
	accordion: { type: 'accordion', content: [1, 2].map(n => ({ type: 'accordionItem', attrs: { tag: 'accordion-item', label: `Pertanyaan ${n}` }, content: [paragraph] })) },
	cardGroup: { type: 'cardGroup', content: [1, 2].map(n => ({ type: 'card', attrs: { tag: 'card', title: `Kartu ${n}` }, content: [paragraph] })) },
	codeGroup: { type: 'codeGroup', content: [code('bash [bun]', 'bun add nama-paket'), code('bash [npm]', 'npm install nama-paket')] },
	codeTree: { type: 'codeTree', content: [code('vue [app/app.vue]'), code('ts [nuxt.config.ts]')] },
	codeCollapse: { type: 'codeCollapse', content: [code('ts [contoh.ts]')] },
	videoEmbed: { type: 'videoEmbed' }
}
