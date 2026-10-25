<script setup lang="ts">
import type { Editor } from '@tiptap/vue-3'

// Diadaptasi dari LinkPopover template Nuxt UI Editor.
const props = defineProps<{
	editor: Editor
}>()

const open = ref(false)
const url = ref('')
const invalid = ref(false)

const active = computed(() => props.editor.isActive('link'))
const disabled = computed(() => {
	if (!props.editor.isEditable) return true
	return props.editor.state.selection.empty && !props.editor.isActive('link')
})

watch(() => props.editor, (editor, _, onCleanup) => {
	if (!editor) return
	const updateUrl = () => {
		url.value = editor.getAttributes('link').href || ''
	}
	updateUrl()
	editor.on('selectionUpdate', updateUrl)
	onCleanup(() => editor.off('selectionUpdate', updateUrl))
}, { immediate: true })

// Halaman proyek hanya menampilkan link http(s) dan mailto (utils/markdown.ts), jadi yang lain ditolak di sini.
function isAllowed(value: string) {
	return /^(https?:\/\/|mailto:)/i.test(value.trim())
}

function setLink() {
	if (!url.value) return
	if (!isAllowed(url.value)) {
		invalid.value = true
		return
	}
	invalid.value = false
	const href = url.value.trim()
	let chain = props.editor.chain().focus().extendMarkRange('link').setLink({ href })
	if (props.editor.state.selection.empty) chain = chain.insertContent({ type: 'text', text: href })
	chain.run()
	open.value = false
}

function removeLink() {
	props.editor.chain().focus().extendMarkRange('link').unsetLink().setMeta('preventAutolink', true).run()
	url.value = ''
	open.value = false
}

function onKeydown(event: KeyboardEvent) {
	if (event.key === 'Enter') {
		event.preventDefault()
		setLink()
	}
}
</script>

<template>
	<UPopover
		v-model:open="open"
		:ui="{ content: 'p-0.5' }"
	>
		<UTooltip text="Tautan">
			<UButton
				icon="i-lucide-link"
				color="neutral"
				active-color="primary"
				variant="ghost"
				active-variant="soft"
				size="sm"
				:active="active"
				:disabled="disabled"
				aria-label="Tautan"
			/>
		</UTooltip>

		<template #content>
			<UInput
				v-model="url"
				autofocus
				name="url"
				type="url"
				variant="none"
				placeholder="Tempel link https://..."
				:color="invalid ? 'error' : undefined"
				:aria-invalid="invalid"
				@keydown="onKeydown"
				@update:model-value="invalid = false"
			>
				<div class="mr-0.5 flex items-center">
					<UButton
						icon="i-lucide-corner-down-left"
						variant="ghost"
						size="sm"
						:disabled="!url"
						aria-label="Pasang tautan"
						@click="setLink"
					/>
					<USeparator
						orientation="vertical"
						class="mx-1 h-6"
					/>
					<UButton
						icon="i-lucide-trash"
						color="neutral"
						variant="ghost"
						size="sm"
						:disabled="!active"
						aria-label="Hapus tautan"
						@click="removeLink"
					/>
				</div>
			</UInput>
			<p
				v-if="invalid"
				class="px-2.5 pb-2 text-xs text-error"
			>
				Link harus diawali https:// atau mailto:
			</p>
		</template>
	</UPopover>
</template>
