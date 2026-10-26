<script setup lang="ts">
import ChatMarkdown from './ChatMarkdown'

// Daftar pesan Maja; dipakai panel samping dan layar penuh.
const { messages, status } = useMajaChat()

function text(message: unknown) {
	return majaMessageText(message as MajaChatMessage)
}

function meta(message: unknown) {
	return (message as MajaChatMessage).metadata
}
</script>

<template>
	<UChatMessages
		:messages="messages"
		:status="status"
		:user="{ side: 'right', variant: 'soft' }"
		:assistant="{ side: 'left', variant: 'naked' }"
	>
		<template #content="{ message }">
			<p
				v-if="message.role === 'user'"
				class="whitespace-pre-wrap"
			>
				{{ text(message) }}
			</p>
			<div
				v-else
				class="flex flex-col gap-3"
			>
				<ChatMarkdown
					v-if="text(message)"
					:value="text(message)"
					class="text-sm/6"
				/>
				<UAlert
					v-if="meta(message)?.error"
					color="error"
					variant="subtle"
					icon="i-lucide-circle-alert"
					:description="meta(message)?.error"
				/>
				<div
					v-if="meta(message)?.sources?.length && text(message)"
					class="flex flex-wrap gap-1.5"
				>
					<UButton
						v-for="source in meta(message)?.sources"
						:key="source.url"
						:label="source.title"
						:to="source.url"
						icon="i-lucide-file-text"
						color="neutral"
						variant="outline"
						size="xs"
						class="max-w-full"
						:ui="{ label: 'truncate' }"
					/>
				</div>
			</div>
		</template>
		<template #indicator>
			<UChatShimmer
				text="Mencari di Majalengka Tech..."
				class="text-sm"
			/>
		</template>
	</UChatMessages>
</template>
