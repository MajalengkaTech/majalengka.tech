<script setup lang="ts">
// Tombol "Tanya Maja" di header, meniru "Ask Nuxi": maskotnya hidup (melirik, tertidur bila didiamkan, kaget saat
// di-hover) dan tombolnya menghilang selama panel terbuka. Panelnya dipasang sekali di app.vue.
const open = useState('maja-chat-open', () => false)
</script>

<template>
	<Transition
		enter-active-class="transition duration-250 ease-out"
		enter-from-class="scale-80 opacity-0 blur-xs"
		leave-active-class="transition duration-150 ease-in"
		leave-to-class="scale-80 opacity-0 blur-xs"
	>
		<UButton
			v-if="!open"
			color="neutral"
			variant="ghost"
			label="Tanya Maja"
			aria-label="Tanya Maja, asisten Majalengka Tech"
			class="max-sm:p-1.5"
			:ui="{ base: 'gap-2 px-3 py-1', label: 'hidden sm:inline-flex' }"
			@click="open = true"
		>
			<template #leading>
				<span class="inline-flex size-6 shrink-0 items-center justify-center max-sm:size-5">
					<MajaMascot
						variant="head"
						class="size-6 text-primary max-sm:size-5"
					/>
				</span>
			</template>
		</UButton>
	</Transition>
</template>
