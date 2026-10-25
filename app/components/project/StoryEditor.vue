<script setup lang="ts">
import type { EditorToolbarItem } from '@nuxt/ui'

// Mengikuti template Nuxt UI Editor: nilai mengalir satu arah (:model-value + @update), toolbar tetap untuk
// blok, dan toolbar bubble di atas teks yang diblok untuk format.
const props = defineProps<{
	modelValue: string
	placeholder?: string
}>()

const emit = defineEmits<{
	'update:modelValue': [value: string]
}>()

// Hanya format yang bisa dirender aman sebagai markdown di halaman proyek (lihat utils/markdown.ts).
// Garis bawah tidak dipakai karena markdown menyimpannya sebagai HTML <u>, dan HTML mentah ditampilkan sebagai teks.
const markItems: EditorToolbarItem[] = [
	{ kind: 'mark', mark: 'bold', icon: 'i-lucide-bold', tooltip: { text: 'Tebal' } },
	{ kind: 'mark', mark: 'italic', icon: 'i-lucide-italic', tooltip: { text: 'Miring' } },
	{ kind: 'mark', mark: 'strike', icon: 'i-lucide-strikethrough', tooltip: { text: 'Coret' } },
	{ kind: 'mark', mark: 'code', icon: 'i-lucide-code', tooltip: { text: 'Kode' } }
]

const toolbarItems: EditorToolbarItem[][] = [
	[
		{ kind: 'undo', icon: 'i-lucide-undo', tooltip: { text: 'Urungkan' } },
		{ kind: 'redo', icon: 'i-lucide-redo', tooltip: { text: 'Ulangi' } }
	],
	[
		{ kind: 'heading', level: 2, icon: 'i-lucide-heading-2', tooltip: { text: 'Subjudul' } },
		{ kind: 'heading', level: 3, icon: 'i-lucide-heading-3', tooltip: { text: 'Subjudul kecil' } }
	],
	markItems,
	[
		{ kind: 'bulletList', icon: 'i-lucide-list', tooltip: { text: 'Daftar poin' } },
		{ kind: 'orderedList', icon: 'i-lucide-list-ordered', tooltip: { text: 'Daftar bernomor' } },
		{ kind: 'blockquote', icon: 'i-lucide-text-quote', tooltip: { text: 'Kutipan' } },
		{ kind: 'codeBlock', icon: 'i-lucide-square-code', tooltip: { text: 'Blok kode' } },
		{ kind: 'horizontalRule', icon: 'i-lucide-separator-horizontal', tooltip: { text: 'Garis pemisah' } }
	],
	[{ slot: 'link' as const, icon: 'i-lucide-link' }]
]

const bubbleItems: EditorToolbarItem[][] = [
	[{
		label: 'Ubah jadi',
		trailingIcon: 'i-lucide-chevron-down',
		activeColor: 'neutral',
		activeVariant: 'ghost',
		content: { align: 'start' },
		ui: { label: 'text-xs' },
		items: [
			{ kind: 'paragraph', label: 'Paragraf', icon: 'i-lucide-type' },
			{ kind: 'heading', level: 2, label: 'Subjudul', icon: 'i-lucide-heading-2' },
			{ kind: 'heading', level: 3, label: 'Subjudul kecil', icon: 'i-lucide-heading-3' },
			{ kind: 'bulletList', label: 'Daftar poin', icon: 'i-lucide-list' },
			{ kind: 'orderedList', label: 'Daftar bernomor', icon: 'i-lucide-list-ordered' },
			{ kind: 'blockquote', label: 'Kutipan', icon: 'i-lucide-text-quote' },
			{ kind: 'codeBlock', label: 'Blok kode', icon: 'i-lucide-square-code' }
		]
	}],
	markItems,
	[{ slot: 'link' as const, icon: 'i-lucide-link' }]
]
</script>

<template>
	<UEditor
		v-slot="{ editor }"
		:model-value="props.modelValue"
		content-type="markdown"
		:starter-kit="{
			underline: false,
			heading: { levels: [2, 3] },
			link: { openOnClick: false }
		}"
		:placeholder="placeholder"
		class="w-full rounded-md border border-accented bg-default focus-within:border-primary"
		:ui="{ base: 'min-h-48 px-4 py-3 sm:px-5' }"
		@update:model-value="(value: string) => emit('update:modelValue', value)"
	>
		<!-- Toolbar tetap menempel di atas area yang digulir. Editor dan kartu pembungkusnya di Form.vue tidak memakai
			overflow-hidden, karena itu mematikan sticky. -->
		<UEditorToolbar
			:editor="editor"
			:items="toolbarItems"
			class="sticky top-0 z-10 overflow-x-auto rounded-t-md border-b border-default bg-default px-2 py-1.5"
		>
			<template #link>
				<ProjectStoryLinkPopover :editor="editor" />
			</template>
		</UEditorToolbar>

		<UEditorToolbar
			:editor="editor"
			:items="bubbleItems"
			layout="bubble"
			:should-show="({ view, state }: any) => view.hasFocus() && !state.selection.empty"
		>
			<template #link>
				<ProjectStoryLinkPopover :editor="editor" />
			</template>
		</UEditorToolbar>
	</UEditor>
</template>
