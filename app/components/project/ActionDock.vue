<script setup lang="ts">
import type { ProjectComment, ProjectDetail } from '~/types/project'

const props = defineProps<{
	project: ProjectDetail
	// Diisi halaman: true selama baris aksi di bawah judul, kolom komentar, atau footer masih terlihat.
	hidden: boolean
}>()

const emit = defineEmits<{
	share: []
	delete: []
}>()

const { toggleLike, likeState } = useProjectLike()
const like = computed(() => likeState(props.project))
const canLike = computed(() => !props.project.isOwner && props.project.isPublished)

// Jumlah komentar dibaca dari data yang sudah diambil ProjectComments, jadi tidak ada request tambahan.
const { data: commentsData } = useNuxtData<{ comments: ProjectComment[] }>(`project-comments-${props.project.id}`)
const commentCount = computed(() => commentsData.value?.comments.length ?? props.project.commentCount ?? 0)

function goToComments() {
	document.getElementById('judul-komentar')?.scrollIntoView({ behavior: motionAllowed() ? 'smooth' : 'auto', block: 'start' })
}
</script>

<template>
	<Transition
		enter-active-class="transition duration-200 ease-out motion-reduce:transition-none"
		enter-from-class="translate-y-4 opacity-0"
		leave-active-class="transition duration-150 ease-in motion-reduce:transition-none"
		leave-to-class="translate-y-4 opacity-0"
	>
		<div
			v-if="!hidden"
			class="pointer-events-none fixed inset-x-0 bottom-4 z-30 flex justify-center px-4 pb-[env(safe-area-inset-bottom)]"
		>
			<nav
				aria-label="Aksi proyek"
				class="pointer-events-auto flex items-center gap-0.5 rounded-full border border-default bg-default/90 p-1.5 shadow-lg backdrop-blur"
			>
				<UTooltip :text="canLike ? (like.liked ? 'Tarik apresiasi' : 'Beri apresiasi') : 'Apresiasi'">
					<UButton
						:icon="like.liked ? 'i-tabler-heart-filled' : 'i-tabler-heart'"
						:label="String(like.count)"
						:color="like.liked ? 'primary' : 'neutral'"
						:variant="like.liked ? 'soft' : 'ghost'"
						:disabled="!canLike"
						:aria-pressed="canLike ? like.liked : undefined"
						:aria-label="`${like.count} apresiasi`"
						class="rounded-full tabular-nums"
						@click="toggleLike(project, $event)"
					/>
				</UTooltip>

				<UTooltip text="Ke komentar">
					<UButton
						icon="i-lucide-message-circle"
						:label="String(commentCount)"
						color="neutral"
						variant="ghost"
						:aria-label="`${commentCount} komentar, lompat ke kolom komentar`"
						class="rounded-full tabular-nums"
						@click="goToComments"
					/>
				</UTooltip>

				<UTooltip
					v-if="project.demoUrl"
					text="Coba demo"
				>
					<UButton
						icon="i-lucide-arrow-up-right"
						:to="project.demoUrl"
						target="_blank"
						rel="noopener"
						color="neutral"
						variant="ghost"
						aria-label="Coba demo"
						class="rounded-full"
					/>
				</UTooltip>

				<UTooltip text="Bagikan">
					<UButton
						icon="i-lucide-share-2"
						color="neutral"
						variant="ghost"
						aria-label="Bagikan proyek"
						class="rounded-full"
						@click="emit('share')"
					/>
				</UTooltip>

				<template v-if="project.canManage">
					<USeparator
						orientation="vertical"
						class="mx-1 h-6"
					/>
					<UTooltip text="Edit proyek">
						<UButton
							icon="i-lucide-pencil"
							:to="`/dashboard/projects/${project.id}`"
							color="neutral"
							variant="ghost"
							aria-label="Edit proyek"
							class="rounded-full"
						/>
					</UTooltip>
					<UTooltip text="Hapus proyek">
						<UButton
							icon="i-lucide-trash-2"
							color="error"
							variant="ghost"
							aria-label="Hapus proyek"
							class="rounded-full"
							@click="emit('delete')"
						/>
					</UTooltip>
				</template>
			</nav>
		</div>
	</Transition>
</template>
