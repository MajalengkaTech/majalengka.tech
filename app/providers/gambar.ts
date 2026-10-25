import { defineProvider } from '@nuxt/image/runtime'
import cloudinary from '@nuxt/image/runtime/providers/cloudinary'
import ipx from '@nuxt/image/runtime/providers/ipx'

// Gambar di Cloudinary diubah ukurannya oleh Cloudinary sendiri, tidak diunduh lalu diolah ulang oleh IPX di VPS.
// Gambar lain (avatar GitHub/Google, Unsplash, file di public/) tetap lewat IPX.
export default defineProvider({
	validateDomains: true,
	supportsAlias: true,
	getImage: (src, options, ctx) => {
		// Tipe Cloudinary meminta quality berupa string, padahal angka 80 dari nuxt.config tetap dipakai apa adanya (q_80).
		if (src.startsWith('https://res.cloudinary.com/')) return cloudinary().getImage(src, options as Parameters<ReturnType<typeof cloudinary>['getImage']>[1], ctx)
		return ipx().getImage(src, options, ctx)
	}
})
