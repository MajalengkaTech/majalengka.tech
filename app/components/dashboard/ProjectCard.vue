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
	edit: [project: ProjectItem]
}>()

const parsedTags = computed(() => {
	if (!props.project.tags) return []
	return props.project.tags
		.split(',')
		.map(t => t.trim())
		.filter(Boolean)
})

const actionItems = computed(() => [
	[
		{
			label: 'Edit Projek',
			icon: 'i-lucide-pencil',
			onSelect: () => emit('edit', props.project)
		}
	],
	[
		{
			label: 'Hapus Projek',
			icon: 'i-lucide-trash-2',
			color: 'error' as const,
			onSelect: () => emit('delete', props.project.id)
		}
	]
])
</script>

<template>
	<UCard
		class="flex flex-col h-full overflow-hidden hover:border-primary/50 transition-all duration-200 group"
		:ui="{
			root: 'relative',
			header: 'p-0 sm:p-0',
			body: 'flex-1 flex flex-col p-4 sm:p-5'
		}"
	>
		<template #header>
			<div class="relative w-full aspect-video overflow-hidden bg-neutral-100 dark:bg-neutral-800/80 border-b border-default">
				<img
					v-if="project.thumbnailUrl"
					:src="project.thumbnailUrl"
					:alt="project.title"
					class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
					loading="lazy"
				>
				<div
					v-else
					class="w-full h-full flex flex-col items-center justify-center text-muted gap-2"
				>
					<UIcon
						name="i-lucide-code-xml"
						class="w-10 h-10 opacity-40"
					/>
					<span class="text-xs uppercase tracking-wider font-semibold opacity-60">Majalengka Tech Project</span>
				</div>

				<div class="absolute top-2 right-2 flex items-center gap-1.5">
					<UBadge
						v-if="editable"
						:color="project.isPublished ? 'success' : 'neutral'"
						variant="subtle"
						size="xs"
					>
						{{ project.isPublished ? 'Publik' : 'Draf' }}
					</UBadge>

					<UDropdownMenu
						v-if="editable"
						:items="actionItems"
					>
						<UButton
							icon="i-lucide-more-vertical"
							color="neutral"
							variant="solid"
							size="xs"
							class="rounded-full shadow-sm"
							aria-label="Opsi Projek"
						/>
					</UDropdownMenu>
				</div>
			</div>
		</template>

		<div class="flex-1 flex flex-col">
			<div class="flex items-start justify-between gap-2 mb-2">
				<h3 class="font-bold text-base sm:text-lg text-highlighted line-clamp-1 group-hover:text-primary transition-colors">
					{{ project.title }}
				</h3>
			</div>

			<p class="text-sm text-muted line-clamp-3 mb-4 flex-1">
				{{ project.description }}
			</p>

			<div
				v-if="parsedTags.length > 0"
				class="flex flex-wrap gap-1.5 mb-4"
			>
				<UBadge
					v-for="tag in parsedTags"
					:key="tag"
					color="neutral"
					variant="outline"
					size="xs"
					class="rounded-md"
				>
					{{ tag }}
				</UBadge>
			</div>

			<div
				v-if="project.author"
				class="flex items-center gap-2 pt-3 border-t border-default/60 mb-4"
			>
				<UAvatar
					:src="project.author.avatarUrl || undefined"
					:alt="project.author.name"
					size="xs"
				/>
				<span class="text-xs text-muted truncate">
					Oleh <strong class="text-highlighted font-medium">{{ project.author.name }}</strong>
				</span>
			</div>

			<div class="flex items-center gap-2 pt-2">
				<UButton
					v-if="project.demoUrl"
					label="Demo"
					icon="i-lucide-external-link"
					color="primary"
					variant="solid"
					size="xs"
					:to="project.demoUrl"
					target="_blank"
					class="flex-1 justify-center"
				/>
				<UButton
					v-if="project.repoUrl"
					label="Repo"
					icon="i-simple-icons-github"
					color="neutral"
					variant="outline"
					size="xs"
					:to="project.repoUrl"
					target="_blank"
					class="flex-1 justify-center"
				/>
			</div>
		</div>
	</UCard>
</template>
