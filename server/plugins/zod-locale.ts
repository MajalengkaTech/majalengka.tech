import { z } from 'zod'

// Pesan bawaan zod (yang tidak diberi pesan sendiri di skema) ikut berbahasa Indonesia.
export default defineNitroPlugin(() => {
	z.config(z.locales.id())
})
