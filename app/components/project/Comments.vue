<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import type { ProjectComment } from '~/types/project'

const props = defineProps<{
	projectId: number
	projectOwnerId: string | number
}>()

const { loggedIn, user } = useUserSession()
const route = useRoute()
const toast = useToast()

const { data, status, error, refresh } = await useFetch<{ comments: ProjectComment[] }>(
	() => `/api/projects/${props.projectId}/comments`,
	{ key: `project-comments-${props.projectId}` }
)
const comments = computed(() => data.value?.comments || [])

const state = reactive({ body: '' })
const sending = ref(false)
const deletingId = ref<number | null>(null)

const currentUserId = computed(() => (user.value as { id?: string } | null)?.id)
const isAdminUser = computed(() => (user.value as { role?: string } | null)?.role === 'admin')

function canDelete(comment: ProjectComment) {
	if (!currentUserId.value) return false
	return comment.author.id === currentUserId.value
		|| String(props.projectOwnerId) === currentUserId.value
		|| isAdminUser.value
}

async function onSubmit(event: FormSubmitEvent<{ body: string }>) {
	try {
		sending.value = true
		await $fetch(`/api/projects/${props.projectId}/comments`, {
			method: 'POST',
			body: { body: event.data.body }
		})
		state.body = ''
		await refresh()
	} catch (err: unknown) {
		const errorResponse = err as { data?: { statusMessage?: string } }
		toast.add({
			title: 'Komentar belum terkirim',
			description: errorResponse.data?.statusMessage || 'Periksa koneksimu lalu kirim lagi.',
			color: 'error'
		})
	} finally {
		sending.value = false
	}
}

async function removeComment(comment: ProjectComment) {
	try {
		deletingId.value = comment.id
		await $fetch(`/api/projects/${props.projectId}/comments/${comment.id}`, { method: 'DELETE' })
		await refresh()
	} catch (err: unknown) {
		const errorResponse = err as { data?: { statusMessage?: string } }
		toast.add({
			title: 'Komentar belum terhapus',
			description: errorResponse.data?.statusMessage || 'Coba lagi sebentar.',
			color: 'error'
		})
	} finally {
		deletingId.value = null
	}
}
</script>

<template>
	<section
		aria-labelledby="judul-komentar"
		class="flex flex-col gap-5"
	>
		<h2
			id="judul-komentar"
			class="text-xl font-bold text-highlighted"
		>
			Komentar
			<span
				v-if="comments.length"
				class="font-normal text-muted"
			>({{ comments.length }})</span>
		</h2>

		<UForm
			v-if="loggedIn"
			:schema="projectCommentSchema"
			:state="state"
			class="flex flex-col gap-2"
			@submit="onSubmit"
		>
			<UFormField
				name="body"
				label="Tulis komentar"
				:ui="{ label: 'sr-only' }"
			>
				<UTextarea
					v-model="state.body"
					placeholder="Apa yang menarik dari karya ini? Masukan yang membangun juga boleh."
					:rows="3"
					autoresize
					:maxrows="8"
					class="w-full"
				/>
			</UFormField>
			<div class="flex justify-end">
				<UButton
					type="submit"
					label="Kirim Komentar"
					icon="i-lucide-send"
					:loading="sending"
				/>
			</div>
		</UForm>

		<UAlert
			v-else
			color="neutral"
			variant="subtle"
			icon="i-lucide-message-circle"
			title="Mau ikut berkomentar?"
			description="Masuk dulu supaya kreatornya tahu siapa yang memberi masukan."
			:actions="[{ label: 'Masuk', to: `/login?redirect=${encodeURIComponent(route.fullPath)}`, color: 'neutral', variant: 'outline' }]"
		/>

		<div
			v-if="status === 'pending' && !comments.length"
			class="flex flex-col gap-4"
		>
			<USkeleton
				v-for="n in 2"
				:key="n"
				class="h-16 w-full"
			/>
		</div>

		<UAlert
			v-else-if="error"
			color="error"
			variant="subtle"
			icon="i-lucide-triangle-alert"
			title="Komentar gagal dimuat"
			description="Server tidak merespons. Coba muat ulang."
			:actions="[{ label: 'Coba Lagi', color: 'error', variant: 'outline', onClick: () => refresh() }]"
		/>

		<p
			v-else-if="!comments.length"
			class="text-sm text-muted"
		>
			Belum ada komentar. Jadilah yang pertama memberi tanggapan.
		</p>

		<ul
			v-else
			class="flex flex-col divide-y divide-default"
		>
			<li
				v-for="comment in comments"
				:key="comment.id"
				class="flex gap-3 py-4 first:pt-0"
			>
				<UAvatar
					:src="comment.author.avatarUrl || undefined"
					:alt="comment.author.name"
					size="md"
				/>
				<div class="min-w-0 flex-1">
					<div class="flex flex-wrap items-baseline gap-x-2">
						<span class="font-medium text-highlighted">{{ comment.author.name }}</span>
						<time
							:datetime="new Date(comment.createdAt).toISOString()"
							class="text-xs text-muted"
						>{{ waktuRelatif(comment.createdAt) }}</time>
					</div>
					<p class="mt-1 text-sm text-default whitespace-pre-line break-words">
						{{ comment.body }}
					</p>
				</div>
				<UButton
					v-if="canDelete(comment)"
					icon="i-lucide-trash-2"
					color="neutral"
					variant="ghost"
					size="sm"
					:loading="deletingId === comment.id"
					:aria-label="`Hapus komentar dari ${comment.author.name}`"
					@click="removeComment(comment)"
				/>
			</li>
		</ul>
	</section>
</template>
