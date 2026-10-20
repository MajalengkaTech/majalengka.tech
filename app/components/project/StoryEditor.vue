<script setup lang="ts">
import type { EditorToolbarItem } from '@nuxt/ui'

const model = defineModel<string>({ required: true })

defineProps<{
	placeholder?: string
}>()

// Hanya format yang bisa dirender aman sebagai markdown di halaman proyek (lihat utils/markdown.ts).
// Garis bawah tidak dipakai karena markdown menyimpannya sebagai HTML <u>, dan HTML mentah ditampilkan sebagai teks.
const items: EditorToolbarItem[][] = [
	[
		{ kind: 'undo', icon: 'i-lucide-undo', tooltip: { text: 'Urungkan' } },
		{ kind: 'redo', icon: 'i-lucide-redo', tooltip: { text: 'Ulangi' } }
	],
	[
		{ kind: 'heading', level: 2, icon: 'i-lucide-heading-2', tooltip: { text: 'Subjudul' } },
		{ kind: 'heading', level: 3, icon: 'i-lucide-heading-3', tooltip: { text: 'Subjudul kecil' } }
	],
	[
		{ kind: 'mark', mark: 'bold', icon: 'i-lucide-bold', tooltip: { text: 'Tebal' } },
		{ kind: 'mark', mark: 'italic', icon: 'i-lucide-italic', tooltip: { text: 'Miring' } },
		{ kind: 'mark', mark: 'strike', icon: 'i-lucide-strikethrough', tooltip: { text: 'Coret' } },
		{ kind: 'mark', mark: 'code', icon: 'i-lucide-code', tooltip: { text: 'Kode' } }
	],
	[
		{ kind: 'bulletList', icon: 'i-lucide-list', tooltip: { text: 'Daftar poin' } },
		{ kind: 'orderedList', icon: 'i-lucide-list-ordered', tooltip: { text: 'Daftar bernomor' } },
		{ kind: 'blockquote', icon: 'i-lucide-text-quote', tooltip: { text: 'Kutipan' } },
		{ kind: 'codeBlock', icon: 'i-lucide-square-code', tooltip: { text: 'Blok kode' } }
	],
	[
		{ kind: 'link', icon: 'i-lucide-link', tooltip: { text: 'Tautan' } },
		{ kind: 'horizontalRule', icon: 'i-lucide-separator-horizontal', tooltip: { text: 'Garis pemisah' } }
	]
]
</script>

<template>
	<UEditor
		v-slot="{ editor }"
		v-model="model"
		content-type="markdown"
		:starter-kit="{
			underline: false,
			heading: { levels: [2, 3] },
			link: { openOnClick: false }
		}"
		:placeholder="placeholder"
		class="w-full rounded-md border border-accented bg-default focus-within:border-primary"
		:ui="{ base: 'min-h-48 px-4 py-3 sm:px-5' }"
	>
		<!-- Toolbar menempel di atas area yang digulir saat cerita panjang. Editor tidak punya scroll sendiri dan
			tidak memakai overflow-hidden (juga kartu pembungkusnya di Form.vue), karena keduanya mematikan sticky. -->
		<UEditorToolbar
			:editor="editor"
			:items="items"
			class="sticky top-0 z-10 overflow-x-auto rounded-t-md border-b border-default bg-default px-2 py-1.5"
		/>
	</UEditor>
</template>
