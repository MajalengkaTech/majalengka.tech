<script setup lang="ts">
import type { DropdownMenuItem, EditorCustomHandlers, EditorSuggestionMenuItem, EditorToolbarItem } from '@nuxt/ui'
import type { Editor, JSONContent } from '@tiptap/vue-3'
import { mapEditorItems } from '@nuxt/ui/utils/editor'
import { TableKit } from '@tiptap/extension-table'
import { CellSelection } from '@tiptap/pm/tables'
import { ImageUpload } from './ImageUploadExtension'

// Editor ala Notion mengikuti template Nuxt UI Editor, dipakai tutorial dan cerita proyek: menu "/", pegangan blok
// (+ dan titik enam), kotak unggah gambar, dan tabel. Isi tetap disimpan sebagai Markdown.
const props = defineProps<{
	placeholder?: string
	imageFolder: 'tutorial' | 'projek'
	projectId?: number
}>()
const model = defineModel<string>({ required: true })

const customHandlers = {
	imageUpload: {
		canExecute: (editor: Editor) => editor.can().insertContent({ type: 'imageUpload' }),
		execute: (editor: Editor) => editor.chain().focus().insertContent({ type: 'imageUpload' }),
		isActive: (editor: Editor) => editor.isActive('imageUpload'),
		isDisabled: undefined
	},
	table: {
		canExecute: (editor: Editor) => editor.can().insertTable({ rows: 3, cols: 3, withHeaderRow: true }),
		execute: (editor: Editor) => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }),
		isActive: (editor: Editor) => editor.isActive('table'),
		isDisabled: undefined
	}
} satisfies EditorCustomHandlers

const extensions = [ImageUpload.configure({ folder: props.imageFolder, projectId: props.projectId }), TableKit]

// Hanya format yang dirender halaman tutorial (lihat renderTutorial di utils/markdown.ts). Garis bawah tidak dipakai
// karena Markdown menyimpannya sebagai HTML, dan HTML mentah ditampilkan sebagai teks.
const markItems: EditorToolbarItem<typeof customHandlers>[] = [
	{ kind: 'mark', mark: 'bold', icon: 'i-lucide-bold', tooltip: { text: 'Tebal' } },
	{ kind: 'mark', mark: 'italic', icon: 'i-lucide-italic', tooltip: { text: 'Miring' } },
	{ kind: 'mark', mark: 'strike', icon: 'i-lucide-strikethrough', tooltip: { text: 'Coret' } },
	{ kind: 'mark', mark: 'code', icon: 'i-lucide-code', tooltip: { text: 'Kode' } }
]

const toolbarItems: EditorToolbarItem<typeof customHandlers>[][] = [
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
		{ kind: 'codeBlock', icon: 'i-lucide-square-code', tooltip: { text: 'Blok kode' } }
	],
	[
		{ kind: 'imageUpload', icon: 'i-lucide-image', tooltip: { text: 'Sisipkan gambar' } },
		{ kind: 'table', icon: 'i-lucide-table', tooltip: { text: 'Sisipkan tabel' } },
		{ kind: 'horizontalRule', icon: 'i-lucide-separator-horizontal', tooltip: { text: 'Garis pemisah' } }
	],
	[{ slot: 'link' as const, icon: 'i-lucide-link' }]
]

const bubbleItems: EditorToolbarItem<typeof customHandlers>[][] = [
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

function tableToolbarItems(editor: Editor): EditorToolbarItem[][] {
	return [[
		{ icon: 'i-lucide-between-vertical-start', tooltip: { text: 'Tambah baris di atas' }, onClick: () => editor.chain().focus().addRowBefore().run() },
		{ icon: 'i-lucide-between-vertical-end', tooltip: { text: 'Tambah baris di bawah' }, onClick: () => editor.chain().focus().addRowAfter().run() },
		{ icon: 'i-lucide-between-horizontal-start', tooltip: { text: 'Tambah kolom di kiri' }, onClick: () => editor.chain().focus().addColumnBefore().run() },
		{ icon: 'i-lucide-between-horizontal-end', tooltip: { text: 'Tambah kolom di kanan' }, onClick: () => editor.chain().focus().addColumnAfter().run() }
	], [
		{ icon: 'i-lucide-rows-3', tooltip: { text: 'Hapus baris' }, onClick: () => editor.chain().focus().deleteRow().run() },
		{ icon: 'i-lucide-columns-3', tooltip: { text: 'Hapus kolom' }, onClick: () => editor.chain().focus().deleteColumn().run() }
	], [
		{ icon: 'i-lucide-trash', tooltip: { text: 'Hapus tabel' }, onClick: () => editor.chain().focus().deleteTable().run() }
	]]
}

const suggestionItems: EditorSuggestionMenuItem<typeof customHandlers>[][] = [[
	{ type: 'label', label: 'Gaya' },
	{ kind: 'paragraph', label: 'Paragraf', icon: 'i-lucide-type' },
	{ kind: 'heading', level: 2, label: 'Subjudul', icon: 'i-lucide-heading-2' },
	{ kind: 'heading', level: 3, label: 'Subjudul kecil', icon: 'i-lucide-heading-3' },
	{ kind: 'bulletList', label: 'Daftar poin', icon: 'i-lucide-list' },
	{ kind: 'orderedList', label: 'Daftar bernomor', icon: 'i-lucide-list-ordered' },
	{ kind: 'blockquote', label: 'Kutipan', icon: 'i-lucide-text-quote' },
	{ kind: 'codeBlock', label: 'Blok kode', icon: 'i-lucide-square-code' }
], [
	{ type: 'label', label: 'Sisipkan' },
	{ kind: 'imageUpload', label: 'Gambar', icon: 'i-lucide-image' },
	{ kind: 'table', label: 'Tabel', icon: 'i-lucide-table' },
	{ kind: 'horizontalRule', label: 'Garis pemisah', icon: 'i-lucide-separator-horizontal' }
]]

// Menu titik enam di kiri blok, disesuaikan dari useEditorDragHandle di template Nuxt UI Editor.
const NODE_LABELS: Record<string, string> = {
	paragraph: 'Paragraf',
	heading: 'Subjudul',
	bulletList: 'Daftar poin',
	orderedList: 'Daftar bernomor',
	listItem: 'Butir daftar',
	blockquote: 'Kutipan',
	codeBlock: 'Blok kode',
	image: 'Gambar',
	table: 'Tabel',
	horizontalRule: 'Garis pemisah'
}
const CONVERTIBLE_TYPES = ['paragraph', 'heading', 'bulletList', 'orderedList', 'blockquote', 'codeBlock', 'listItem']
const selectedNode = ref<{ node: JSONContent | null, pos: number }>()

function onNodeChange(event: { node: JSONContent | null, pos: number }) {
	selectedNode.value = event
}

function dragHandleItems(editor: Editor): DropdownMenuItem[][] {
	const type = selectedNode.value?.node?.type
	if (!type) return []
	const pos = selectedNode.value?.pos
	const specific = CONVERTIBLE_TYPES.includes(type)
		? [{
				label: 'Ubah jadi',
				icon: 'i-lucide-repeat-2',
				children: [
					{ kind: 'paragraph', label: 'Paragraf', icon: 'i-lucide-type' },
					{ kind: 'heading', level: 2, label: 'Subjudul', icon: 'i-lucide-heading-2' },
					{ kind: 'heading', level: 3, label: 'Subjudul kecil', icon: 'i-lucide-heading-3' },
					{ kind: 'bulletList', label: 'Daftar poin', icon: 'i-lucide-list' },
					{ kind: 'orderedList', label: 'Daftar bernomor', icon: 'i-lucide-list-ordered' },
					{ kind: 'blockquote', label: 'Kutipan', icon: 'i-lucide-text-quote' },
					{ kind: 'codeBlock', label: 'Blok kode', icon: 'i-lucide-square-code' }
				]
			}, { kind: 'clearFormatting', pos, label: 'Hapus format', icon: 'i-lucide-rotate-ccw' }]
		: []
	return mapEditorItems(editor, [
		[{ type: 'label', label: NODE_LABELS[type] ?? type }, ...specific],
		[{ kind: 'duplicate', pos, label: 'Gandakan', icon: 'i-lucide-copy' }],
		[
			{ kind: 'moveUp', pos, label: 'Pindah ke atas', icon: 'i-lucide-arrow-up' },
			{ kind: 'moveDown', pos, label: 'Pindah ke bawah', icon: 'i-lucide-arrow-down' }
		],
		[{ kind: 'delete', pos, label: 'Hapus', icon: 'i-lucide-trash' }]
	], customHandlers) as DropdownMenuItem[][]
}
</script>

<template>
	<UEditor
		v-slot="{ editor, handlers }"
		:model-value="model"
		content-type="markdown"
		:extensions="extensions"
		:handlers="customHandlers"
		:starter-kit="{
			underline: false,
			heading: { levels: [2, 3] },
			link: { openOnClick: false }
		}"
		:placeholder="placeholder"
		class="w-full rounded-md border border-accented bg-default focus-within:border-primary"
		:ui="{ base: 'min-h-[50vh] px-4 py-5 sm:px-14' }"
		@update:model-value="(value: string) => model = value"
	>
		<!-- Toolbar tetap menempel di atas area yang digulir; pembungkusnya tidak memakai overflow-hidden supaya sticky jalan. -->
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
			:should-show="({ editor: current, view, state }: any) => {
				if (current.isActive('imageUpload') || current.isActive('image') || state.selection instanceof CellSelection) return false
				return view.hasFocus() && !state.selection.empty
			}"
		>
			<template #link>
				<ProjectStoryLinkPopover :editor="editor" />
			</template>
		</UEditorToolbar>

		<UEditorToolbar
			:editor="editor"
			:items="tableToolbarItems(editor)"
			layout="bubble"
			:should-show="({ view, state }: any) => state.selection instanceof CellSelection && view.hasFocus()"
		/>

		<UEditorSuggestionMenu
			:editor="editor"
			:items="suggestionItems"
		/>

		<UEditorDragHandle
			v-slot="{ ui, onClick }"
			:editor="editor"
			@node-change="onNodeChange"
		>
			<UButton
				icon="i-lucide-plus"
				color="neutral"
				variant="ghost"
				size="sm"
				aria-label="Sisipkan blok"
				:class="ui.handle()"
				@click="(e: MouseEvent) => {
					e.stopPropagation()
					const node = onClick()
					handlers.suggestion?.execute(editor, { pos: node?.pos }).run()
				}"
			/>
			<UDropdownMenu
				v-slot="{ open }"
				:modal="false"
				:items="dragHandleItems(editor)"
				:content="{ side: 'left' }"
				:ui="{ content: 'w-48', label: 'text-xs' }"
				@update:open="editor.chain().setMeta('lockDragHandle', $event).run()"
			>
				<UButton
					color="neutral"
					variant="ghost"
					active-variant="soft"
					size="sm"
					icon="i-lucide-grip-vertical"
					aria-label="Atur blok"
					:active="open"
					:class="ui.handle()"
				/>
			</UDropdownMenu>
		</UEditorDragHandle>
	</UEditor>
</template>
