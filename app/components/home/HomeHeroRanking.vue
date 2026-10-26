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
		data-ranking
	>
		<h2
			id="judul-peringkat-hero"
			class="flex items-center gap-2 font-semibold text-highlighted"
		>
			<UIcon
				name="i-lucide-trophy"
				class="size-5 text-primary"
				data-trophy
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
				data-rank-row
				:style="{ '--rank-index': index }"
			>
				<NuxtLink
					:to="`/projek/${project.slug}`"
					class="group flex items-center gap-3 rounded-sm py-3 outline-primary/40 focus-visible:outline-3"
					:aria-label="`Peringkat ${index + 1}: ${project.title} oleh ${project.author?.name}, ${project.likeCount || 0} apresiasi`"
				>
					<!-- Juara 1 memakai Kuning Mangga, satu-satunya aksen mangga di hero (DESIGN.md: satu momen aksen per layar). -->
					<span
						class="relative inline-flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full text-sm font-bold tabular-nums transition-transform duration-200 group-hover:scale-110"
						:class="index === 0 ? 'bg-mango-300 text-brand-900' : 'bg-elevated text-muted'"
						:data-rank-first="index === 0 ? '' : undefined"
						aria-hidden="true"
					>
						{{ index + 1 }}
					</span>
					<span class="min-w-0 flex-1 transition-transform duration-200 group-hover:translate-x-0.5">
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
							data-heart
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
			class="group mt-2 px-0"
			:ui="{ trailingIcon: 'transition-transform duration-200 group-hover:translate-x-1' }"
		/>
	</section>
</template>

<style scoped>
/* Animasi ringan: hanya transform dan opacity, dan seluruhnya mati bila pengunjung memilih reduced motion. */
@media (prefers-reduced-motion: no-preference) {
	[data-rank-row] {
		animation: rank-in 0.45s cubic-bezier(0.16, 1, 0.3, 1) both;
		animation-delay: calc(0.12s + var(--rank-index, 0) * 0.08s);
	}

	[data-trophy] {
		transform-origin: 50% 90%;
		animation: trophy-wiggle 0.7s ease-in-out 0.6s;
	}

	[data-ranking]:hover [data-trophy] {
		animation: trophy-wiggle 0.7s ease-in-out;
	}

	/* Kilau tipis yang melintas di lencana juara 1. */
	[data-rank-first]::after {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(115deg, transparent 35%, rgb(255 255 255 / 0.55) 50%, transparent 65%);
		transform: translateX(-120%);
		animation: rank-shine 4.5s ease-in-out 1.2s infinite;
	}

	a:hover [data-heart] {
		animation: heart-beat 0.6s ease-in-out;
	}
}

@keyframes rank-in {
	from { opacity: 0; transform: translateX(-8px); }
	to { opacity: 1; transform: translateX(0); }
}

@keyframes trophy-wiggle {
	0%, 100% { transform: rotate(0deg); }
	20% { transform: rotate(-12deg); }
	40% { transform: rotate(10deg); }
	60% { transform: rotate(-6deg); }
	80% { transform: rotate(3deg); }
}

@keyframes rank-shine {
	0% { transform: translateX(-120%); }
	30%, 100% { transform: translateX(120%); }
}

@keyframes heart-beat {
	0%, 100% { transform: scale(1); }
	30% { transform: scale(1.3); }
	55% { transform: scale(0.95); }
	75% { transform: scale(1.1); }
}
</style>
