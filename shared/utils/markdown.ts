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
