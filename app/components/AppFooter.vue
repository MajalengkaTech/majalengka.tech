<script setup lang="ts">
const columns = [{
	label: 'Inisiatif Unggulan',
	children: [{
		label: 'AgriTech Smart Farming',
		to: '/docs/inisiatif'
	}, {
		label: 'Tourism & Local Guide',
		to: '/docs/inisiatif'
	}, {
		label: 'Digitalisasi UMKM',
		to: '/docs/inisiatif'
	}, {
		label: 'Open Educational Resources',
		to: '/docs/inisiatif'
	}, {
		label: 'Open Data Majalengka',
		to: '/docs/inisiatif'
	}]
}, {
	label: 'Standar & Desain',
	children: [{
		label: 'Majalengka Design System',
		to: '/docs/design-system'
	}, {
		label: 'Design Tokens',
		to: '/docs/design-system'
	}, {
		label: 'Aksesibilitas WCAG AA',
		to: '/docs/design-system'
	}, {
		label: 'Open Knowledge Format (OKF)',
		to: '/docs/open-knowledge-format'
	}]
}, {
	label: 'Komunitas',
	children: [{
		label: 'Tentang Kami',
		to: '/docs'
	}, {
		label: 'Panduan Kontribusi',
		to: 'https://github.com/majalengka-tech',
		target: '_blank'
	}, {
		label: 'Blog & Update',
		to: '/blog'
	}, {
		label: 'GitHub Organization',
		to: 'https://github.com/majalengka-tech',
		target: '_blank'
	}]
}]

const toast = useToast()

const email = ref('')
const loading = ref(false)

function onSubmit() {
	loading.value = true

	toast.add({
		title: 'Subscribed!',
		description: 'You\'ve been subscribed to our newsletter.'
	})
}
</script>

<template>
	<USeparator class="h-px">
		<Logo class="size-5" />
	</USeparator>

	<UFooter :ui="{ top: 'border-b border-default' }">
		<template #top>
			<UContainer>
				<UFooterColumns :columns="columns">
					<template #right>
						<form @submit.prevent="onSubmit">
							<UFormField
								name="email"
								label="Subscribe to our newsletter"
								size="lg"
							>
								<UInput
									v-model="email"
									type="email"
									class="w-full"
									placeholder="Enter your email"
								>
									<template #trailing>
										<UButton
											type="submit"
											size="xs"
											color="neutral"
											label="Subscribe"
										/>
									</template>
								</UInput>
							</UFormField>
						</form>
					</template>
				</UFooterColumns>
			</UContainer>
		</template>

		<template #left>
			<p class="text-muted text-sm">
				Majalengka Tech • Dari Majalengka untuk Open Source • © {{ new Date().getFullYear() }}
			</p>
		</template>

		<template #right>
			<UButton
				to="https://github.com/majalengka-tech"
				target="_blank"
				icon="i-simple-icons-github"
				aria-label="Majalengka Tech di GitHub"
				color="neutral"
				variant="ghost"
			/>
		</template>
	</UFooter>
</template>
