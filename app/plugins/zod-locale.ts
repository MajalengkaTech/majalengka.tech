import { z } from 'zod'

// Sama dengan server/plugins/zod-locale.ts, supaya pesan validasi form di browser juga berbahasa Indonesia.
export default defineNuxtPlugin(() => {
	z.config(z.locales.id())
})
