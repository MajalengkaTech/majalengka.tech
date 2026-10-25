// https://nuxt.com/docs/api/configuration/nuxt-config
import { existsSync, readdirSync } from 'node:fs'
import { join, relative } from 'node:path'

// Halaman panduan dan blog di-prerender jadi file statis, jadi tidak dirender ulang di server. crawlLinks dimatikan,
// jadi rutenya dibaca dari folder content: awalan angka ("1.docs") dibuang dan index.md jadi rute induknya.
function contentRoutes(folder: string) {
	const root = join('content', folder)
	if (!existsSync(root)) return []
	const files = readdirSync(root, { recursive: true, withFileTypes: true })
		.filter(entry => entry.isFile() && entry.name.endsWith('.md'))
		.map(entry => relative('content', join(entry.parentPath, entry.name)))
	return files.map((file) => {
		const path = file.replaceAll('\\', '/').replace(/\.md$/, '').split('/').map(part => part.replace(/^\d+\./, ''))
		if (path.at(-1) === 'index') path.pop()
		return `/${path.join('/')}`
	})
}

// libsql memuat binary-nya lewat require dinamis (`@libsql/${target}`), jadi index.node tidak terlacak saat build
// dan server gagal start. Paket binary untuk platform mesin build didaftarkan manual supaya ikut ke .output.
function libsqlNativePackages() {
	const root = join(process.cwd(), 'node_modules', '@libsql')
	if (!existsSync(root)) return []
	return readdirSync(root)
		.map(name => join(root, name, 'index.node'))
		.filter(file => existsSync(file))
}

export default defineNuxtConfig({
	modules: [
		'@nuxt/eslint',
		'@nuxt/image',
		'@nuxtjs/cloudinary',
		'motion-v/nuxt',
		'@nuxt/ui',
		'@nuxtjs/seo',
		'@nuxt/content',
		'@vueuse/nuxt',
		'@nuxthub/core',
		// Sesudah @nuxthub/core: log aktivitas disimpan di tabel evlog_events pada database yang sama.
		'@evlog/nuxthub',
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
		description: 'Tempat developer dan desainer Majalengka memamerkan proyeknya',
		defaultLocale: 'id',
		indexable: true
	},

	content: {
		experimental: {
			sqliteConnector: 'native'
		}
	},

	// Secret sengaja kosong di sini: kalau diisi dari process.env, nilainya ikut tertanam di .output saat build.
	// Isinya dibaca saat runtime dari env NUXT_* (misalnya NUXT_CLOUDINARY_API_SECRET, NUXT_OAUTH_GITHUB_CLIENT_SECRET).
	runtimeConfig: {
		betterAuthSecret: '',
		superAdminIds: '',
		cloudinary: {
			cloudName: process.env.NUXT_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME || 'daton7ry4',
			apiKey: '',
			apiSecret: ''
		},
		oauth: {
			githubClientId: '',
			githubClientSecret: '',
			googleClientId: '',
			googleClientSecret: ''
		},
		public: {
			siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'https://majalengka.tech'
		}
	},

	routeRules: {
		// Halaman publik dinamis (/, /projek, /kreator, /tentang, profil) di-cache di edge oleh server/middleware/edge-cache.ts,
		// dengan kunci yang memuat versi data supaya selalu terbaru. Jangan pasang swr di sini: datanya bisa tertinggal.
		'/docs': { redirect: '/docs/getting-started', prerender: false },
		'/docs/**': { prerender: true },
		'/blog': { prerender: true },
		'/blog/**': { prerender: true },
		'/changelog': { prerender: true },
		// Jangan pasang swr/cache di route API yang punya handler POST atau butuh sesi: cache Nitro membungkus
		// semua method di route itu dan membuang cookie, sehingga POST /api/projects pernah membalas hasil cache GET.
		'/api/files/**': { headers: { 'cache-control': 'public, max-age=31536000, immutable' } },
		'/dashboard': { auth: 'user', prerender: false, ssr: false, robots: false, sitemap: false },
		'/dashboard/**': { auth: 'user', prerender: false, ssr: false, robots: false, sitemap: false },
		'/kelola': { auth: 'user', prerender: false, ssr: false, robots: false, sitemap: false },
		'/kelola/**': { auth: 'user', prerender: false, ssr: false, robots: false, sitemap: false },
		'/api/admin/**': { prerender: false, robots: false, sitemap: false },
		'/api/user/**': { prerender: false, robots: false, sitemap: false }
	},

	compatibilityDate: '2026-06-30',

	nitro: {
		preset: process.env.NITRO_PRESET || 'node-server',
		externals: {
			external: ['@resvg/resvg-js'],
			traceInclude: libsqlNativePackages()
		},
		prerender: {
			routes: [
				'/llms.txt',
				'/llms-full.txt',
				'/blog',
				'/changelog',
				...contentRoutes('1.docs'),
				...contentRoutes('3.blog')
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
		db: {
			dialect: 'sqlite',
			applyMigrationsDuringBuild: false
		},
		blob: true
	},

	vite: {
		optimizeDeps: {
			include: [
				'zod',
				'@vue/devtools-core',
				'animejs',
				// Editor cerita proyek (TipTap): satu instance prosemirror supaya tidak muncul galat plugin ganda di dev.
				'@nuxt/ui > prosemirror-state',
				'@nuxt/ui > prosemirror-transform',
				'@nuxt/ui > prosemirror-model',
				'@nuxt/ui > prosemirror-view',
				'@nuxt/ui > prosemirror-gapcursor'
			],
			exclude: [
				'easings',
				'spring'
			]
		}
	},

	// Nuxt SEO v6 ikut memasang AI Ready, padahal llms.txt sudah dibuat nuxt-llms.
	aiReady: false,

	cloudinary: {
		cloudName: process.env.NUXT_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME || 'daton7ry4'
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

	// Log aktivitas untuk Super Admin (/kelola/log). Yang disimpan hanya aksi yang mengubah data, error, dan penolakan;
	// aturannya di server/plugins/evlog.ts. GET yang berhasil tidak disimpan supaya tabelnya tidak penuh oleh kunjungan biasa.
	evlog: {
		env: { service: 'majalengka-tech' },
		include: ['/api/**'],
		// Jangan pakai pola berisi "*/": evlog menyisipkan konfigurasi ini ke komentar kode dan pola itu menutup komentarnya.
		exclude: ['/api/_nuxt_icon/**', '/api/files/**', '/api/creators/**', '/api/_cron/**'],
		retention: '14d',
		sampling: {
			rates: { info: 0 },
			keep: [{ status: 400 }, { duration: 3000 }]
		}
	},

	image: {
		// URL Cloudinary diolah Cloudinary, sisanya IPX (app/providers/gambar.ts). ipx tetap diisi supaya route /_ipx terpasang.
		provider: 'gambar',
		providers: {
			gambar: { provider: '~/providers/gambar.ts' }
		},
		ipx: {},
		quality: 80,
		format: ['avif', 'webp'],
		presets: {
			sampul: {
				modifiers: {
					format: 'auto',
					fit: 'cover'
				}
			},
			galeri: {
				modifiers: {
					format: 'auto',
					fit: 'contain'
				}
			}
		},
		domains: [
			'res.cloudinary.com',
			'images.unsplash.com',
			'avatars.githubusercontent.com',
			'lh3.googleusercontent.com'
		]
	},

	linkChecker: {
		enabled: false
	},

	llms: {
		domain: 'https://majalengka.tech',
		title: 'Majalengka Tech',
		description: 'Tempat developer dan desainer Majalengka memamerkan proyeknya',
		notes: [
			'Dibangun dengan Nuxt 4, Nuxt Content v3, Nuxt UI v4, NuxtHub (SQLite), Cloudinary, dan Better Auth, berjalan di VPS dengan Docker.',
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
	},

	// Nuxt SEO v6 ikut memasang Skew Protection; belum dikonfigurasi untuk server ini, jadi dimatikan dulu.
	skewProtection: false
})
