<script setup lang="ts">
const { open, unread, refresh } = useNotifications()

onMounted(() => {
	refresh()
})
</script>

<template>
	<UTooltip text="Notifikasi">
		<UButton
			color="neutral"
			variant="ghost"
			square
			:aria-label="unread ? `Notifikasi, ${unread} belum dibaca` : 'Notifikasi'"
			@click="open = true"
		>
			<UChip
				color="error"
				inset
				:show="unread > 0"
			>
				<UIcon
					name="i-lucide-bell"
					class="size-5 shrink-0"
				/>
			</UChip>
		</UButton>
	</UTooltip>
</template>
