<script setup lang="ts">
import { id } from '@nuxt/ui/locale'
import type { NuxtError } from '#app'

const props = defineProps<{
	error: NuxtError
}>()

// Pesan bawaan Nuxt dan Nitro berbahasa Inggris, jadi status umum diberi teks sendiri; pesan dari API kita sudah berbahasa Indonesia.
const notFound = computed(() => props.error.statusCode === 404)
const isDefaultMessage = computed(() => !props.error.statusMessage || /^(page not found|not found|internal server error|server error)/i.test(props.error.statusMessage))

const shownError = computed(() => ({
	statusCode: props.error.statusCode,
	statusMessage: isDefaultMessage.value
		? (notFound.value ? 'Halaman tidak ditemukan' : 'Terjadi kesalahan di server')
		: props.error.statusMessage,
	message: notFound.value
		? 'Alamat ini mungkin salah ketik, atau proyek dan profilnya sudah dihapus. Cek lagi alamatnya, atau kembali ke beranda.'
		: 'Halaman belum bisa ditampilkan. Coba muat ulang beberapa saat lagi, atau kembali ke beranda.'
}))

useHead({
	htmlAttrs: {
		lang: 'id'
	}
})

useSeoMeta({
	title: () => shownError.value.statusMessage,
	description: () => shownError.value.message
})

const { data: navigation } = await useAsyncData('navigation', () => queryCollectionNavigation('docs'), {
	transform: data => data.find(item => item.path === '/docs')?.children || []
})
const { data: files } = useLazyAsyncData('search', () => queryCollectionSearchSections('docs'), {
	server: false
})

provide('navigation', navigation)
</script>

<template>
	<UApp :locale="id">
		<AppHeader />

		<UMain>
			<UContainer>
				<UPage>
					<UError :error="shownError" />
				</UPage>
			</UContainer>
		</UMain>

		<AppFooter />

		<ClientOnly>
			<LazyUContentSearch
				:files="files"
				:navigation="navigation"
				:links="navLinks"
				:fuse="{ resultLimit: 42 }"
			/>
		</ClientOnly>
	</UApp>
</template>
