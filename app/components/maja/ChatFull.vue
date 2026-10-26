<script setup lang="ts">
// Mode layar penuh Maja, meniru "Open full screen" Nuxi: sidebar (logo, chat baru, masuk) dan area chat lebar.
const { open, fullscreen, messages, outOfQuota, quota, mood, ask, reset } = useMajaChat()
const route = useRoute()

const fullOpen = computed({
	get: () => open.value && fullscreen.value,
	set: (value: boolean) => {
		if (!value) open.value = false
	}
})

// Sapaan mengikuti jam pengunjung.
const greeting = computed(() => {
	const hour = new Date().getHours()
	if (hour < 11) return 'Selamat pagi'
	if (hour < 15) return 'Selamat siang'
	if (hour < 18) return 'Selamat sore'
	return 'Selamat malam'
})
</script>

<template>
	<UModal
		v-model:open="fullOpen"
		fullscreen
		title="Maja"
		description="Asisten tanya-jawab Majalengka Tech"
	>
		<template #content>
			<div class="flex h-full w-full bg-default">
				<aside class="hidden w-72 shrink-0 flex-col gap-4 border-r border-default p-4 lg:flex">
					<div class="flex items-center justify-between gap-2">
						<AppLogo />
						<UTooltip text="Kecilkan ke panel">
							<UButton
								icon="i-lucide-panel-right"
								color="neutral"
								variant="ghost"
								aria-label="Kecilkan ke panel samping"
								@click="fullscreen = false"
							/>
						</UTooltip>
					</div>
					<UButton
						label="Chat Baru"
						icon="i-lucide-plus"
						color="neutral"
						variant="outline"
						block
						:disabled="!messages.length"
						@click="reset"
					/>
					<div class="flex-1" />
					<UButton
						v-if="quota && !quota.signedIn"
						label="Masuk untuk 50 pertanyaan per hari"
						icon="i-lucide-log-in"
						color="neutral"
						variant="outline"
						block
						:to="{ path: '/login', query: { redirect: route.fullPath } }"
						@click="open = false"
					/>
				</aside>

				<div class="flex min-w-0 flex-1 flex-col">
					<header class="flex items-center gap-1 border-b border-default px-3 py-2">
						<div class="flex flex-1 items-center gap-2 lg:invisible">
							<MajaMascot
								variant="head"
								:mood="mood"
								class="size-7 text-primary"
							/>
							<span class="font-semibold text-highlighted">Maja</span>
						</div>
						<UButton
							icon="i-lucide-plus"
							color="neutral"
							variant="ghost"
							aria-label="Mulai chat baru"
							class="lg:hidden"
							:disabled="!messages.length"
							@click="reset"
						/>
						<UTooltip text="Kecilkan ke panel">
							<UButton
								icon="i-lucide-minimize-2"
								color="neutral"
								variant="ghost"
								aria-label="Kecilkan ke panel samping"
								@click="fullscreen = false"
							/>
						</UTooltip>
						<UButton
							icon="i-lucide-x"
							color="neutral"
							variant="ghost"
							aria-label="Tutup Maja"
							@click="open = false"
						/>
					</header>

					<div
						v-if="!messages.length"
						class="flex flex-1 flex-col items-center justify-center gap-6 overflow-y-auto px-4 py-8"
					>
						<MajaMascot
							:mood="outOfQuota ? 'sleeping' : mood"
							class="w-48 text-primary sm:w-56"
						/>
						<h2 class="text-center text-3xl font-bold text-highlighted sm:text-4xl">
							{{ greeting }}
						</h2>
						<MajaChatInput class="w-full max-w-2xl" />
						<!-- Di layar sempit teks saran diperkecil, dan label yang tetap kepanjangan dipotong dengan elipsis. -->
						<div class="flex w-full max-w-2xl flex-wrap justify-center gap-2">
							<UButton
								v-for="suggestion in MAJA_SUGGESTIONS"
								:key="suggestion.label"
								:label="suggestion.label"
								:icon="suggestion.icon"
								color="neutral"
								variant="outline"
								class="max-w-full max-sm:text-xs"
								:ui="{ label: 'truncate', leadingIcon: 'max-sm:size-4' }"
								:disabled="outOfQuota"
								@click="ask(suggestion.label)"
							/>
						</div>
					</div>

					<template v-else>
						<div class="flex-1 overflow-y-auto">
							<MajaChatThread class="mx-auto w-full max-w-3xl px-4 py-6" />
						</div>
						<div class="mx-auto w-full max-w-3xl p-4">
							<MajaChatInput />
						</div>
					</template>
				</div>
			</div>
		</template>
	</UModal>
</template>
