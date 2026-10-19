<script setup lang="ts">
import type { ProjectItem } from '~/types/project'

defineProps<{
	projects: ProjectItem[]
}>()

// Podium: juara 1 memakai Kuning Mangga (aksen khas Majalengka Tech), lalu perak dan perunggu.
const MEDALS = [
	{ label: 'Juara 1', icon: 'i-lucide-crown', class: 'bg-mango-300 text-brand-900' },
	{ label: 'Juara 2', icon: 'i-lucide-medal', class: 'bg-slate-200 text-slate-900' },
	{ label: 'Juara 3', icon: 'i-lucide-medal', class: 'bg-orange-300 text-orange-950' }
]
</script>

<template>
	<ol class="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-5 lg:grid-rows-2">
		<li
			v-for="(project, index) in projects"
			:key="project.id"
			data-reveal
			:class="index === 0 ? 'lg:col-span-3 lg:row-span-2' : 'lg:col-span-2'"
		>
			<NuxtLink
				:to="`/projek/${project.slug}`"
				class="group relative block h-full overflow-hidden rounded-2xl border border-default bg-elevated outline-primary/25 transition-shadow hover:shadow-xl hover:ring-2 hover:ring-primary/50 focus-visible:outline-3"
				:class="index === 0 ? 'aspect-[4/3] lg:aspect-auto lg:min-h-[28rem]' : 'aspect-video lg:aspect-auto lg:min-h-52'"
				:aria-label="`${MEDALS[index]?.label}: ${project.title}, ${project.likeCount || 0} apresiasi`"
			>
				<NuxtImg
					v-if="project.thumbnailUrl"
					:src="fileSrc(project.thumbnailUrl)"
					:alt="project.title"
					class="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none"
					:sizes="index === 0 ? '100vw lg:720px' : '100vw lg:480px'"
					preset="sampul"
					loading="lazy"
				/>
				<div
					v-else
					class="absolute inset-0 flex items-center justify-center bg-linear-to-br from-primary/30 to-elevated text-muted"
				>
					{{ categoryLabel(project.category) }}
				</div>

				<!-- Gradasi gelap di bawah supaya teks putih selalu terbaca di atas gambar apa pun. -->
				<div
					class="absolute inset-0 bg-linear-to-t from-black/90 via-black/40 to-transparent"
					aria-hidden="true"
				/>

				<span
					v-if="MEDALS[index]"
					class="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold shadow-lg sm:left-4 sm:top-4"
					:class="MEDALS[index].class"
					aria-hidden="true"
				>
					<UIcon
						:name="MEDALS[index].icon"
						class="size-4"
					/>
					#{{ index + 1 }}
				</span>

				<span
					class="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1 text-sm font-semibold text-white backdrop-blur-sm sm:right-4 sm:top-4"
					aria-hidden="true"
				>
					<UIcon
						name="i-tabler-heart-filled"
						class="size-4 text-rose-400 transition-transform duration-300 group-hover:scale-125 motion-reduce:transition-none"
					/>
					<span class="tabular-nums">{{ project.likeCount || 0 }}</span>
				</span>

				<div class="absolute inset-x-0 bottom-0 flex flex-col gap-2 p-4 text-white sm:p-6">
					<p
						class="font-bold leading-tight text-balance"
						:class="index === 0 ? 'text-2xl sm:text-3xl' : 'line-clamp-2 text-lg'"
					>
						{{ project.title }}
					</p>
					<p
						v-if="index === 0 && project.tagline"
						class="line-clamp-2 max-w-xl text-sm text-white/80 sm:text-base"
					>
						{{ project.tagline }}
					</p>
					<div
						v-if="project.author"
						class="flex min-w-0 items-center gap-2 text-sm text-white/85"
					>
						<UAvatar
							:src="avatarSrc(project.author.avatarUrl, 64)"
							:alt="project.author.name"
							size="2xs"
							class="ring-1 ring-white/40"
						/>
						<span class="truncate">{{ project.author.name }}</span>
					</div>
				</div>
			</NuxtLink>
		</li>
	</ol>
</template>
