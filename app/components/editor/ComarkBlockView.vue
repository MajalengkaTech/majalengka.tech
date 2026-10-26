<script setup lang="ts">
import type { JSONContent } from '@tiptap/core'
import { NodeViewContent, NodeViewWrapper, nodeViewProps } from '@tiptap/vue-3'

// Bingkai komponen tipografi di editor tutorial: judul jenis komponen, kolom atribut, dan isi yang bisa diedit.
const props = defineProps(nodeViewProps)

const CALLOUT_KINDS = [
	{ label: 'Catatan', value: 'note', icon: 'i-lucide-info' },
	{ label: 'Tips', value: 'tip', icon: 'i-lucide-lightbulb' },
	{ label: 'Peringatan', value: 'warning', icon: 'i-lucide-triangle-alert' },
	{ label: 'Penting', value: 'caution', icon: 'i-lucide-circle-alert' },
	{ label: 'Kotak biasa', value: 'callout', icon: 'i-lucide-square' }
]

const CALLOUT_STYLES: Record<string, string> = {
	note: 'border-info/40 bg-info/5',
	tip: 'border-success/40 bg-success/5',
	warning: 'border-warning/40 bg-warning/5',
	caution: 'border-error/40 bg-error/5',
	callout: 'border-default bg-elevated/50'
}

const META: Record<string, { label: string, icon: string, hint?: string, add?: { label: string, node: () => JSONContent } }> = {
	callout: { label: 'Kotak catatan', icon: 'i-lucide-info' },
	steps: { label: 'Langkah-langkah', icon: 'i-lucide-list-ordered', hint: 'Setiap Subjudul kecil menjadi satu langkah bernomor.' },
	tabs: { label: 'Tab', icon: 'i-lucide-panels-top-left', add: { label: 'Tambah tab', node: () => ({ type: 'tabsItem', attrs: { tag: 'tabs-item', label: 'Tab baru' }, content: [{ type: 'paragraph' }] }) } },
	tabsItem: { label: 'Isi tab', icon: 'i-lucide-panel-top' },
	accordion: { label: 'Akordeon', icon: 'i-lucide-list-collapse', add: { label: 'Tambah pertanyaan', node: () => ({ type: 'accordionItem', attrs: { tag: 'accordion-item', label: 'Pertanyaan baru' }, content: [{ type: 'paragraph' }] }) } },
	accordionItem: { label: 'Butir akordeon', icon: 'i-lucide-chevron-down' },
	cardGroup: { label: 'Grup kartu', icon: 'i-lucide-layout-grid', add: { label: 'Tambah kartu', node: () => ({ type: 'card', attrs: { tag: 'card', title: 'Kartu baru' }, content: [{ type: 'paragraph' }] }) } },
	card: { label: 'Kartu', icon: 'i-lucide-square-dashed-mouse-pointer' },
	codeGroup: { label: 'Grup kode', icon: 'i-lucide-files', hint: 'Setiap blok kode menjadi satu tab; isi nama file sebagai judul tabnya.', add: { label: 'Tambah blok kode', node: () => ({ type: 'codeBlock', attrs: { language: 'bash [nama-tab]' } }) } },
	codeTree: { label: 'Pohon file', icon: 'i-lucide-folder-tree', hint: 'Isi nama file dengan path lengkap, misalnya app/pages/index.vue.', add: { label: 'Tambah file', node: () => ({ type: 'codeBlock', attrs: { language: 'ts [folder/file.ts]' } }) } },
	codeCollapse: { label: 'Kode panjang (bisa dilipat)', icon: 'i-lucide-fold-vertical' }
}

const type = computed(() => props.node.type.name)
const meta = computed(() => META[type.value] ?? { label: type.value, icon: 'i-lucide-box' })
const calloutKind = computed(() => CALLOUT_KINDS.find(kind => kind.value === props.node.attrs.tag) ?? CALLOUT_KINDS[0]!)
const isItem = computed(() => ['tabsItem', 'accordionItem', 'card'].includes(type.value))

const wrapperClass = computed(() => {
	if (type.value === 'callout') return ['border', CALLOUT_STYLES[props.node.attrs.tag] ?? CALLOUT_STYLES.callout]
	if (isItem.value) return ['border border-dashed border-accented bg-default']
	return ['border border-default bg-elevated/40']
})

function setAttr(key: string, value: unknown) {
	props.updateAttributes({ [key]: typeof value === 'string' ? value.trim() || null : value })
}

function addChild() {
	const add = meta.value.add
	const pos = props.getPos()
	if (!add || typeof pos !== 'number') return
	props.editor.chain().focus().insertContentAt(pos + props.node.nodeSize - 1, add.node()).run()
}
</script>

<template>
	<NodeViewWrapper
		:class="[wrapperClass, isItem ? 'my-2' : 'my-4', 'rounded-md p-3']"
		:data-comark="type"
	>
		<div
			contenteditable="false"
			class="mb-2 flex flex-wrap items-center gap-2 text-xs text-muted select-none"
		>
			<UIcon
				:name="type === 'callout' ? calloutKind.icon : meta.icon"
				class="size-4 shrink-0"
			/>
			<span class="font-medium text-toned">{{ meta.label }}</span>

			<USelect
				v-if="type === 'callout'"
				:model-value="calloutKind.value"
				:items="CALLOUT_KINDS"
				size="xs"
				class="w-36"
				aria-label="Jenis kotak catatan"
				@update:model-value="(value: string) => setAttr('tag', value)"
			/>

			<UInput
				v-if="type === 'tabsItem' || type === 'accordionItem'"
				:model-value="node.attrs.label ?? ''"
				:placeholder="type === 'tabsItem' ? 'Judul tab' : 'Pertanyaan atau judul'"
				size="xs"
				class="min-w-40 flex-1"
				:aria-label="type === 'tabsItem' ? 'Judul tab' : 'Judul butir akordeon'"
				@update:model-value="(value: string | number) => setAttr('label', String(value))"
			/>

			<template v-if="type === 'card'">
				<UInput
					:model-value="node.attrs.title ?? ''"
					placeholder="Judul kartu"
					size="xs"
					class="min-w-32 flex-1"
					aria-label="Judul kartu"
					@update:model-value="(value: string | number) => setAttr('title', String(value))"
				/>
				<UInput
					:model-value="node.attrs.to ?? ''"
					placeholder="Link (opsional), misalnya https://nuxt.com"
					size="xs"
					class="min-w-40 flex-1"
					aria-label="Link kartu"
					@update:model-value="(value: string | number) => setAttr('to', String(value))"
				/>
			</template>

			<span
				v-if="meta.hint"
				class="basis-full text-dimmed"
			>{{ meta.hint }}</span>
		</div>

		<NodeViewContent :class="type === 'cardGroup' ? 'grid gap-2 sm:grid-cols-2' : ''" />

		<UButton
			v-if="meta.add"
			contenteditable="false"
			:label="meta.add.label"
			icon="i-lucide-plus"
			color="neutral"
			variant="ghost"
			size="xs"
			class="mt-1"
			@click="addChild"
		/>
	</NodeViewWrapper>
</template>
