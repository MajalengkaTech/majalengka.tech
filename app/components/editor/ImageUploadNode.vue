<script setup lang="ts">
import type { NodeViewProps } from '@tiptap/vue-3'
import { NodeViewWrapper } from '@tiptap/vue-3'

const props = defineProps<NodeViewProps>()

// Folder dan proyek datang dari opsi ekstensi, supaya gambar proyek orang lain yang diedit admin masuk ke folder pemiliknya.
const options = props.extension.options as { folder: 'tutorial' | 'projek', projectId?: number }
const { uploadImage } = useImageUpload(() => options.projectId, { folder: options.folder })
const loading = ref(false)
const failed = ref(false)

async function onFiles(value: File | File[] | null | undefined) {
	const files = (Array.isArray(value) ? value : value ? [value] : []).filter(Boolean)
	if (!files.length) return
	loading.value = true
	failed.value = false
	const uploaded: { src: string, alt: string }[] = []
	try {
		for (const file of files) {
			const url = await uploadImage(file)
			if (url) uploaded.push({ src: url, alt: file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ') })
		}
	} finally {
		loading.value = false
	}
	if (!uploaded.length) {
		failed.value = true
		return
	}
	const pos = props.getPos()
	if (typeof pos !== 'number') return
	// Kotak unggah diganti gambar-gambar yang berhasil diunggah, berurutan sesuai pilihan.
	props.editor.chain().focus()
		.deleteRange({ from: pos, to: pos + 1 })
		.insertContentAt(pos, uploaded.map(image => ({ type: 'image', attrs: image })))
		.run()
}
</script>

<template>
	<NodeViewWrapper>
		<UFileUpload
			accept="image/png,image/jpeg,image/webp,image/gif"
			multiple
			label="Taruh gambar di sini atau klik untuk memilih"
			:description="failed ? 'Gambar belum terunggah. Coba lagi dengan JPG, PNG, WebP, atau GIF maksimal 8 MB.' : 'JPG, PNG, WebP, atau GIF, maksimal 8 MB per gambar. Bisa beberapa sekaligus.'"
			:preview="false"
			:disabled="loading"
			class="min-h-40"
			:ui="{ description: failed ? 'text-error' : '' }"
			@update:model-value="onFiles"
		>
			<template #leading>
				<UAvatar
					:icon="failed ? 'i-lucide-alert-circle' : loading ? 'i-lucide-loader-circle' : 'i-lucide-image-plus'"
					size="xl"
					:ui="{ icon: [loading && 'animate-spin', failed && 'text-error'] }"
				/>
			</template>
		</UFileUpload>
	</NodeViewWrapper>
</template>
