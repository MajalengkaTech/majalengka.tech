import { defineEventHandler } from 'nuxt/server'

// Kunci diisi lewat env di server, jadi halaman menanyakan fitur mana yang aktif tanpa perlu build ulang.
export default defineEventHandler(() => {
	const config = useRuntimeConfig()
	return {
		email: Boolean(config.resend.apiKey && config.resend.from),
		turnstileSiteKey: config.turnstile.siteKey && config.turnstile.secretKey ? config.turnstile.siteKey : null
	}
})
