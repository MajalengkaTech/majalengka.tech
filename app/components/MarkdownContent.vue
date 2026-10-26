<script setup lang="ts">
import { MarkdownDocument } from '@comark/vue'

// Tag di dokumen otomatis dipetakan ke komponen Prose Nuxt UI (ProseCallout, ProsePre, ...). Dokumen sudah
// disaring di server, jadi di sini tidak ada HTML mentah yang disisipkan.
defineProps<{ value: RenderedMarkdown }>()
</script>

<template>
	<!-- MarkdownDocument memakai setup async; Suspense di sini supaya tetap tampil saat dipasang di luar halaman, misalnya di slideover pratinjau. -->
	<Suspense>
		<MarkdownDocument
			:value="value"
			class="break-words"
		/>
	</Suspense>
</template>
