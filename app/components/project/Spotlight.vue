<script setup lang="ts">
import type { ProjectItem } from '~/types/project'

defineProps<{
	project: ProjectItem
}>()
</script>

<template>
	<NuxtLink
		:to="`/projek/${project.slug}`"
		class="group grid overflow-hidden rounded-2xl border border-default bg-elevated/50 outline-primary/25 transition-shadow hover:shadow-xl hover:ring-2 hover:ring-primary/50 focus-visible:outline-3 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]"
		aria-labelledby="proyek-terpopuler"
	>
		<div class="aspect-video overflow-hidden bg-elevated md:aspect-auto md:min-h-64">
			<NuxtImg
				v-if="project.thumbnailUrl"
				:src="fileSrc(project.thumbnailUrl)"
				:alt="project.title"
				class="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transition-none"
				sizes="100vw md:640px"
				preset="sampul"
			/>
			<div
				v-else
				class="flex size-full items-center justify-center text-muted"
			>
				{{ categoryLabel(project.category) }}
			</div>
		</div>

		<div class="flex flex-col justify-center gap-4 p-6 sm:p-8">
			<UBadge
				label="Paling disukai"
				icon="i-lucide-heart"
				color="primary"
				variant="subtle"
				class="self-start"
			/>
			<div class="min-w-0">
				<h2
					id="proyek-terpopuler"
					class="text-2xl font-bold text-highlighted group-hover:text-primary sm:text-3xl"
				>
					{{ project.title }}
				</h2>
				<p class="mt-2 line-clamp-2 text-muted">
					{{ project.tagline || categoryLabel(project.category) }}
				</p>
			</div>

			<div class="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted">
				<span
					v-if="project.author"
					class="flex min-w-0 items-center gap-2"
				>
					<UAvatar
						:src="avatarSrc(project.author.avatarUrl, 64)"
						:alt="project.author.name"
						size="xs"
					/>
					<span class="truncate">{{ project.author.name }}</span>
				</span>
				<span class="flex items-center gap-1.5">
					<UIcon
						name="i-lucide-heart"
						class="size-4 text-primary"
					/>
					<strong class="tabular-nums text-highlighted">{{ project.likeCount || 0 }}</strong> apresiasi
				</span>
				<span
					v-if="project.commentCount"
					class="flex items-center gap-1.5"
				>
					<UIcon
						name="i-lucide-message-circle"
						class="size-4"
					/>
					<strong class="tabular-nums text-highlighted">{{ project.commentCount }}</strong> komentar
				</span>
			</div>
		</div>
	</NuxtLink>
</template>
