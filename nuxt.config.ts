// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	modules: [
		'@nuxt/eslint',
		'@nuxt/image',
		'nanime',
		'@nuxt/ui',
		'@nuxtjs/seo',
		'@nuxt/content',
		'@vueuse/nuxt',
		'@nuxthub/core',
		'@nuxtjs/better-auth',
		'nuxt-llms'
	],

	devtools: {
		enabled: true
	},

	// Gaya transisinya ada di main.css dan hanya aktif di bawah .motion-ready; tanpa itu Vue langsung mengganti halaman.
	app: {
		pageTransition: { name: 'page', mode: 'out-in' },
		layoutTransition: { name: 'layout', mode: 'out-in' }
	},

	css: ['~/assets/css/main.css'],

	site: {
		url: process.env.NUXT_SITE_URL || 'https://majalengka.tech',
		name: 'Majalengka Tech',
		description: 'Etalase karya developer dan desainer Majalengka',
		defaultLocale: 'id',
		indexable: true
	},

	content: {
		experimental: {
			sqliteConnector: 'native'
		}
	},

	runtimeConfig: {
		betterAuthSecret: process.env.NUXT_BETTER_AUTH_SECRET || process.env.BETTER_AUTH_SECRET || '',
		superAdminIds: process.env.NUXT_SUPER_ADMIN_IDS || '',
		oauth: {
			githubClientId: process.env.NUXT_OAUTH_GITHUB_CLIENT_ID || process.env.GITHUB_CLIENT_ID || '',
			githubClientSecret: process.env.NUXT_OAUTH_GITHUB_CLIENT_SECRET || process.env.GITHUB_CLIENT_SECRET || '',
			googleClientId: process.env.NUXT_OAUTH_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || '',
			googleClientSecret: process.env.NUXT_OAUTH_GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET || ''
		},
		public: {
			siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'https://majalengka.tech'
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
				vars: {
					BETTER_AUTH_URL: 'https://majalengka.tech',
					NUXT_PUBLIC_SITE_URL: 'https://majalengka.tech'
				},
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
						database_id: process.env.CLOUDFLARE_D1_DATABASE_ID || '84289e0a-899d-41a7-ab83-cf488e91d29d',
						// D1 produksi mencatat migrasi di tabel bawaan wrangler; path relatif terhadap .output/server/wrangler.json.
						migrations_table: 'd1_migrations',
						migrations_dir: '../../server/db/migrations/sqlite'
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
				'/llms.txt',
				'/llms-full.txt'
			],
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
		format: ['avif', 'webp'],
		// Nuxt Image v2 tidak punya breakpoint xs, jadi ukuran default di prop sizes ditulis dalam px (vw tanpa prefix dihitung jadi 1px).
		// Cloudflare memilih AVIF atau WebP sendiri dari header Accept (f=auto); IPX di lokal tidak mengenal 'auto'.
		presets: {
			sampul: {
				modifiers: {
					format: process.env.NODE_ENV === 'production' ? 'auto' : 'webp',
					fit: 'cover'
				}
			},
			galeri: {
				modifiers: {
					format: process.env.NODE_ENV === 'production' ? 'auto' : 'webp',
					fit: 'contain'
				}
			}
		},
		domains: [
			'images.unsplash.com',
			'avatars.githubusercontent.com',
			'lh3.googleusercontent.com'
		]
	},

	llms: {
		domain: 'https://majalengka.tech',
		title: 'Majalengka Tech',
		description: 'Etalase karya developer dan desainer Majalengka',
		notes: [
			'Dibangun dengan Nuxt 4, Nuxt Content v3, Nuxt UI v4, Cloudflare D1, Cloudflare R2, dan Better Auth.',
			'Menyediakan showcase karya, profil kreator di /username, panduan pemakaian, dan catatan rilis.'
		],
		full: {
			title: 'Majalengka Tech Full Content',
			description: 'Panduan pemakaian, panduan kontribusi kode, dan catatan rilis Majalengka Tech.'
		},
		sections: [
			{
				title: 'Panduan',
				description: 'Cara memamerkan karya, mengatur profil kreator, apresiasi dan komentar, serta berkontribusi pada kode Majalengka Tech',
				contentCollection: 'docs'
			},
			{
				title: 'Blog',
				description: 'Tulisan dari komunitas Majalengka Tech',
				contentCollection: 'posts'
			},
			{
				title: 'Changelog',
				description: 'Catatan rilis dan riwayat pembaruan platform Majalengka Tech',
				contentCollection: 'versions'
			}
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
				'https://github.com/majalengkatech'
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
