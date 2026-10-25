<script setup lang="ts">
import type { NotificationItem } from '~/composables/useNotifications'

// Mengikuti NotificationsSlideover di template Nuxt UI Dashboard.
const { open, items, status, refresh, markAllRead } = useNotifications()
const route = useRoute()

watch(open, async (isOpen) => {
	if (!isOpen) return
	await refresh()
	await markAllRead()
})

watch(() => route.fullPath, () => {
	open.value = false
})

function message(item: NotificationItem) {
	const title = item.project?.title ? `"${item.project.title}"` : 'proyekmu'
	return item.type === 'like' ? `mengapresiasi ${title}` : `mengomentari ${title}`
}

function link(item: NotificationItem) {
	if (!item.project) return undefined
	return item.type === 'comment' ? `/projek/${item.project.slug}#judul-komentar` : `/projek/${item.project.slug}`
}
</script>

<template>
	<USlideover
		v-model:open="open"
		title="Notifikasi"
		description="Apresiasi dan komentar baru di proyekmu."
	>
		<template #body>
			<div
				v-if="status === 'pending' && !items.length"
				class="flex flex-col gap-3"
			>
				<USkeleton
					v-for="n in 4"
					:key="n"
					class="h-12 w-full"
				/>
			</div>

			<UAlert
				v-else-if="status === 'error'"
				color="error"
				variant="subtle"
				icon="i-lucide-cloud-off"
				title="Notifikasi gagal dimuat"
				description="Server belum merespons. Coba lagi sebentar."
				:actions="[{ label: 'Coba Lagi', color: 'error', variant: 'outline', onClick: () => refresh() }]"
			/>

			<UEmpty
				v-else-if="!items.length"
				icon="i-lucide-bell-off"
				title="Belum ada notifikasi"
				description="Kabar apresiasi dan komentar di proyekmu akan muncul di sini."
			/>

			<div
				v-else
				class="flex flex-col"
			>
				<component
					:is="link(item) ? resolveComponent('NuxtLink') : 'div'"
					v-for="item in items"
					:key="item.id"
					:to="link(item)"
					class="relative -mx-3 flex items-center gap-3 rounded-md px-3 py-2.5 first:-mt-3 last:-mb-3 hover:bg-elevated/50"
				>
					<UChip
						color="error"
						:show="item.unread"
						inset
					>
						<UAvatar
							:src="item.actor.avatarUrl || undefined"
							:alt="item.actor.name"
							size="md"
						/>
					</UChip>

					<div class="min-w-0 flex-1 text-sm">
						<p class="flex items-center justify-between gap-2">
							<span class="truncate font-medium text-highlighted">{{ item.actor.name }}</span>
							<time
								:datetime="item.createdAt"
								class="shrink-0 text-xs text-muted"
							>{{ waktuRelatif(item.createdAt) }}</time>
						</p>
						<p class="truncate text-muted">
							<UIcon
								:name="item.type === 'like' ? 'i-lucide-heart' : 'i-lucide-message-circle'"
								class="mr-1 size-3.5 align-[-2px]"
							/>
							{{ message(item) }}
						</p>
					</div>
				</component>
			</div>
		</template>
	</USlideover>
</template>
