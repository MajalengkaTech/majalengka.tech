// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	modules: [
		'@nuxt/eslint',
		'@nuxt/image',
		'@nuxt/ui',
		'@nuxtjs/seo',
		'@nuxt/content',
		'@vueuse/nuxt',
		'@nuxthub/core',
		'@nuxtjs/better-auth'
	],

	devtools: {
		enabled: true
	},

	css: ['~/assets/css/main.css'],

	site: {
		url: process.env.NUXT_SITE_URL || 'https://majalengka.tech',
		name: 'Majalengka Tech',
		description: 'Komunitas Open Source, Riset Teknologi Lokal & Talenta Digital Majalengka',
		defaultLocale: 'id',
		indexable: true
	},

	content: {
		experimental: {
			sqliteConnector: 'native'
		}
	},

	routeRules: {
		'/docs': { redirect: '/docs/getting-started', prerender: false },
		'/projek': { prerender: false },
		'/projek/**': { prerender: false },
		'/dashboard/**': { auth: 'user', prerender: false, ssr: false, robots: false, sitemap: false },
		'/kelola/**': { auth: 'user', prerender: false, ssr: false, robots: false, sitemap: false },
		'/api/**': { prerender: false, robots: false, sitemap: false }
	},

	compatibilityDate: '2026-06-30',

	nitro: {
		preset: 'cloudflare_module',
		cloudflare: {
			deployConfig: true,
			pages: {
				routes: {
					exclude: [
						'/assets/*',
						'/images/*',
						'/__og-image__/*',
						'/_og/*',
						'/*.{js,css,png,jpg,jpeg,webp,svg,ico,json}'
					]
				}
			},
			wrangler: {
				name: 'majalengka-tech',
				routes: [
					{
						pattern: 'majalengka.tech',
						custom_domain: true
					}
				],
				d1_databases: [
					{
						binding: 'DB',
						database_name: 'majalengka-tech-db',
						database_id: process.env.CLOUDFLARE_D1_DATABASE_ID || '84289e0a-899d-41a7-ab83-cf488e91d29d'
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
			routes: [],
			crawlLinks: false,
			ignore: [
				'/projek',
				'/dashboard',
				'/kelola',
				'/api'
			]
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
	},

	robots: {
		groups: [
			{
				userAgent: '*',
				disallow: [
					'/dashboard',
					'/kelola'
				]
			}
		]
	},

	schemaOrg: {
		identity: {
			type: 'Organization',
			name: 'Majalengka Tech',
			url: 'https://majalengka.tech',
			logo: '/logo-circle.svg',
			sameAs: [
				'https://github.com/majalengka-tech'
			]
		}
	},

	sitemap: {
		exclude: [
			'/dashboard/**',
			'/kelola/**',
			'/api/**'
		]
	}
})
