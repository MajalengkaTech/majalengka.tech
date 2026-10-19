<script setup lang="ts">
import type { ProjectItem } from '~/types/project'

defineProps<{
	projects: ProjectItem[]
}>()

// Peringkat pertama memakai aksen Kuning Mangga, sisanya netral.
const rankClass = (index: number) => index === 0
	? 'bg-mango-300 text-brand-900'
	: 'bg-default/90 text-highlighted ring-1 ring-default'
</script>

<template>
	<ol class="grid grid-cols-1 gap-6 md:grid-cols-3">
		<li
			v-for="(project, index) in projects"
			:key="project.id"
			data-reveal
		>
			<NuxtLink
				:to="`/projek/${project.slug}`"
				class="group flex h-full flex-col gap-3 rounded-xl outline-primary/25 focus-visible:outline-3"
				:aria-label="`Peringkat ${index + 1}: ${project.title}, ${project.likeCount || 0} apresiasi`"
			>
				<div class="relative aspect-video overflow-hidden rounded-xl border border-default bg-elevated">
					<NuxtImg
						v-if="project.thumbnailUrl"
						:src="fileSrc(project.thumbnailUrl)"
						:alt="project.title"
						class="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transition-none"
						sizes="100vw md:400px"
						preset="sampul"
						loading="lazy"
					/>
					<div
						v-else
						class="flex size-full items-center justify-center text-sm text-muted"
					>
						{{ categoryLabel(project.category) }}
					</div>
					<span
						class="absolute left-3 top-3 flex size-10 items-center justify-center rounded-full text-lg font-bold tabular-nums shadow-sm"
						:class="rankClass(index)"
						aria-hidden="true"
					>
						{{ index + 1 }}
					</span>
				</div>

				<div class="flex min-w-0 items-start justify-between gap-3">
					<div class="min-w-0">
						<p class="truncate font-semibold text-highlighted group-hover:text-primary">
							{{ project.title }}
						</p>
						<p class="truncate text-sm text-muted">
							{{ project.author?.name || categoryLabel(project.category) }}
						</p>
					</div>
					<span class="flex shrink-0 items-center gap-1 text-sm text-muted">
						<UIcon
							name="i-lucide-heart"
							class="size-4 text-primary"
						/>
						<span class="font-semibold tabular-nums text-highlighted">{{ project.likeCount || 0 }}</span>
					</span>
				</div>
			</NuxtLink>
		</li>
	</ol>
</template>
