<script setup lang="ts">
import type { ProjectItem } from '~/types/project'

defineProps<{
	projects: ProjectItem[]
}>()
</script>

<template>
	<section
		class="w-full rounded-lg border border-default bg-default/80 p-4 shadow-sm backdrop-blur-sm sm:p-6"
		aria-labelledby="judul-peringkat-hero"
	>
		<h2
			id="judul-peringkat-hero"
			class="flex items-center gap-2 font-semibold text-highlighted"
		>
			<UIcon
				name="i-lucide-trophy"
				class="size-5 text-primary"
			/>
			Peringkat apresiasi
		</h2>
		<p class="mt-1 text-sm text-muted">
			Proyek yang paling banyak diapresiasi sesama anggota.
		</p>

		<ol class="mt-4 divide-y divide-default">
			<li
				v-for="(project, index) in projects"
				:key="project.id"
			>
				<NuxtLink
					:to="`/projek/${project.slug}`"
					class="group flex items-center gap-3 rounded-sm py-3 outline-primary/40 focus-visible:outline-3"
					:aria-label="`Peringkat ${index + 1}: ${project.title} oleh ${project.author?.name}, ${project.likeCount || 0} apresiasi`"
				>
					<!-- Juara 1 memakai Kuning Mangga, satu-satunya aksen mangga di hero (DESIGN.md: satu momen aksen per layar). -->
					<span
						class="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold tabular-nums"
						:class="index === 0 ? 'bg-mango-300 text-brand-900' : 'bg-elevated text-muted'"
						aria-hidden="true"
					>
						{{ index + 1 }}
					</span>
					<span class="min-w-0 flex-1">
						<span class="block truncate font-semibold text-highlighted group-hover:text-primary">
							{{ project.title }}
						</span>
						<span class="block truncate text-sm text-muted">
							{{ project.author?.name }}
						</span>
					</span>
					<span
						class="inline-flex shrink-0 items-center gap-1 text-sm font-medium tabular-nums text-default"
						aria-hidden="true"
					>
						<UIcon
							name="i-lucide-heart"
							class="size-4 text-primary"
						/>
						{{ project.likeCount || 0 }}
					</span>
				</NuxtLink>
			</li>
		</ol>

		<UButton
			to="/projek?urut=populer"
			label="Lihat Semua Proyek Terpopuler"
			color="neutral"
			variant="link"
			trailing-icon="i-lucide-arrow-right"
			class="mt-2 px-0"
		/>
	</section>
</template>
