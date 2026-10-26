<script setup lang="ts">
import type { FooterColumn } from '@nuxt/ui'

// Diambil setelah halaman tampil supaya footer tidak menahan render; angka disembunyikan bila datanya belum ada.
const { data: stats } = useFetch<{ visitors: number | null }>('/api/stats/visitors', {
	key: 'footer-visitors',
	server: false,
	lazy: true
})
const visitors = computed(() => stats.value?.visitors ? stats.value.visitors.toLocaleString('id-ID') : null)

const columns: FooterColumn[] = [{
	label: 'Jelajahi',
	children: [
		{ label: 'Showcase', to: '/projek' },
		{ label: 'Kreator', to: '/kreator' },
		{ label: 'Tutorial', to: '/tutorial' },
		{ label: 'Pamerkan Proyekmu', to: '/dashboard/projects/new' },
		{ label: 'Tentang', to: '/tentang' }
	]
}, {
	label: 'Panduan',
	children: [
		{ label: 'Mengenal Majalengka Tech', to: '/docs/getting-started' },
		{ label: 'Pamerkan proyek', to: '/docs/getting-started/pamerkan-karya' },
		{ label: 'Profil kreator', to: '/docs/getting-started/profil-kreator' },
		{ label: 'Kontribusi kode', to: '/docs/kontribusi' }
	]
}, {
	label: 'Ikuti',
	children: [
		{ label: 'Changelog', to: '/changelog' },
		{ label: 'GitHub', to: 'https://github.com/majalengkatech', target: '_blank' }
	]
}]
</script>

<template>
	<USeparator
		class="h-px"
		icon="i-lucide-code-xml"
	/>

	<UFooter
		:ui="{
			top: 'border-b border-default py-8 lg:py-12',
			root: 'bg-default'
		}"
	>
		<template #top>
			<UContainer>
				<UFooterColumns :columns="columns">
					<template #left>
						<div class="flex max-w-xs flex-col gap-3">
							<NuxtLink
								to="/"
								class="inline-flex items-center gap-2"
								aria-label="Majalengka Tech"
							>
								<Logo class="size-6" />
								<span class="font-semibold text-highlighted">Majalengka Tech</span>
							</NuxtLink>
							<p class="text-sm text-muted">
								Tempat kreator Majalengka memamerkan proyek mereka.
							</p>
							<UBadge
								v-if="visitors"
								color="neutral"
								variant="subtle"
								icon="i-lucide-users"
								:label="`${visitors} pengunjung · 30 hari terakhir`"
								class="w-fit"
							/>
						</div>
					</template>
				</UFooterColumns>
			</UContainer>
		</template>

		<template #left>
			<p class="text-sm text-muted">
				© {{ new Date().getFullYear() }} Majalengka Tech · Kode terbuka berlisensi MIT
			</p>
		</template>

		<template #right>
			<UButton
				to="https://github.com/majalengkatech"
				target="_blank"
				icon="i-simple-icons-github"
				aria-label="Majalengka Tech di GitHub"
				color="neutral"
				variant="ghost"
			/>
		</template>
	</UFooter>
</template>
