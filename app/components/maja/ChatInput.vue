<script setup lang="ts">
// Kolom tanya Maja dengan ajakan masuk dan sisa kuota hari ini.
const { open, input, status, quota, outOfQuota, busy, ask, stop, retry } = useMajaChat()
const route = useRoute()
</script>

<template>
	<div class="flex flex-col gap-2">
		<div
			v-if="quota && !quota.signedIn"
			class="flex items-center justify-between gap-2 px-1 text-xs text-muted"
		>
			<span>Masuk untuk 50 pertanyaan per hari.</span>
			<UButton
				label="Masuk"
				icon="i-lucide-log-in"
				color="neutral"
				variant="link"
				size="xs"
				:to="{ path: '/login', query: { redirect: route.fullPath } }"
				@click="open = false"
			/>
		</div>
		<UChatPrompt
			v-model="input"
			:status="status"
			:disabled="outOfQuota"
			:maxlength="2000"
			:placeholder="outOfQuota ? 'Kuota hari ini habis. Coba lagi besok.' : 'Tanya tentang kreator, proyek, atau tutorial...'"
			variant="subtle"
			@submit="ask(input)"
		>
			<template #footer>
				<span class="text-xs text-muted">
					<template v-if="quota">{{ quota.remaining }}/{{ quota.limit }} pertanyaan hari ini</template>
				</span>
				<UChatPromptSubmit
					:status="status"
					:disabled="outOfQuota || (!input.trim() && !busy)"
					@stop="stop"
					@reload="retry"
				/>
			</template>
		</UChatPrompt>
	</div>
</template>
