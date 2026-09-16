<script setup lang="ts">
const { user, clear } = useUserSession()
const colorMode = useColorMode()

defineProps<{
	collapsed?: boolean
}>()

async function handleLogout() {
	await clear()
	await navigateTo('/login')
}

function toggleColorMode() {
	colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}

const items = computed(() => [
	[
		{
			label: user.value?.name || 'Developer',
			avatar: {
				src: user.value?.avatar
			}
		}
	],
	[
		{
			label: 'Edit Profil',
			icon: 'i-lucide-user-cog',
			to: '/dashboard/settings'
		},
		{
			label: 'Projek Saya',
			icon: 'i-lucide-folder-git-2',
			to: '/dashboard/projects'
		},
		{
			label: 'Showcase Publik',
			icon: 'i-lucide-sparkles',
			to: '/projek'
		}
	],
	[
		{
			label: colorMode.value === 'dark' ? 'Mode Terang' : 'Mode Gelap',
			icon: colorMode.value === 'dark' ? 'i-lucide-sun' : 'i-lucide-moon',
			onSelect: () => toggleColorMode()
		},
		{
			label: 'Kembali ke Web',
			icon: 'i-lucide-arrow-left',
			to: '/'
		}
	],
	[
		{
			label: 'Keluar (Logout)',
			icon: 'i-lucide-log-out',
			color: 'error' as const,
			onSelect: () => handleLogout()
		}
	]
])
</script>

<template>
	<UDropdownMenu
		:items="items"
		:ui="{ content: 'w-56' }"
	>
		<UButton
			color="neutral"
			variant="ghost"
			class="w-full justify-start p-2 gap-2.5"
			:class="[collapsed && 'justify-center p-1.5']"
		>
			<UAvatar
				:src="user?.avatar"
				:alt="user?.name || 'User'"
				size="sm"
				class="shrink-0"
			/>
			<div
				v-if="!collapsed"
				class="flex flex-col text-left overflow-hidden leading-tight flex-1"
			>
				<span class="text-sm font-semibold truncate">{{ user?.name || 'Developer' }}</span>
				<span class="text-xs text-muted truncate">{{ user?.email || 'Majalengka Tech' }}</span>
			</div>
			<UIcon
				v-if="!collapsed"
				name="i-lucide-chevrons-up-down"
				class="w-4 h-4 text-muted shrink-0 ms-auto"
			/>
		</UButton>
	</UDropdownMenu>
</template>
