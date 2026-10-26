<script setup lang="ts">
// Logo Majalengka Tech. `compact`: di layar sempit hanya ikon, supaya teksnya tidak patah jadi beberapa baris.
defineProps<{ compact?: boolean }>()
</script>

<template>
	<div class="inline-flex items-center gap-2 font-bold tracking-tight text-highlighted">
		<img
			src="/logo-circle.svg"
			alt="Majalengka Tech Logo"
			class="size-7 rounded-md object-contain shrink-0"
		>
		<span
			class="text-base font-semibold text-highlighted"
			:class="compact ? 'hidden sm:inline' : ''"
		>
			majalengka<span class="text-primary font-bold">.tech</span>
		</span>
	</div>
</template>
