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

const { user } = useSessionView()
const { toggleLike, likeState } = useProjectLike()
const like = computed(() => likeState(props.project))

const detailPath = computed(() => `/projek/${props.project.slug}`)
const isOwn = computed(() => (user.value as { id?: string } | null)?.id === String(props.project.userId))
const category = computed(() => categoryLabel(props.project.category))

// Tombol panah menuju demo, lalu kode sumber, lalu profil kreator, sesuai yang tersedia.
const quickLink = computed(() => {
	const { demoUrl, repoUrl, author, title } = props.project
	if (demoUrl) return { to: demoUrl, external: true, icon: 'i-lucide-arrow-up-right', label: `Buka demo ${title}` }
	if (repoUrl) return { to: repoUrl, external: true, icon: 'i-lucide-arrow-up-right', label: `Lihat kode sumber ${title}` }
	if (author?.username) return { to: `/${author.username}`, external: false, icon: 'i-lucide-arrow-right', label: `Lihat profil @${author.username}` }
	return null
})

const actionItems = computed(() => [
	[
		{
			label: 'Lihat Halaman Proyek',
			icon: 'i-lucide-external-link',
			to: detailPath.value
		},
		{
			label: 'Edit Proyek',
			icon: 'i-lucide-pencil',
			to: `/dashboard/projects/${props.project.id}`
		}
	],
	[
		{
			label: 'Hapus Proyek',
			icon: 'i-lucide-trash-2',
			color: 'error' as const,
			onSelect: () => emit('delete', props.project.id)
		}
	]
])
</script>

<template>
	<article class="group flex flex-col overflow-hidden rounded-xl border border-default/70 bg-elevated/40 transition-all duration-200 hover:border-primary/50 hover:bg-elevated hover:shadow-md">
		<div class="relative aspect-video overflow-hidden bg-muted/20">
			<!-- Lapisan hover hanya pelengkap: judul dan kreator selalu tampil di baris bawah untuk layar sentuh. -->
			<NuxtLink
				:to="detailPath"
				class="relative block size-full outline-primary/40 outline-offset-2 focus-visible:outline-3"
				:aria-label="`${project.title}, ${category}`"
			>
				<NuxtImg
					v-if="project.thumbnailUrl"
					:src="fileSrc(project.thumbnailUrl)"
					alt=""
					class="absolute inset-0 size-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04] motion-reduce:transition-none"
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
					class="pointer-events-none absolute inset-0 flex items-end justify-between gap-4 bg-linear-to-t from-black/80 via-black/25 to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100 motion-reduce:transition-none"
					aria-hidden="true"
				>
					<!-- pe-12 memberi ruang untuk tombol panah yang berada di atas lapisan ini. -->
					<span class="flex min-w-0 flex-col gap-0.5 pe-12">
						<span class="text-xs font-medium text-white/85">{{ category }}</span>
						<span class="truncate text-lg font-bold text-white">{{ project.title }}</span>
					</span>
				</span>
			</NuxtLink>

			<!-- Di luar NuxtLink karena tautan tidak boleh bersarang. Di layar sentuh selalu tampil karena tidak ada hover. -->
			<UTooltip
				v-if="quickLink"
				:text="quickLink.label"
			>
				<UButton
					:to="quickLink.to"
					:target="quickLink.external ? '_blank' : undefined"
					:icon="quickLink.icon"
					color="neutral"
					variant="solid"
					size="sm"
					class="absolute right-3 bottom-3 rounded-full opacity-0 shadow-sm transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100 motion-reduce:transition-none [@media(hover:none)]:opacity-100"
					:aria-label="quickLink.label"
				/>
			</UTooltip>

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

		<!-- Judul di baris pertama, kreator di bawahnya dengan padding dan kontras yang seimbang -->
		<div class="flex flex-1 flex-col justify-between gap-2.5 p-3.5 sm:p-4">
			<div class="flex items-start justify-between gap-3">
				<h3 class="min-w-0 flex-1 truncate font-semibold text-base text-highlighted">
					<NuxtLink
						:to="detailPath"
						class="rounded-sm outline-primary/25 transition-colors hover:text-primary focus-visible:outline-3"
						tabindex="-1"
					>
						{{ project.title }}
					</NuxtLink>
				</h3>

				<div class="-mt-0.5 flex shrink-0 items-center">
					<UButton
						v-if="!editable && !isOwn"
						:icon="like.liked ? 'i-tabler-heart-filled' : 'i-tabler-heart'"
						:label="String(like.count)"
						:color="like.liked ? 'primary' : 'neutral'"
						variant="ghost"
						size="xs"
						:aria-pressed="like.liked"
						:aria-label="like.liked ? `Tarik apresiasi untuk ${project.title}` : `Beri apresiasi untuk ${project.title}`"
						@click="toggleLike(project, $event)"
					/>
					<span
						v-else
						class="inline-flex items-center gap-1 px-1.5 text-xs text-muted"
						:aria-label="`${like.count} apresiasi`"
					>
						<UIcon
							name="i-tabler-heart"
							class="size-3.5"
						/>
						{{ like.count }}
					</span>
				</div>
			</div>

			<div
				v-if="!editable && project.author"
				class="flex min-w-0 items-center gap-2 pt-0.5"
			>
				<UAvatar
					:src="project.author.avatarUrl || undefined"
					:alt="project.author.username ? `@${project.author.username}` : project.author.name"
					size="3xs"
					class="shrink-0 ring-1 ring-default/60"
				/>
				<NuxtLink
					v-if="project.author.username"
					:to="`/${project.author.username}`"
					class="truncate rounded-sm text-xs text-muted outline-primary/25 transition-colors hover:text-primary focus-visible:outline-3"
				>
					@{{ project.author.username }}
				</NuxtLink>
				<span
					v-else
					class="truncate text-xs text-muted"
				>{{ project.author.name }}</span>
			</div>

			<span
				v-else-if="editable"
				class="pt-0.5 text-xs text-muted"
			>{{ formatTanggal(project.createdAt) }}</span>
		</div>
	</article>
</template>
