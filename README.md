# Majalengka Tech

Tempat developer dan desainer Majalengka memamerkan proyeknya, membangun profil, dan saling memberi apresiasi.

**Situs:** [majalengka.tech](https://majalengka.tech)

[![Nuxt](https://img.shields.io/badge/Nuxt-4-00DC82?logo=nuxt.js)](https://nuxt.com)
[![Nuxt UI](https://img.shields.io/badge/Nuxt_UI-4-00DC82?logo=nuxt.js)](https://ui.nuxt.com)
[![Bun](https://img.shields.io/badge/Bun-package_manager-FBF0DF?logo=bun)](https://bun.sh)
[![Lisensi MIT](https://img.shields.io/badge/Lisensi-MIT-green.svg)](LICENSE)

## Yang bisa dilakukan di situs ini

- **Showcase proyek.** Semua proyek yang sudah terbit, bisa disaring per kategori, diurutkan dari yang terbaru atau terpopuler, dan dicari berdasarkan judul, teknologi, atau nama kreator.
- **Halaman proyek.** Galeri sampai 8 gambar, cerita di balik proyek, peran kreator, teknologi yang dipakai, serta tautan ke demo, desain, dan kode sumber.
- **Apresiasi dan komentar.** Pengunjung yang sudah masuk bisa memberi apresiasi dan menulis komentar.
- **Profil kreator** di `majalengka.tech/username`, lengkap dengan kartu kreator yang bisa diunduh dan dipakai sebagai pratinjau link.
- **Dashboard kreator.** Pamerkan proyek baru, simpan sebagai Draf, edit profil, dan cek kelengkapan profil.
- **Halaman admin.** Kelola Pengguna dan Kelola Proyek, termasuk memilih proyek untuk Pilihan Kurator.
- **Panduan dan catatan rilis** di `/docs` dan `/changelog`.
- **Konten untuk alat AI** di `/llms.txt` dan `/llms-full.txt`.

## Teknologi

| Bagian | Teknologi |
|---|---|
| Framework | Nuxt 4 |
| Komponen UI | Nuxt UI 4 dengan Tailwind CSS 4 |
| Konten (panduan, changelog) | Nuxt Content 3 |
| Database dan penyimpanan file | NuxtHub dengan Cloudflare D1 dan R2, lewat Drizzle ORM |
| Login | Better Auth (email dan kata sandi, GitHub, Google) |
| Gambar | Nuxt Image dengan Cloudflare Image Transformations |
| Animasi | Anime.js v4 lewat modul nanime |
| Hosting | Cloudflare Workers |
| Package manager | Bun |

## Menjalankan di komputermu

1. Clone repositori, lalu pasang dependensi:

   ```bash
   git clone https://github.com/majalengkatech/majalengka.tech.git
   cd majalengka.tech
   bun install
   ```

2. Salin `.env.example` menjadi `.env`, lalu isi `NUXT_BETTER_AUTH_SECRET` dengan teks acak minimal 32 karakter. Isian OAuth GitHub dan Google boleh dikosongkan kalau kamu cukup masuk dengan email.

3. Jalankan server pengembangan:

   ```bash
   bun run dev
   ```

   Database SQLite lokal dibuat di `.data/`, dan migrasinya berjalan otomatis.

Unggah gambar belum bisa dicoba di komputer lokal, karena penyimpanan Cloudflare R2 hanya tersedia di Cloudflare. Untuk mencoba form proyek, tempel link gambar `https://`.

## Perintah

| Perintah | Kegunaan |
|---|---|
| `bun run dev` | Server pengembangan di `http://localhost:3000` |
| `bun run lint` | ESLint, termasuk aturan kelas Tailwind |
| `bun run typecheck` | Pemeriksaan tipe TypeScript |
| `NODE_OPTIONS=--max-old-space-size=8192 bun run build` | Build produksi. Butuh memori lebih besar dari bawaan Node. |

## Database

Struktur tabel ada di `server/db/schema.ts`. Setelah mengubahnya, buat file migrasi dengan:

```bash
bunx nuxt-db generate
```

Jangan menulis atau mengubah tabel lewat skrip manual. Di lokal, migrasi berjalan otomatis saat `bun run dev`. Di produksi, migrasi dijalankan pengelola setelah pull request digabungkan.

## Rilis

- Setiap push dan pull request ke `main` menjalankan lint dan typecheck di GitHub Actions.
- Cloudflare membangun dan men-deploy `main` secara otomatis.
- Catatan setiap rilis ditulis di `content/4.changelog/` dan tampil di [majalengka.tech/changelog](https://majalengka.tech/changelog).

## Struktur folder

| Folder | Isi |
|---|---|
| `app/` | Halaman, komponen, layout, dan composable |
| `server/` | API, skema database, dan migrasi |
| `shared/` | Skema validasi dan tipe yang dipakai bersama oleh form dan API |
| `content/` | Beranda, halaman Tentang, panduan, dan changelog |
| `public/` | Logo, ikon, dan gambar statis |
| `okf/` | Draf awal Open Knowledge Format. Belum dipakai situs. |

## Berkontribusi

Laporan bug, usulan, dan pull request diterima di [github.com/majalengkatech/majalengka.tech](https://github.com/majalengkatech/majalengka.tech). Panduan lengkapnya ada di [majalengka.tech/docs/kontribusi](https://majalengka.tech/docs/kontribusi).

Sebelum mengirim pull request, jalankan `bun run lint` dan `bun run typecheck`.

## Lisensi

[MIT](LICENSE)
