import { defineServerAuth } from '@nuxtjs/better-auth/config'
import { admin } from 'better-auth/plugins'

export default defineServerAuth(({ runtimeConfig }) => ({
	trustedOrigins: ['http://localhost:3000', 'https://majalengka.tech'],
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
			}
		}
	},
	emailAndPassword: {
		enabled: true
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
		})
	]
}))
