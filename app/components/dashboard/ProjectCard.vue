<script setup lang="ts">
import type { ProjectItem } from '~/types/project'

const props = withDefaults(defineProps<{
	project: ProjectItem
	editable?: boolean
}>(), {
	editable: false
})

const emit = defineEmits<{
	delete: [id: number]
}>()

const { user } = useUserSession()
const { toggleLike, isPending } = useProjectLike()

const detailPath = computed(() => `/projek/${props.project.slug}`)
const isOwn = computed(() => (user.value as { id?: string } | null)?.id === String(props.project.userId))
const category = computed(() => categoryLabel(props.project.category))

const actionItems = computed(() => [
	[
		{
			label: 'Lihat Halaman Karya',
			icon: 'i-lucide-external-link',
			to: detailPath.value
		},
		{
			label: 'Edit Karya',
			icon: 'i-lucide-pencil',
			to: `/dashboard/projects/${props.project.id}`
		}
	],
	[
		{
			label: 'Hapus Karya',
			icon: 'i-lucide-trash-2',
			color: 'error' as const,
			onSelect: () => emit('delete', props.project.id)
		}
	]
])
</script>

<template>
	<article class="group flex flex-col gap-3">
		<div class="relative">
			<!-- Lapisan hover hanya pelengkap: judul dan kreator selalu tampil di baris bawah untuk layar sentuh. -->
			<NuxtLink
				:to="detailPath"
				class="relative block aspect-4/3 overflow-hidden rounded-xl bg-elevated outline-primary/40 outline-offset-2 focus-visible:outline-3"
				:aria-label="`${project.title}, ${category}`"
			>
				<NuxtImg
					v-if="project.thumbnailUrl"
					:src="project.thumbnailUrl"
					alt=""
					class="absolute inset-0 size-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03] motion-reduce:transition-none"
					loading="lazy"
					preset="sampul"
					sizes="640px sm:50vw lg:33vw"
				/>
				<span
					v-else
					class="flex size-full items-center justify-center px-6 text-center text-sm text-muted"
				>
					{{ category }}
				</span>

				<span
					class="pointer-events-none absolute inset-0 flex items-end justify-between gap-4 bg-linear-to-t from-black/80 via-black/25 to-transparent p-5 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100 motion-reduce:transition-none"
					aria-hidden="true"
				>
					<span class="flex min-w-0 flex-col gap-1">
						<span class="text-xs font-medium text-white/85">{{ category }}</span>
						<span class="truncate text-xl font-bold text-white">{{ project.title }}</span>
					</span>
					<UIcon
						name="i-lucide-arrow-up-right"
						class="size-7 shrink-0 text-white"
					/>
				</span>
			</NuxtLink>

			<div class="pointer-events-none absolute top-3 left-3 flex flex-wrap gap-1.5">
				<span
					v-if="project.isFeatured"
					class="inline-flex items-center gap-1 rounded-sm bg-mango-100 px-1.5 py-0.5 text-xs font-semibold text-mango-900 shadow-xs"
				>
					<UIcon
						name="i-lucide-award"
						class="size-3"
					/>
					Pilihan Kurator
				</span>
				<UBadge
					v-if="editable && !project.isPublished"
					label="Draf"
					color="neutral"
					variant="solid"
					size="sm"
				/>
			</div>

			<UDropdownMenu
				v-if="editable"
				:items="actionItems"
			>
				<UButton
					icon="i-lucide-ellipsis-vertical"
					color="neutral"
					variant="solid"
					size="sm"
					class="absolute top-3 right-3"
					:aria-label="`Opsi untuk ${project.title}`"
				/>
			</UDropdownMenu>
		</div>

		<div class="flex items-center justify-between gap-3">
			<div class="flex min-w-0 items-center gap-2">
				<h3 class="truncate font-semibold text-highlighted">
					<NuxtLink
						:to="detailPath"
						class="rounded-sm outline-primary/25 hover:text-primary focus-visible:outline-3"
						tabindex="-1"
					>
						{{ project.title }}
					</NuxtLink>
				</h3>

				<template v-if="!editable && project.author">
					<span class="shrink-0 text-xs text-muted">oleh</span>
					<UAvatar
						:src="project.author.avatarUrl || undefined"
						:alt="project.author.name"
						size="2xs"
						class="shrink-0"
					/>
					<NuxtLink
						v-if="project.author.username"
						:to="`/${project.author.username}`"
						class="truncate rounded-sm text-sm font-medium text-default underline decoration-(--ui-border-accented) underline-offset-4 outline-primary/25 hover:text-primary hover:decoration-primary focus-visible:outline-3"
					>
						{{ project.author.name }}
					</NuxtLink>
					<span
						v-else
						class="truncate text-sm font-medium text-default"
					>{{ project.author.name }}</span>
				</template>

				<span
					v-else-if="editable"
					class="shrink-0 text-xs text-muted"
				>{{ formatTanggal(project.createdAt) }}</span>
			</div>

			<div class="flex shrink-0 items-center">
				<UButton
					v-if="!editable && !isOwn"
					:icon="project.likedByMe ? 'i-tabler-heart-filled' : 'i-tabler-heart'"
					:label="String(project.likeCount || 0)"
					:color="project.likedByMe ? 'primary' : 'neutral'"
					variant="ghost"
					size="sm"
					:aria-pressed="project.likedByMe"
					:aria-label="project.likedByMe ? `Tarik apresiasi untuk ${project.title}` : `Beri apresiasi untuk ${project.title}`"
					:loading="isPending(project.id)"
					@click="toggleLike(project, $event)"
				/>
				<span
					v-else
					class="inline-flex items-center gap-1 px-2 text-xs text-muted"
					:aria-label="`${project.likeCount || 0} apresiasi`"
				>
					<UIcon
						name="i-tabler-heart"
						class="size-4"
					/>
					{{ project.likeCount || 0 }}
				</span>
			</div>
		</div>
	</article>
</template>
