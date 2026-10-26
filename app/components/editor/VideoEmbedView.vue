<script setup lang="ts">
import { NodeViewWrapper, nodeViewProps } from '@tiptap/vue-3'

// Blok video: tempel link YouTube atau Vimeo, lalu pratinjaunya tampil di editor.
const props = defineProps(nodeViewProps)

const url = ref('')
const error = ref('')
const src = computed(() => videoEmbedUrl(props.node.attrs.src))

function apply() {
	const embed = videoEmbedUrl(url.value)
	if (!embed) {
		error.value = 'Link belum dikenali. Pakai link video YouTube (youtube.com/watch?v=... atau youtu.be/...) atau Vimeo.'
		return
	}
	error.value = ''
	props.updateAttributes({ src: embed })
}

function change() {
	url.value = ''
	props.updateAttributes({ src: null })
}
</script>

<template>
	<NodeViewWrapper
		class="my-4 rounded-md border border-default bg-elevated/40 p-3"
		data-type="video-embed"
	>
		<div
			contenteditable="false"
			class="flex flex-col gap-3"
		>
			<div class="flex items-center gap-2 text-xs text-muted">
				<UIcon
					name="i-lucide-video"
					class="size-4 shrink-0"
				/>
				<span class="font-medium text-toned">Video</span>
				<UButton
					v-if="src"
					label="Ganti video"
					icon="i-lucide-refresh-cw"
					color="neutral"
					variant="ghost"
					size="xs"
					class="ms-auto"
					@click="change"
				/>
			</div>

			<iframe
				v-if="src"
				:src="src"
				title="Pratinjau video"
				loading="lazy"
				allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
				allowfullscreen
				referrerpolicy="strict-origin-when-cross-origin"
				class="aspect-video w-full rounded-md border border-default"
			/>

			<form
				v-else
				class="flex flex-col gap-2 sm:flex-row"
				@submit.prevent="apply"
			>
				<UInput
					v-model="url"
					placeholder="Tempel link YouTube atau Vimeo"
					class="flex-1"
					aria-label="Link video"
				/>
				<UButton
					type="submit"
					label="Pasang Video"
					icon="i-lucide-check"
				/>
			</form>
			<p
				v-if="error"
				class="text-sm text-error"
				role="alert"
			>
				{{ error }}
			</p>
		</div>
	</NodeViewWrapper>
</template>
