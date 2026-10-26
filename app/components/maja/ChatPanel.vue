<script setup lang="ts">
// Panel samping Maja, meniru panel Nuxi di nuxt.com. Mode layar penuh ada di ChatFull.
const { open, fullscreen, messages, outOfQuota, mood, ask, reset } = useMajaChat()

const panelOpen = computed({
	get: () => open.value && !fullscreen.value,
	set: (value: boolean) => {
		if (!value) open.value = false
	}
})
</script>

<template>
	<USlideover
		v-model:open="panelOpen"
		side="right"
		title="Maja"
		description="Asisten tanya-jawab Majalengka Tech"
		:ui="{ content: 'max-w-md', header: 'flex items-center gap-2', body: 'flex flex-col p-0 sm:p-0', footer: 'p-3 sm:p-3' }"
	>
		<template #header>
			<div class="flex flex-1 items-center gap-2">
				<MajaMascot
					variant="head"
					:mood="mood"
					class="size-7 text-primary"
				/>
				<span class="font-semibold text-highlighted">Maja</span>
				<UBadge
					label="Beta"
					color="primary"
					variant="subtle"
					size="sm"
				/>
			</div>
			<UTooltip text="Chat baru">
				<UButton
					icon="i-lucide-plus"
					color="neutral"
					variant="ghost"
					aria-label="Mulai chat baru"
					:disabled="!messages.length"
					@click="reset"
				/>
			</UTooltip>
			<UTooltip text="Buka layar penuh">
				<UButton
					icon="i-lucide-scan"
					color="neutral"
					variant="ghost"
					aria-label="Buka layar penuh"
					@click="fullscreen = true"
				/>
			</UTooltip>
			<UButton
				icon="i-lucide-x"
				color="neutral"
				variant="ghost"
				aria-label="Tutup panel Maja"
				@click="open = false"
			/>
		</template>

		<template #body>
			<div
				v-if="!messages.length"
				class="flex flex-1 flex-col justify-end gap-6 p-4"
			>
				<div class="flex flex-col items-center gap-3 text-center">
					<MajaMascot
						:mood="outOfQuota ? 'sleeping' : undefined"
						class="w-40 text-primary"
					/>
					<p class="max-w-xs text-sm text-muted">
						Halo, aku Maja. Tanya apa saja tentang kreator, proyek, dan tutorial di Majalengka Tech.
					</p>
				</div>
				<div class="flex flex-col gap-1">
					<p class="px-2 text-sm font-semibold text-highlighted">
						Mulai dari sini
					</p>
					<UButton
						v-for="suggestion in MAJA_SUGGESTIONS"
						:key="suggestion.label"
						:label="suggestion.label"
						color="neutral"
						variant="ghost"
						block
						:disabled="outOfQuota"
						class="justify-start text-muted"
						@click="ask(suggestion.label)"
					/>
				</div>
			</div>
			<MajaChatThread
				v-else
				class="p-4"
			/>
		</template>

		<template #footer>
			<MajaChatInput class="w-full" />
		</template>
	</USlideover>
</template>
