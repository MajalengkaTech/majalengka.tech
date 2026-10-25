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
- **Halaman pengelola.** Kelola Pengguna dan Kelola Proyek, termasuk memilih proyek untuk Pilihan Kurator.
- **Panduan dan catatan rilis** di `/docs` dan `/changelog`.
- **Konten untuk alat AI** di `/llms.txt` dan `/llms-full.txt`.

## Teknologi

| Bagian | Teknologi |
|---|---|
| Framework | Nuxt 4 |
| Komponen UI | Nuxt UI 4 dengan Tailwind CSS 4 |
| Konten (panduan, changelog) | Nuxt Content 3 |
| Database | NuxtHub dengan SQLite, lewat Drizzle ORM |
| Penyimpanan gambar | Cloudinary. Tanpa kredensial Cloudinary, file disimpan di `.data/blob`. |
| Login | Better Auth (email dan kata sandi, GitHub, Google) |
| Gambar | Nuxt Image: gambar Cloudinary diolah Cloudinary, sisanya diolah IPX di server |
| Animasi | Anime.js v4 lewat modul nanime |
| Hosting | VPS dengan Docker, di belakang Cloudflare Tunnel |
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

Unggah gambar bisa dicoba di lokal. Kalau isian Cloudinary di `.env` kosong, gambar disimpan di `.data/blob`. Kalau diisi, gambar masuk ke akun Cloudinary itu, jadi jangan pakai kredensial produksi untuk mencoba-coba.

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

Jangan menulis atau mengubah tabel lewat skrip manual. Di lokal, migrasi berjalan otomatis saat `bun run dev`. Di produksi, migrasi tidak berjalan otomatis. Pengelola menjalankannya di server dengan `docker compose run --rm migrate` setelah image baru dibangun.

## Rilis

- Pull request ke `main` menjalankan lint dan typecheck (`.github/workflows/ci.yml`).
- Setiap push ke `main` di-deploy otomatis (`.github/workflows/deploy.yml`): lint dan typecheck, lalu GitHub Actions masuk ke VPS lewat SSH dan menjalankan skrip deploy. Skrip itu mencadangkan database, membangun image Docker, menjalankan migrasi, lalu mengganti container. Kalau container baru tidak sehat dalam 3 menit, situs kembali ke versi sebelumnya.
- Kunci SSH deploy di VPS hanya bisa menjalankan skrip deploy (`restrict,command=` di `authorized_keys`), dan host key VPS dipatok di secret `VPS_KNOWN_HOSTS`. Secret deploy tersimpan di GitHub Environment `production` yang hanya boleh dipakai branch `main`.
- Skrip yang dijalankan di VPS adalah salinan `scripts/deploy.sh` di luar repo (`~/bin/deploy-majalengka-tech`), supaya push ke repo tidak bisa mengubah skrip deploy-nya sendiri. Kalau `scripts/deploy.sh` berubah, pengelola menyalinnya ulang dengan tangan.
- Riwayat setiap deploy tercatat di `.data/deploy.log` di VPS.
- Situs hanya bisa dibuka lewat Cloudflare Tunnel. Port aplikasi terikat ke `127.0.0.1:3000`.
- Database dicadangkan setiap hari oleh `scripts/backup-db.sh` lewat cron.
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
