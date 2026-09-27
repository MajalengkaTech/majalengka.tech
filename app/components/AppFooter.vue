<script setup lang="ts">
const columns = [{
	label: 'Inisiatif Unggulan',
	children: [{
		label: 'AgriTech Smart Farming',
		to: '/docs/inisiatif'
	}, {
		label: 'Tourism & Local Guide',
		to: '/docs/inisiatif'
	}, {
		label: 'Digitalisasi UMKM',
		to: '/docs/inisiatif'
	}, {
		label: 'Open Educational Resources',
		to: '/docs/inisiatif'
	}, {
		label: 'Open Data Majalengka',
		to: '/docs/inisiatif'
	}]
}, {
	label: 'Standar & Desain',
	children: [{
		label: 'Majalengka Design System',
		to: '/docs/design-system'
	}, {
		label: 'Design Tokens',
		to: '/docs/design-system'
	}, {
		label: 'Aksesibilitas WCAG AA',
		to: '/docs/design-system'
	}, {
		label: 'Open Knowledge Format (OKF)',
		to: '/docs/open-knowledge-format'
	}]
}, {
	label: 'Komunitas',
	children: [{
		label: 'Tentang Kami',
		to: '/docs'
	}, {
		label: 'Panduan Kontribusi',
		to: 'https://github.com/majalengka-tech',
		target: '_blank'
	}, {
		label: 'Blog & Update',
		to: '/blog'
	}, {
		label: 'Changelog',
		to: '/changelog'
	}, {
		label: 'GitHub Organization',
		to: 'https://github.com/majalengka-tech',
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
				Majalengka Tech • Dari Majalengka untuk Open Source • © {{ new Date().getFullYear() }}
			</p>
		</template>

		<template #right>
			<UButton
				to="https://github.com/majalengka-tech"
				target="_blank"
				icon="i-simple-icons-github"
				aria-label="Majalengka Tech di GitHub"
				color="neutral"
				variant="ghost"
			/>
		</template>
	</UFooter>
</template>
