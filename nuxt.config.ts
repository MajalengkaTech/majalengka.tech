// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	modules: [
		'@nuxt/eslint',
		'@nuxt/image',
		'@nuxt/ui',
		'@nuxt/content',
		'@vueuse/nuxt',
		'nuxt-og-image',
		'nuxt-auth-utils',
		'@nuxthub/core'
	],

	devtools: {
		enabled: true
	},

	css: ['~/assets/css/main.css'],

	content: {
		experimental: {
			sqliteConnector: 'native'
		}
	},

	routeRules: {
		'/docs': { redirect: '/docs/getting-started', prerender: false }
	},

	compatibilityDate: '2026-06-30',

	nitro: {
		preset: 'cloudflare_module',
		cloudflare: {
			deployConfig: true,
			wrangler: {
				d1_databases: [
					{
						binding: 'DB',
						database_name: 'majalengka-tech-db',
						database_id: process.env.CLOUDFLARE_D1_DATABASE_ID || ''
					}
				],
				r2_buckets: [
					{
						binding: 'BLOB',
						bucket_name: 'majalengkatech'
					}
				]
			}
		},
		prerender: {
			routes: [
				'/'
			],
			crawlLinks: true
		}
	},

	hub: {
		db: 'sqlite',
		blob: true
	},

	eslint: {
		config: {
			stylistic: {
				indent: 'tab',
				quotes: 'single',
				semi: false,
				commaDangle: 'never',
				braceStyle: '1tbs'
			}
		}
	},

	image: {
		provider: process.env.NODE_ENV === 'production' ? 'cloudflare' : 'ipx',
		cloudflare: {
			baseURL: 'https://majalengka.tech'
		},
		quality: 80,
		format: ['webp', 'avif'],
		domains: [
			'images.unsplash.com',
			'avatars.githubusercontent.com',
			'lh3.googleusercontent.com'
		]
	},

	ogImage: {
		zeroRuntime: true
	}
})
