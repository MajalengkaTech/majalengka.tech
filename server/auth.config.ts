import { defineServerAuth } from '@nuxtjs/better-auth/config'
import { admin, captcha } from 'better-auth/plugins'
import { emailConfigFrom, sendEmail } from './lib/email'
import { hashUserPassword, verifyUserPassword } from './lib/password'

export default defineServerAuth(({ runtimeConfig }) => {
	const email = emailConfigFrom(runtimeConfig)
	const turnstileSecret = runtimeConfig?.turnstile?.secretKey || process.env.NUXT_TURNSTILE_SECRET_KEY || ''

	return {
		trustedOrigins: ['http://localhost:3000', 'https://majalengka.tech'],
		// Situs hanya bisa dibuka lewat Cloudflare Tunnel, dan Cloudflare selalu menimpa CF-Connecting-IP dengan IP asli pengunjung.
		// Tanpa ini rate limit login memakai satu jatah bersama, karena X-Forwarded-For yang dipalsukan berisi lebih dari satu IP.
		advanced: {
			ipAddress: {
				ipAddressHeaders: ['cf-connecting-ip', 'x-forwarded-for']
			}
		},
		// Pengirim email dibatasi lebih ketat supaya tidak bisa dipakai membanjiri kotak masuk orang lain.
		rateLimit: {
			customRules: {
				'/request-password-reset': { window: 300, max: 3 },
				'/send-verification-email': { window: 300, max: 3 }
			}
		},
		user: {
			additionalFields: {
				bio: {
					type: 'string',
					required: false
				},
				githubUsername: {
					type: 'string',
					required: false
				},
				websiteUrl: {
					type: 'string',
					required: false
				},
				// Field profil kreator diisi lewat /api/user/profile yang memvalidasi isinya, bukan lewat sign-up.
				username: {
					type: 'string',
					required: false,
					unique: true,
					input: false
				},
				creatorRole: {
					type: 'string',
					required: false,
					input: false
				},
				location: {
					type: 'string',
					required: false,
					input: false
				},
				skills: {
					type: 'string',
					required: false,
					input: false
				},
				openToWork: {
					type: 'boolean',
					required: false,
					defaultValue: false,
					input: false
				},
				designUrl: {
					type: 'string',
					required: false,
					input: false
				},
				linkedinUrl: {
					type: 'string',
					required: false,
					input: false
				},
				socialLinks: {
					type: 'string',
					required: false,
					input: false
				}
			}
		},
		emailAndPassword: {
			enabled: true,
			password: {
				hash: hashUserPassword,
				verify: verifyUserPassword
			},
			resetPasswordTokenExpiresIn: 60 * 60,
			// Sesi lain (misalnya di perangkat yang dicuri) ikut keluar setelah kata sandi direset.
			revokeSessionsOnPasswordReset: true,
			sendResetPassword: async ({ user, url }) => {
				await sendEmail(email, {
					to: user.email,
					subject: 'Atur ulang kata sandi Majalengka Tech',
					heading: 'Atur ulang kata sandimu',
					intro: `Halo ${user.name}, ada permintaan untuk mengatur ulang kata sandi akunmu. Klik tombol di bawah untuk membuat kata sandi baru. Link ini berlaku 1 jam.`,
					actionLabel: 'Buat Kata Sandi Baru',
					actionUrl: url,
					outro: 'Kalau kamu tidak meminta ini, abaikan saja email ini. Kata sandimu tidak berubah.'
				})
			}
		},
		// Verifikasi tidak diwajibkan untuk masuk, supaya akun lama yang belum terverifikasi tetap bisa dipakai.
		emailVerification: {
			sendOnSignUp: Boolean(email),
			autoSignInAfterVerification: true,
			expiresIn: 60 * 60 * 24,
			sendVerificationEmail: async ({ user, url }) => {
				await sendEmail(email, {
					to: user.email,
					subject: 'Verifikasi email Majalengka Tech',
					heading: 'Satu langkah lagi',
					intro: `Halo ${user.name}, klik tombol di bawah untuk memastikan email ini milikmu. Link ini berlaku 24 jam.`,
					actionLabel: 'Verifikasi Email',
					actionUrl: url,
					outro: 'Kalau kamu tidak merasa mendaftar di Majalengka Tech, abaikan saja email ini.'
				})
			}
		},
		socialProviders: {
			github: {
				clientId: runtimeConfig?.oauth?.githubClientId || process.env.NUXT_OAUTH_GITHUB_CLIENT_ID || process.env.GITHUB_CLIENT_ID || '',
				clientSecret: runtimeConfig?.oauth?.githubClientSecret || process.env.NUXT_OAUTH_GITHUB_CLIENT_SECRET || process.env.GITHUB_CLIENT_SECRET || ''
			},
			google: {
				clientId: runtimeConfig?.oauth?.googleClientId || process.env.NUXT_OAUTH_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || '',
				clientSecret: runtimeConfig?.oauth?.googleClientSecret || process.env.NUXT_OAUTH_GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET || ''
			}
		},
		plugins: [
			admin({
				adminUserIds: (runtimeConfig?.superAdminIds || process.env.NUXT_SUPER_ADMIN_IDS || '')
					.split(',')
					.map((id: string) => id.trim())
					.filter(Boolean)
			}),
			// Turnstile menjaga form daftar, masuk, dan lupa kata sandi. Tanpa secret key, plugin tidak dipasang.
			...(turnstileSecret
				? [captcha({
						provider: 'cloudflare-turnstile',
						secretKey: turnstileSecret,
						endpoints: ['/sign-up/email', '/sign-in/email', '/request-password-reset']
					})]
				: [])
		]
	}
})
