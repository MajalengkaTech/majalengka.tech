import { z } from 'zod'

export const CREATOR_ROLES = {
	developer: 'Developer',
	desainer: 'Desainer',
	keduanya: 'Developer & Desainer'
} as const

export type CreatorRole = keyof typeof CREATOR_ROLES

const creatorRoleValues = Object.keys(CREATOR_ROLES) as [CreatorRole, ...CreatorRole[]]

// Username menjadi alamat profil di level teratas (/username), jadi nama yang bentrok atau mungkin dipakai rute situs ditolak.
const RESERVED_USERNAMES = new Set([
	// Rute yang sudah ada
	'api', 'auth', 'blog', 'changelog', 'dashboard', 'docs', 'kelola', 'login', 'logout', 'projek', 'signup', 'tentang',
	// Nama yang wajar dipakai halaman situs nanti
	'about', 'acara', 'admin', 'assets', 'bantuan', 'cari', 'daftar', 'dukung', 'edit', 'event', 'feed', 'files', 'galeri',
	'help', 'kartu', 'karya', 'kategori', 'kebijakan', 'keluar', 'komunitas', 'kontribusi', 'kreator', 'lowongan', 'masuk',
	'me', 'new', 'og', 'panduan', 'pricing', 'privacy', 'privasi', 'profil', 'profile', 'public', 'raw', 'register', 'rss',
	'search', 'settings', 'showcase', 'sitemap', 'static', 'status', 'syarat', 'tag', 'terms', 'user', 'users', 'www',
	// Identitas situs
	'majalengka', 'majalengkatech'
])

export const usernameSchema = z.string()
	.trim()
	.toLowerCase()
	.min(3, 'Username minimal 3 karakter')
	.max(30, 'Username maksimal 30 karakter')
	.regex(/^[a-z0-9](?:[a-z0-9_-]*[a-z0-9])?$/, 'Pakai huruf kecil, angka, - atau _, dan tidak diawali atau diakhiri simbol')
	.refine(name => !RESERVED_USERNAMES.has(name), 'Username ini dipakai sistem, coba yang lain')

const optionalUrl = (message: string) => z.string().url(message).or(z.literal('')).optional().nullable()

export const profileInputSchema = z.object({
	name: z.string().trim().min(2, 'Nama minimal 2 karakter').max(100, 'Nama maksimal 100 karakter'),
	username: usernameSchema.or(z.literal('')).optional().nullable(),
	bio: z.string().max(500, 'Bio maksimal 500 karakter').optional().nullable(),
	avatarUrl: optionalUrl('URL avatar tidak valid'),
	creatorRole: z.enum(creatorRoleValues).optional().nullable(),
	location: z.string().max(80, 'Lokasi maksimal 80 karakter').optional().nullable(),
	skills: z.string().max(200, 'Skill maksimal 200 karakter').optional().nullable(),
	openToWork: z.boolean().optional(),
	githubUsername: z.string().max(50, 'Username GitHub maksimal 50 karakter').optional().nullable(),
	websiteUrl: optionalUrl('URL website harus diawali https:// atau http://'),
	designUrl: optionalUrl('URL Dribbble atau Behance tidak valid'),
	linkedinUrl: optionalUrl('URL LinkedIn tidak valid')
})

export type ProfileInput = z.output<typeof profileInputSchema>
