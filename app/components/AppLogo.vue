<script setup lang="ts">
// Majalengka Tech brand logo component
</script>

<template>
	<div class="inline-flex items-center gap-2 font-bold tracking-tight text-neutral-900 dark:text-white">
		<img
			src="/logo-circle.svg"
			alt="Majalengka Tech Logo"
			class="size-7 rounded-md object-contain shrink-0"
		>
		<span class="text-base font-semibold text-neutral-900 dark:text-white">
			majalengka
		</span>
		<UBadge
			label=".tech"
			color="primary"
			variant="subtle"
			size="xs"
			class="font-mono font-bold tracking-tight rounded-md px-1.5 py-0.5"
		/>
	</div>
</template>
