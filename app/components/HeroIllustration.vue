<script setup lang="ts">
import heroSvgRaw from '~/assets/hero-dynamic.svg?raw'
</script>

<!-- eslint-disable vue/no-v-html -->
<template>
	<div
		id="hero-illustration"
		class="w-full flex items-center justify-center pointer-events-none select-none"
		aria-hidden="true"
		v-html="heroSvgRaw"
	/>
</template>

<style scoped>
#hero-illustration {
	/* Mode Terang: garis hitam pekat (#16161e) dan warna aksen primer */
	--hero-stroke-main: #16161e;
	--hero-stroke-subtle: #94a3b8;
	--hero-fill-accent: #0014a8;
	--hero-fill-muted: #e2e8f0;
}

:global(.dark) #hero-illustration {
	/* Mode Gelap: garis biru 100 (#dbeafe) / putih cerah agar tajam & hidup */
	--hero-stroke-main: #dbeafe;
	--hero-stroke-subtle: #64748b;
	--hero-fill-accent: #3b82f6;
	--hero-fill-muted: #1e293b;
}

#hero-illustration :deep(svg) {
	width: 100%;
	height: auto;
	max-width: 100%;
	display: block;
}

#hero-illustration :deep(*) {
	transition:
		stroke 0.3s ease,
		fill 0.3s ease;
}
</style>
