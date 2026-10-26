<script setup lang="ts">
import { NodeViewContent, NodeViewWrapper, nodeViewProps } from '@tiptap/vue-3'

// Blok kode di editor tutorial dengan kolom bahasa dan nama file. Keduanya disimpan di atribut `language`
// sebagai "ts [nuxt.config.ts]", format yang dibaca Comark untuk warna kode dan judul file.
const props = defineProps(nodeViewProps)

const parts = computed(() => {
	const match = String(props.node.attrs.language ?? '').trim().match(/^([\w+#.-]*)\s*(?:\[([^\]]*)\])?/)
	return { language: match?.[1] ?? '', filename: match?.[2]?.trim() ?? '' }
})

function update(next: { language?: string, filename?: string }) {
	const language = (next.language ?? parts.value.language).replace(/[^\w+#.-]/g, '')
	const filename = (next.filename ?? parts.value.filename).replace(/[[\]\n]/g, '').trim()
	const value = [language, filename ? `[${filename}]` : ''].filter(Boolean).join(' ')
	props.updateAttributes({ language: value || null })
}
</script>

<template>
	<NodeViewWrapper class="my-4 overflow-hidden rounded-md border border-default">
		<div
			contenteditable="false"
			class="flex flex-wrap items-center gap-2 border-b border-default bg-elevated px-2 py-1.5"
		>
			<UIcon
				name="i-lucide-square-code"
				class="size-4 shrink-0 text-muted"
			/>
			<UInput
				:model-value="parts.filename"
				placeholder="Nama file, misalnya nuxt.config.ts"
				size="xs"
				variant="ghost"
				class="min-w-40 flex-1"
				aria-label="Nama file"
				@update:model-value="(value: string | number) => update({ filename: String(value) })"
			/>
			<UInput
				:model-value="parts.language"
				placeholder="Bahasa (ts, vue, bash)"
				size="xs"
				variant="ghost"
				class="w-36"
				aria-label="Bahasa pemrograman"
				@update:model-value="(value: string | number) => update({ language: String(value) })"
			/>
		</div>
		<pre class="m-0 overflow-x-auto rounded-none border-0 bg-muted px-4 py-3 text-sm"><NodeViewContent as="code" /></pre>
	</NodeViewWrapper>
</template>
