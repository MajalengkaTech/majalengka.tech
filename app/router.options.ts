import type { RouterConfig } from 'nuxt/schema'

function hashTop(selector: string) {
	try {
		const element = document.querySelector(selector)
		if (element) return Number.parseFloat(getComputedStyle(element).scrollMarginTop) || 0
	} catch {
		// Hash yang bukan selector valid cukup diabaikan.
	}
	return 0
}

// Bawaan Nuxt baru menggulir setelah transisi masuk selesai, jadi halaman baru sempat tampil di posisi gulir lama lalu meloncat.
// Di sini gulir terjadi begitu halaman baru terpasang, saat transisi masuknya baru dimulai.
export default {
	scrollBehavior(to, from, savedPosition) {
		if (to.path.replace(/\/$/, '') === from.path.replace(/\/$/, '')) {
			if (to.hash) return { el: to.hash, top: hashTop(to.hash), behavior: 'smooth' }
			// Perubahan query saja (filter Showcase, tab Kelola) tidak mengubah posisi gulir.
			return false
		}

		const nuxtApp = useNuxtApp()
		return new Promise((resolve) => {
			const done = () => resolve(savedPosition || (to.hash ? { el: to.hash, top: hashTop(to.hash) } : { left: 0, top: 0 }))
			// Cadangan bila hook tidak terpanggil (misalnya halaman error), supaya posisi gulir tetap dipulihkan.
			const fallback = setTimeout(done, 700)
			nuxtApp.hooks.hookOnce('page:finish', () => {
				clearTimeout(fallback)
				requestAnimationFrame(done)
			})
		})
	}
} satisfies RouterConfig
