<script setup lang="ts">
import type { ProjectItem } from '~/types/project'

defineProps<{
	project: ProjectItem
}>()
</script>

<template>
	<NuxtLink
		:to="`/projek/${project.slug}`"
		class="group flex flex-col gap-2 rounded-md outline-primary/25 focus-visible:outline-3"
	>
		<div class="aspect-video overflow-hidden rounded-md border border-default bg-elevated">
			<NuxtImg
				v-if="project.thumbnailUrl"
				:src="project.thumbnailUrl"
				:alt="project.title"
				class="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transition-none"
				sizes="320px sm:33vw lg:280px"
				preset="sampul"
				loading="lazy"
			/>
			<div
				v-else
				class="flex size-full items-center justify-center text-sm text-muted"
			>
				{{ categoryLabel(project.category) }}
			</div>
		</div>
		<div class="min-w-0">
			<p class="truncate font-semibold text-highlighted group-hover:text-primary">
				{{ project.title }}
			</p>
			<p class="truncate text-sm text-muted">
				{{ project.tagline || categoryLabel(project.category) }}
			</p>
		</div>
	</NuxtLink>
</template>
