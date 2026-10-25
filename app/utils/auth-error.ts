// Better Auth mengirim pesan error dalam bahasa Inggris, jadi pesan untuk pengguna diambil dari kode errornya.
const AUTH_ERROR_MESSAGES: Record<string, string> = {
	INVALID_EMAIL_OR_PASSWORD: 'Email atau kata sandinya salah. Periksa lagi, lalu coba masuk.',
	INVALID_PASSWORD: 'Kata sandinya salah. Periksa lagi, lalu coba masuk.',
	INVALID_EMAIL: 'Format email belum benar. Periksa lagi penulisannya.',
	USER_ALREADY_EXISTS: 'Email ini sudah terdaftar. Masuk saja, atau daftar dengan email lain.',
	USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: 'Email ini sudah terdaftar. Masuk saja, atau daftar dengan email lain.',
	PASSWORD_TOO_SHORT: 'Kata sandi minimal 8 karakter.',
	PASSWORD_TOO_LONG: 'Kata sandinya terlalu panjang. Pakai yang lebih pendek.',
	EMAIL_NOT_VERIFIED: 'Email-mu belum diverifikasi. Buka email dari kami, lalu klik link verifikasinya.',
	BANNED_USER: 'Akun ini sedang ditangguhkan pengelola situs.',
	FAILED_TO_CREATE_USER: 'Akunmu belum berhasil dibuat. Coba lagi beberapa saat lagi.',
	INVALID_TOKEN: 'Link ini sudah tidak berlaku. Minta link baru, lalu buka link dari email terbaru.',
	TOKEN_EXPIRED: 'Link ini sudah kedaluwarsa. Minta link baru, lalu buka link dari email terbaru.',
	EMAIL_ALREADY_VERIFIED: 'Email-mu sudah terverifikasi. Tidak perlu verifikasi lagi.',
	VERIFICATION_EMAIL_NOT_ENABLED: 'Pengiriman email belum aktif. Hubungi pengelola situs.',
	// Kode dari plugin captcha (Turnstile).
	MISSING_RESPONSE: 'Tunggu pemeriksaan keamanan di atas tombol selesai, lalu coba lagi.',
	VERIFICATION_FAILED: 'Pemeriksaan keamanan gagal. Muat ulang halaman, lalu coba lagi.',
	UNKNOWN_ERROR: 'Pemeriksaan keamanan sedang bermasalah. Coba lagi beberapa saat lagi.'
}

export function authErrorMessage(error: { code?: string, status?: number } | null | undefined, fallback: string) {
	if (error?.status === 429) return 'Terlalu banyak percobaan dalam waktu singkat. Tunggu sebentar, lalu coba lagi.'
	return (error?.code && AUTH_ERROR_MESSAGES[error.code]) || fallback
}
