import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { v2 as cloudinary } from 'cloudinary'
import { writeFileSync, unlinkSync } from 'node:fs'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

// Skrip sekali jalan: semua kunci dibaca dari env, jangan ditulis di sini karena repo ini publik.
function requireEnv(...names: string[]) {
	for (const name of names) {
		if (process.env[name]) return process.env[name] as string
	}
	throw new Error(`Env ${names.join(' atau ')} belum diisi.`)
}

cloudinary.config({
	cloud_name: requireEnv('NUXT_CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_CLOUD_NAME'),
	api_key: requireEnv('NUXT_CLOUDINARY_API_KEY', 'CLOUDINARY_API_KEY'),
	api_secret: requireEnv('NUXT_CLOUDINARY_API_SECRET', 'CLOUDINARY_API_SECRET'),
	secure: true
})

const s3 = new S3Client({
	region: 'auto',
	endpoint: requireEnv('R2_S3_ENDPOINT'),
	credentials: {
		accessKeyId: requireEnv('R2_ACCESS_KEY_ID'),
		secretAccessKey: requireEnv('R2_SECRET_ACCESS_KEY')
	}
})

const BUCKET = 'majalengkatech'

// 29 Gambar yang ada di database Majalengka Tech
const filePaths = [
	'/api/files/Projek/0gF7xae2URrdjZ97qoZLibXd45ssJWiX/01-beranda-23b0949a.png',
	'/api/files/Projek/LtCPVnT43t2J73Re2TTOGpxjfWPMXjnW/WhatsApp Image 2026-10-04 at 15.53.33-b649b3e6.jpeg',
	'/api/files/Projek/WbHhl3G9imjmOhLmExJwngicxlBdKnKK/Screenshot 2026-10-05 at 10.40.35-79660d1c.png',
	'/api/files/Projek/GQoTuFaDS7oaSIOwbtidpm1PYs05uFxW/0) Beranda-9f119e2e.png',
	'/api/files/Projek/0gF7xae2URrdjZ97qoZLibXd45ssJWiX/screenshot-2026-10-19-165314-76fd736a.png',
	'/api/files/Projek/0gF7xae2URrdjZ97qoZLibXd45ssJWiX/02-tahap-merencanakan-0ee5f262.png',
	'/api/files/Projek/0gF7xae2URrdjZ97qoZLibXd45ssJWiX/03-lihat-contoh-d4d3e9f0.png',
	'/api/files/Projek/0gF7xae2URrdjZ97qoZLibXd45ssJWiX/04-progres-99ae9386.png',
	'/api/files/Projek/0gF7xae2URrdjZ97qoZLibXd45ssJWiX/05-pilihan-warna-ab87fa18.png',
	'/api/files/Projek/0gF7xae2URrdjZ97qoZLibXd45ssJWiX/06-beranda-gelap-b2b7ae47.png',
	'/api/files/Projek/0gF7xae2URrdjZ97qoZLibXd45ssJWiX/07-panduan-fd3ed71c.png',
	'/api/files/Projek/0gF7xae2URrdjZ97qoZLibXd45ssJWiX/08-tampilan-ponsel-fdf1d912.png',
	'/api/files/Projek/LtCPVnT43t2J73Re2TTOGpxjfWPMXjnW/WhatsApp Image 2026-10-04 at 16.13.47-4b226efa.jpeg',
	'/api/files/Projek/LtCPVnT43t2J73Re2TTOGpxjfWPMXjnW/WhatsApp Image 2026-10-04 at 16.25.11-0da8e6e4.jpeg',
	'/api/files/Projek/LtCPVnT43t2J73Re2TTOGpxjfWPMXjnW/WhatsApp Image 2026-10-04 at 16.25.17-ed9fa288.jpeg',
	'/api/files/Projek/LtCPVnT43t2J73Re2TTOGpxjfWPMXjnW/WhatsApp Image 2026-10-04 at 16.25.42-e0e5bde4.jpeg',
	'/api/files/Projek/LtCPVnT43t2J73Re2TTOGpxjfWPMXjnW/WhatsApp Image 2026-10-04 at 16.26.01-477fee60.jpeg',
	'/api/files/Projek/LtCPVnT43t2J73Re2TTOGpxjfWPMXjnW/WhatsApp Image 2026-10-04 at 16.26.19-39521460.jpeg',
	'/api/files/Projek/WbHhl3G9imjmOhLmExJwngicxlBdKnKK/Screenshot 2026-10-05 at 09.43.16-c98da4b5.png',
	'/api/files/Projek/GQoTuFaDS7oaSIOwbtidpm1PYs05uFxW/1) Dashboard-fb26fbe1.png',
	'/api/files/Projek/GQoTuFaDS7oaSIOwbtidpm1PYs05uFxW/3) Grafik Pengeluaran-3aceeb58.png',
	'/api/files/Projek/GQoTuFaDS7oaSIOwbtidpm1PYs05uFxW/4) Pembayaran Sewa-9be2b4f9.png',
	'/api/files/Projek/GQoTuFaDS7oaSIOwbtidpm1PYs05uFxW/5) PDF Kwitansi-8cb60e2c.png',
	'/api/files/Projek/GQoTuFaDS7oaSIOwbtidpm1PYs05uFxW/7) Manajemen Proyek-44dbe88b.png',
	'/api/files/Projek/GQoTuFaDS7oaSIOwbtidpm1PYs05uFxW/10) ROI Calculator (Kalkulator Balik Modal)-f80e6758.png',
	'/api/files/Projek/GQoTuFaDS7oaSIOwbtidpm1PYs05uFxW/11) Manajemen Pengguna dan Staff-516d83f7.png',
	'/api/files/Projek/GQoTuFaDS7oaSIOwbtidpm1PYs05uFxW/12) Pengaturan-1577b2e3.png',
	'/api/files/Projek/0gF7xae2URrdjZ97qoZLibXd45ssJWiX/screenshot-2026-10-19-165404-f05e1b7a.png',
	'/api/files/Projek/0gF7xae2URrdjZ97qoZLibXd45ssJWiX/screenshot-2026-10-19-165505-908327e4.png'
]

console.log(`Ditemukan ${filePaths.length} gambar untuk dimigrasi ke Cloudinary.\n`)

const migrationMap = new Map<string, string>()

for (const [index, path] of filePaths.entries()) {
	const r2Key = path.replace(/^\/api\/files\//, '')
	console.log(`[${index + 1}/${filePaths.length}] Mengambil langsung via S3 API dari R2: ${r2Key}...`)

	try {
		const command = new GetObjectCommand({ Bucket: BUCKET, Key: r2Key })
		const s3Res = await s3.send(command)
		const byteArray = await s3Res.Body?.transformToByteArray()
		if (!byteArray || byteArray.length === 0) {
			console.warn(`  ⚠️ File kosong dari R2: ${r2Key}`)
			continue
		}

		const buffer = Buffer.from(byteArray)
		console.log(`  ⬆️ Mengunggah stream buffer (${buffer.length} bytes) ke Cloudinary (folder: majalengka.tech/projek)...`)

		const uploadRes = await new Promise<{ secure_url: string }>((resolve, reject) => {
			const stream = cloudinary.uploader.upload_stream(
				{
					folder: 'majalengka.tech/projek',
					resource_type: 'image',
					use_filename: false,
					unique_filename: true,
					tags: ['majalengka.tech', 'projek', 'migrated-from-r2']
				},
				(error, result) => {
					if (error || !result) reject(error || new Error('Upload stream gagal'))
					else resolve(result)
				}
			)
			stream.end(buffer)
		})

		console.log(`  ✅ Berhasil: ${uploadRes.secure_url}`)
		migrationMap.set(path, uploadRes.secure_url)
	} catch (err: unknown) {
		const e = err as { message?: string }
		console.error(`  ❌ Galat saat memigrasi ${r2Key}:`, e.message || e)
	}
}

console.log(`\n🎉 Berhasil mengunggah ${migrationMap.size} dari ${filePaths.length} gambar ke Cloudinary!`)

// Update database SQLite di VPS
if (migrationMap.size > 0) {
	console.log('\n📝 Memperbarui URL gambar di database VPS...')
	const updateStatements: string[] = []

	for (const [oldUrl, newUrl] of migrationMap.entries()) {
		updateStatements.push(`UPDATE projects SET thumbnail_url = '${newUrl}' WHERE thumbnail_url = '${oldUrl}';`)
		updateStatements.push(`UPDATE project_images SET url = '${newUrl}' WHERE url = '${oldUrl}';`)
	}

	const sqlFile = join(process.cwd(), 'temp_migration.sql')
	writeFileSync(sqlFile, updateStatements.join('\n') + '\n', 'utf-8')

	// Contoh: VPS_SSH="ssh -i kunci.key ubuntu@1.2.3.4" dan VPS_DB_PATH="/home/ubuntu/majalengka.tech/.data/db/sqlite.db".
	const sshCommand = requireEnv('VPS_SSH')
	const dbPath = requireEnv('VPS_DB_PATH')
	const PS = 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe'
	spawnSync(PS, ['-Command', `Get-Content "${sqlFile}" | ${sshCommand} "sqlite3 ${dbPath}"`], { stdio: 'inherit' })
	unlinkSync(sqlFile)

	console.log('✅ Database VPS berhasil diperbarui dengan URL Cloudinary!')
}
