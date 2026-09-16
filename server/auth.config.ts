import { defineServerAuth } from '@nuxtjs/better-auth/config'
import { admin } from 'better-auth/plugins'

export default defineServerAuth({
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
			}
		}
	},
	emailAndPassword: {
		enabled: true
	},
	socialProviders: {
		github: {
			clientId: process.env.NUXT_OAUTH_GITHUB_CLIENT_ID || process.env.GITHUB_CLIENT_ID || '',
			clientSecret: process.env.NUXT_OAUTH_GITHUB_CLIENT_SECRET || process.env.GITHUB_CLIENT_SECRET || ''
		},
		google: {
			clientId: process.env.NUXT_OAUTH_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || '',
			clientSecret: process.env.NUXT_OAUTH_GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET || ''
		}
	},
	plugins: [
		admin()
	],
	databaseHooks: {
		user: {
			create: {
				before: async (user) => {
					const adminEmails = ['dinarpermadi07@gmail.com']
					if (adminEmails.includes(user.email.toLowerCase())) {
						return {
							data: {
								...user,
								role: 'admin'
							}
						}
					}
					return { data: user }
				}
			}
		}
	}
})
