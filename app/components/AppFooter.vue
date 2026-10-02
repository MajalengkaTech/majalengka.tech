<script setup lang="ts">
const columns = [{
	label: 'Jelajahi',
	children: [{
		label: 'Showcase',
		to: '/projek'
	}, {
		label: 'Pamerkan Karyamu',
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
		label: 'Pamerkan karya',
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
				Majalengka Tech · Etalase karya kreator Majalengka · Kode terbuka berlisensi MIT · © {{ new Date().getFullYear() }}
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
