<script setup lang="ts">
defineOptions({
	inheritAttrs: false
})

defineProps<{
	headline?: string
	title?: string
	description?: string
}>()
</script>

<template>
	<div
		class="relative flex h-full w-full overflow-hidden bg-neutral-950 text-white"
		data-theme="dark"
	>
		<!-- Left blue brand accent bar -->
		<div class="absolute top-0 left-0 h-full w-2 bg-blue-600" />

		<div class="flex flex-1 flex-col justify-between px-20 py-16">
			<div />

			<div class="flex flex-col gap-5">
				<span
					v-if="headline"
					class="text-2xl font-semibold uppercase tracking-wider text-blue-400"
				>
					{{ headline }}
				</span>

				<h1
					v-if="title"
					class="text-6xl font-extrabold tracking-tight text-white"
				>
					{{ title }}
				</h1>

				<p
					v-if="description"
					class="text-3xl/11 text-neutral-400"
					:style="{ lineClamp: 2, textOverflow: 'ellipsis' }"
				>
					{{ description }}
				</p>
			</div>

			<div class="flex items-center gap-4">
				<img
					src="/logo-circle.svg"
					alt="Majalengka Tech"
					class="size-10 rounded-md object-contain"
				>
				<span class="text-2xl font-bold tracking-tight text-white">
					majalengka<span class="text-blue-500 font-extrabold">.tech</span>
				</span>
				<div class="h-px flex-1 bg-neutral-800" />
				<span class="text-lg font-medium text-neutral-400">Komunitas Open Source Majalengka</span>
			</div>
		</div>
	</div>
</template>
