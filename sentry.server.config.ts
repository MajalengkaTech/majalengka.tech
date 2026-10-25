import * as Sentry from '@sentry/nuxt'

// File ini jalan sebelum Nuxt siap, jadi DSN dibaca langsung dari env, bukan lewat useRuntimeConfig.
const dsn = process.env.NUXT_PUBLIC_SENTRY_DSN

Sentry.init({
	dsn: dsn || undefined,
	enabled: Boolean(dsn),
	// Data pengunjung tidak dikirim: tanpa info pengguna/IP, cookie, isi request (bisa memuat kata sandi), dan query URL
	// (link reset sandi membawa token). Header hanya yang membantu membaca konteks error.
	dataCollection: {
		userInfo: false,
		cookies: false,
		httpHeaders: { request: { allow: ['user-agent', 'referer', 'accept-language'] }, response: false },
		httpBodies: [],
		urlQueryParams: false
	},
	tracesSampleRate: 0.1
})
