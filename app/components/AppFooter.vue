<script setup lang="ts">
// Diambil setelah halaman tampil supaya footer tidak menahan render; angka disembunyikan bila datanya belum ada.
const { data: stats } = useFetch<{ visitors: number | null }>('/api/stats/visitors', {
	key: 'footer-visitors',
	server: false,
	lazy: true
})
const visitors = computed(() => stats.value?.visitors ? stats.value.visitors.toLocaleString('id-ID') : null)

const columns = [{
	label: 'Jelajahi',
	children: [{
		label: 'Showcase',
		to: '/projek'
	}, {
		label: 'Kreator',
		to: '/kreator'
	}, {
		label: 'Pamerkan Proyekmu',
		to: '/dashboard/projects/new'
	}, {
		label: 'Tentang',
		to: '/tentang'
	}]
}, {
	label: 'Panduan',
	children: [{
		label: 'Mengenal Majalengka Tech',
		to: '/docs/getting-started'
	}, {
		label: 'Pamerkan proyek',
		to: '/docs/getting-started/pamerkan-karya'
	}, {
		label: 'Profil kreator',
		to: '/docs/getting-started/profil-kreator'
	}, {
		label: 'Kontribusi kode',
		to: '/docs/kontribusi'
	}]
}, {
	label: 'Ikuti',
	children: [{
		label: 'Changelog',
		to: '/changelog'
	}, {
		label: 'GitHub',
		to: 'https://github.com/majalengkatech',
		target: '_blank'
	}]
}]
</script>

<template>
	<USeparator class="h-px">
		<Logo class="size-5" />
	</USeparator>

	<UFooter :ui="{ top: 'border-b border-default' }">
		<template #top>
			<UContainer>
				<UFooterColumns :columns="columns" />
			</UContainer>
		</template>

		<template #left>
			<p class="text-muted text-sm">
				Majalengka Tech · Tempat kreator Majalengka memamerkan proyek · Kode terbuka berlisensi MIT · © {{ new Date().getFullYear() }}
			</p>
			<p
				v-if="visitors"
				class="mt-1 text-muted text-sm"
			>
				Dikunjungi {{ visitors }} orang dalam 30 hari terakhir
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
