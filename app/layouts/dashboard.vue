<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const open = ref(false)

const navLinks = computed<NavigationMenuItem[][]>(() => [
	[
		{
			label: 'Ringkasan',
			icon: 'i-lucide-layout-dashboard',
			to: '/dashboard',
			exact: true,
			onSelect: () => {
				open.value = false
			}
		},
		{
			label: 'Projek Saya',
			icon: 'i-lucide-folder-git-2',
			to: '/dashboard/projects',
			onSelect: () => {
				open.value = false
			}
		},
		{
			label: 'Edit Profil',
			icon: 'i-lucide-user-cog',
			to: '/dashboard/settings',
			onSelect: () => {
				open.value = false
			}
		}
	],
	[
		{
			label: 'Showcase Publik',
			icon: 'i-lucide-sparkles',
			to: '/projek',
			target: '_blank'
		},
		{
			label: 'Dokumentasi',
			icon: 'i-lucide-book-open',
			to: '/docs'
		},
		{
			label: 'Ke Website',
			icon: 'i-lucide-external-link',
			to: '/'
		}
	]
])
</script>

<template>
	<UDashboardGroup unit="rem">
		<UDashboardSidebar
			id="dashboard-sidebar"
			v-model:open="open"
			collapsible
			resizable
			class="bg-neutral-50/50 dark:bg-neutral-900/50 border-r border-default"
			:ui="{
				footer: 'border-t border-default p-2'
			}"
		>
			<template #header="{ collapsed }">
				<div class="flex items-center gap-2.5 px-1 py-1 w-full overflow-hidden">
					<NuxtLink
						to="/"
						class="flex items-center gap-2 text-highlighted hover:opacity-80 transition-opacity"
					>
						<AppLogo class="w-auto h-6 shrink-0" />
						<span
							v-if="!collapsed"
							class="text-xs font-bold uppercase tracking-wider text-primary truncate"
						>
							Developer Hub
						</span>
					</NuxtLink>
				</div>
			</template>

			<template #default="{ collapsed }">
				<div class="flex flex-col gap-4 py-2">
					<UNavigationMenu
						:collapsed="collapsed"
						:items="navLinks[0]"
						orientation="vertical"
						tooltip
						popover
					/>

					<USeparator />

					<UNavigationMenu
						:collapsed="collapsed"
						:items="navLinks[1]"
						orientation="vertical"
						tooltip
						popover
					/>
				</div>
			</template>

			<template #footer="{ collapsed }">
				<DashboardUserMenu :collapsed="collapsed" />
			</template>
		</UDashboardSidebar>

		<div class="flex-1 flex flex-col min-w-0 overflow-y-auto">
			<slot />
		</div>
	</UDashboardGroup>
</template>
