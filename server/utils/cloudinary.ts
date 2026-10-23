import { v2 as cloudinary } from 'cloudinary'

export function hasCloudinaryCredentials(): boolean {
	const config = useRuntimeConfig()
	const cloudName = config.cloudinary?.cloudName || process.env.NUXT_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME
	const apiKey = config.cloudinary?.apiKey || process.env.NUXT_CLOUDINARY_API_KEY || process.env.CLOUDINARY_API_KEY
	const apiSecret = config.cloudinary?.apiSecret || process.env.NUXT_CLOUDINARY_API_SECRET || process.env.CLOUDINARY_API_SECRET
	return Boolean(cloudName && apiKey && apiSecret)
}

export function useCloudinaryClient() {
	const config = useRuntimeConfig()
	const cloudName = config.cloudinary?.cloudName || process.env.NUXT_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME || 'daton7ry4'
	const apiKey = config.cloudinary?.apiKey || process.env.NUXT_CLOUDINARY_API_KEY || process.env.CLOUDINARY_API_KEY
	const apiSecret = config.cloudinary?.apiSecret || process.env.NUXT_CLOUDINARY_API_SECRET || process.env.CLOUDINARY_API_SECRET

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

export async function uploadToCloudinary(
	buffer: Buffer,
	options: {
		folder?: string
		rootFolder?: string
		publicId?: string
		tags?: string[]
	} = {}
): Promise<CloudinaryUploadResult> {
	const client = useCloudinaryClient()
	const root = options.rootFolder || 'majalengka.tech'
	// Bersihkan nama subfolder agar hanya berisi karakter aman
	const subfolder = (options.folder || 'projek').replace(/[^a-zA-Z0-9_-]/g, '')
	const targetFolder = `${root}/${subfolder}`

	return new Promise<CloudinaryUploadResult>((resolve, reject) => {
		const uploadStream = client.uploader.upload_stream(
			{
				folder: targetFolder,
				public_id: options.publicId,
				resource_type: 'image',
				tags: options.tags || ['majalengka.tech', subfolder],
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

export async function deleteFromCloudinary(publicIdOrUrl: string) {
	if (!hasCloudinaryCredentials()) return
	try {
		const client = useCloudinaryClient()
		let publicId = publicIdOrUrl

		// Ekstrak public_id jika formatnya full URL Cloudinary
		if (publicIdOrUrl.includes('res.cloudinary.com')) {
			const match = publicIdOrUrl.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-zA-Z0-9]+)?$/)
			if (match && match[1]) {
				publicId = match[1]
			}
		}

		if (publicId.startsWith('majalengka.tech/')) {
			await client.uploader.destroy(publicId)
		}
	} catch (error) {
		console.warn('[Cloudinary] Gagal menghapus gambar:', publicIdOrUrl, error)
	}
}
