import { v2 as cloudinary } from 'cloudinary'

const ROOT_FOLDER = 'majalengka.tech'
export const CLOUDINARY_FOLDERS = ['projek', 'avatar', 'tutorial'] as const
export type CloudinaryFolder = typeof CLOUDINARY_FOLDERS[number]

// Cloudinary sendiri memeriksa isi file, jadi SVG yang diberi tipe image/png tetap ditolak.
const ALLOWED_FORMATS = ['png', 'jpg', 'jpeg', 'webp', 'gif']

function cloudinaryConfig() {
	const config = useRuntimeConfig()
	return {
		cloudName: config.cloudinary?.cloudName || process.env.NUXT_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME || '',
		apiKey: config.cloudinary?.apiKey || process.env.NUXT_CLOUDINARY_API_KEY || process.env.CLOUDINARY_API_KEY || '',
		apiSecret: config.cloudinary?.apiSecret || process.env.NUXT_CLOUDINARY_API_SECRET || process.env.CLOUDINARY_API_SECRET || ''
	}
}

export function hasCloudinaryCredentials(): boolean {
	const { cloudName, apiKey, apiSecret } = cloudinaryConfig()
	return Boolean(cloudName && apiKey && apiSecret)
}

export function useCloudinaryClient() {
	const { cloudName, apiKey, apiSecret } = cloudinaryConfig()
	cloudinary.config({
		cloud_name: cloudName,
		api_key: apiKey,
		api_secret: apiSecret,
		secure: true
	})
	return cloudinary
}

export interface CloudinaryUploadResult {
	url: string
	publicId: string
	format: string
	width: number
	height: number
	bytes: number
}

// File disimpan di majalengka.tech/<folder>/<ownerId>/ supaya kepemilikannya bisa dicek dari public_id saat dihapus.
export async function uploadToCloudinary(
	buffer: Buffer,
	options: { folder: CloudinaryFolder, ownerId: string }
): Promise<CloudinaryUploadResult> {
	const client = useCloudinaryClient()

	return new Promise<CloudinaryUploadResult>((resolve, reject) => {
		const uploadStream = client.uploader.upload_stream(
			{
				folder: `${ROOT_FOLDER}/${options.folder}/${options.ownerId}`,
				resource_type: 'image',
				allowed_formats: ALLOWED_FORMATS,
				tags: [ROOT_FOLDER, options.folder, `user-${options.ownerId}`],
				overwrite: false,
				use_filename: false,
				unique_filename: true
			},
			(error, result) => {
				if (error || !result) {
					return reject(error || new Error('Gagal mengunggah gambar ke Cloudinary'))
				}
				resolve({
					url: result.secure_url,
					publicId: result.public_id,
					format: result.format,
					width: result.width,
					height: result.height,
					bytes: result.bytes
				})
			}
		)
		uploadStream.end(buffer)
	})
}

// public_id dari URL res.cloudinary.com milik akun ini, atau null kalau URL-nya dari tempat lain.
export function cloudinaryPublicId(url: string | null | undefined) {
	if (!url) return null
	let parsed: URL
	try {
		parsed = new URL(url)
	} catch {
		return null
	}
	if (parsed.protocol !== 'https:' || parsed.hostname !== 'res.cloudinary.com') return null

	const { cloudName } = cloudinaryConfig()
	const match = decodeURIComponent(parsed.pathname).match(/^\/([^/]+)\/image\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-z0-9]+)?$/i)
	if (!match || match[1] !== cloudName) return null
	return match[2]!.startsWith(`${ROOT_FOLDER}/`) ? match[2]! : null
}

// Alamat gambar Cloudinary di dalam Markdown (cerita proyek atau tutorial), untuk dibersihkan saat kontennya dihapus.
export function cloudinaryUrlsIn(markdown: string | null | undefined) {
	return [...new Set((markdown || '').match(/https:\/\/res\.cloudinary\.com\/[^\s)"'<>]+/g) ?? [])]
}

export function isCloudinaryUrl(url: string | null | undefined) {
	return cloudinaryPublicId(url) !== null
}

// Gambar sebelum folder per user (hasil migrasi R2 dan unggahan awal di VPS) dicek lewat tag user-<id>.
async function isOwnedCloudinaryImage(publicId: string, ownerId: string) {
	if (CLOUDINARY_FOLDERS.some(folder => publicId.startsWith(`${ROOT_FOLDER}/${folder}/${ownerId}/`))) return true
	const resource = await useCloudinaryClient().api.resource(publicId, { tags: true }) as { tags?: string[] }
	return resource.tags?.includes(`user-${ownerId}`) ?? false
}

// Gambar milik user lain tidak dihapus, walaupun URL-nya ditempel sebagai gambar proyek ini.
export async function deleteOwnedCloudinaryImage(url: string, ownerId: string) {
	const publicId = cloudinaryPublicId(url)
	if (!publicId || !hasCloudinaryCredentials()) return
	try {
		if (!await isOwnedCloudinaryImage(publicId, ownerId)) return
		await useCloudinaryClient().uploader.destroy(publicId)
	} catch (error) {
		console.warn('[Cloudinary] Gagal menghapus gambar:', publicId, error)
	}
}
