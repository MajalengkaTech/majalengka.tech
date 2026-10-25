import { createError, defineEventHandler } from 'h3'

// Pembersihan log berjalan sebagai tugas terjadwal di server. Rute HTTP bawaan @evlog/nuxthub tidak dibutuhkan
// dan tanpa CRON_SECRET bisa dipanggil siapa saja, jadi ditutup.
export default defineEventHandler((event) => {
	if (event.path.startsWith('/api/_cron/')) {
		throw createError({ statusCode: 404, statusMessage: 'Halaman tidak ditemukan.' })
	}
})
