import type { ComarkPlugin, ElementNode, Node } from 'comark'
import { defineMarkdownComponent } from '@comark/vue'
import rangi from 'comark/plugins/rangi'
import security from 'comark/plugins/security'

// Renderer jawaban Maja. Teks model tidak dipercaya: hanya tag Markdown biasa yang dirender (dengan komponen Prose
// Nuxt UI), gambar dan HTML lain dibuang atau dibuka jadi teks, dan link hanya http(s).
const allowedTags = ['p', 'br', 'hr', 'span', 'a', 'strong', 'em', 'b', 'i', 's', 'del', 'kbd', 'h3', 'h4', 'blockquote', 'ul', 'ol', 'li', 'code', 'pre', 'table', 'thead', 'tbody', 'tr', 'th', 'td']
const droppedTags = new Set(['script', 'style', 'iframe', 'frame', 'object', 'embed', 'template', 'textarea', 'title', 'noscript', 'svg', 'math', 'img', 'form', 'input', 'button'])

function unwrapTag([tag, , ...children]: ElementNode): false | ElementNode {
	return droppedTags.has(tag.toLowerCase()) ? false : ['span', {}, ...children]
}

// Plugin security meloloskan style, class, dan id; untuk teks model, hanya atribut berikut yang disisakan.
const KEEP: Record<string, string[]> = { a: ['href', 'title'], pre: ['language', 'filename'], code: ['class'] }

function stripAttributes(nodes: Node[]) {
	for (const node of nodes) {
		if (!Array.isArray(node) || typeof node[0] !== 'string') continue
		const keep = KEEP[node[0]] ?? []
		node[1] = Object.fromEntries(Object.entries(node[1] ?? {}).filter(([key]) => keep.includes(key)))
		stripAttributes(node.slice(2) as Node[])
	}
}

const attributeFilter: ComarkPlugin = {
	name: 'maja-attribute-filter',
	post(state) {
		stripAttributes(state.tree.nodes)
	}
}

export default defineMarkdownComponent({
	name: 'MajaChatMarkdown',
	plugins: [
		attributeFilter,
		rangi(),
		security({
			allowedTags,
			allowedProtocols: ['http', 'https'],
			allowDataImages: false,
			tagFallback: unwrapTag
		})
	]
})
