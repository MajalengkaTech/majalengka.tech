<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const open = ref(false)

const { user } = useUserSession()

const isAdmin = computed(() => {
	const role = (user.value as { role?: string })?.role
	const email = user.value?.email?.toLowerCase()
	return role === 'admin' || email === 'dinarpermadi07@gmail.com'
})

const navLinks = computed<NavigationMenuItem[][]>(() => {
	const primaryLinks: NavigationMenuItem[] = [
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
	]

	if (isAdmin.value) {
		primaryLinks.push({
			label: 'Konsol Kelola',
			icon: 'i-lucide-shield-alert',
			to: '/kelola',
			onSelect: () => {
				open.value = false
			}
		})
	}

	return [
		primaryLinks,
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
	]
})
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
						class="flex items-center gap-2.5 text-highlighted hover:opacity-80 transition-opacity min-w-0"
					>
						<img
							src="/logo-circle.svg"
							alt="Majalengka Tech Logo"
							class="size-7 rounded-md object-contain shrink-0"
						>
						<div
							v-if="!collapsed"
							class="flex flex-col min-w-0 leading-tight"
						>
							<span class="text-sm font-bold tracking-tight text-neutral-900 dark:text-white truncate">
								majalengka<span class="text-primary font-bold">.tech</span>
							</span>
							<span class="text-[10px] font-semibold uppercase tracking-wider text-muted truncate">
								Developer Hub
							</span>
						</div>
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
