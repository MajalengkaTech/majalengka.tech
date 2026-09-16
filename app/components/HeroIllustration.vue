<script setup lang="ts">
import heroSvgRaw from '~/assets/hero-illustration.svg?raw'
</script>

<!-- eslint-disable vue/no-v-html -->
<template>
	<div
		id="hero-illustration"
		class="w-full flex items-center justify-center pointer-events-none select-none bg-transparent"
		aria-hidden="true"
		v-html="heroSvgRaw"
	/>
</template>

<style scoped>
#hero-illustration {
	/* Light Mode: Sesuai pemetaan brand user */
	--brand-primary: var(--color-brand-500, #0014a8); /* 0014a8 = brand */
	--brand-100: #d1d2dc;                             /* d1d2dc = brand100 */
	--brand-950: #000011;                             /* 000011 (#001) = brand950 */
	--brand-800: #000000;                             /* 000000 (#000) = brand800 */
	--brand-700: #f1ff5e;                             /* f1ff5e = brand700 */
}

:global(.dark) #hero-illustration {
	/* Dark Mode: Kontras tinggi & elegan di latar gelap */
	--brand-primary: #3b82f6;                         /* Biru terang menyala */
	--brand-100: #1e293b;                             /* Jendela/aksen gedung */
	--brand-950: #93c5fd;                             /* Garis sekunder gedung */
	--brand-800: #ffffff;                             /* Garis utama putih tegas */
	--brand-700: #fef08a;                             /* Awan & aksen highlight neon */
}

#hero-illustration :deep(svg) {
	width: 100%;
	height: auto;
	max-width: 100%;
	display: block;
	background: transparent;
}

#hero-illustration :deep(*) {
	transition:
		stroke 0.3s ease,
		fill 0.3s ease;
}
</style>
