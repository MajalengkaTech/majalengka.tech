# Majalengka Tech 🏔️⚡

> **Membangun Ekosistem Teknologi & Open Source dari Majalengka**
> *Dari lereng Gunung Ciremai untuk inovasi lokal dan dampak global.*

[![Nuxt](https://img.shields.io/badge/Nuxt-4.x-00DC82?logo=nuxt.js)](https://nuxt.com)
[![Nuxt UI](https://img.shields.io/badge/Nuxt_UI-v4-00DC82?logo=nuxt.js)](https://ui.nuxt.com)
[![Package Manager](https://img.shields.io/badge/Package_Manager-Bun-FBF0DF?logo=bun)](https://bun.sh)
[![OKF](https://img.shields.io/badge/Google_Cloud-OKF_v0.2-4285F4?logo=google-cloud)](https://github.com/GoogleCloudPlatform/open-knowledge-format)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

Portal resmi dan basis pengetahuan terbuka **Majalengka Tech** (`majalengka.tech`). Repositori ini menggabungkan portal web modern berbasis **Nuxt UI SaaS** dan implementasi spesifikasi **Open Knowledge Format (OKF v0.2)** dari Google Cloud Platform.

---

## 🌟 5 Inisiatif Unggulan

1. **🌾 AgriTech & Smart Farming IoT**: Sistem pemantauan telemetri sensor kelembaban tanah, suhu, dan otomasi katup irigasi berbasis ESP32/LoRa untuk petani muda di kawasan lereng Ciremai dan terasering Panyaweuyan Argapura.
2. **📍 Majalengka Tourism & Local Guide**: Platform peta terbuka progresif (PWA) berbasis OpenStreetMap yang menyajikan rute destinasi alam, ulasan komunitas, serta direktori kuliner lokal dengan dukungan tri-bahasa (Indonesia, Sunda, Inggris).
3. **🏪 Digitalisasi & Tools UMKM**: Aplikasi kasir (POS) berbasis web yang ringan, generator katalog produk instan terhubung WhatsApp, dan generator display QRIS standar tanpa biaya langganan bulanan.
4. **🎓 Open Educational Resources (OER)**: Modul belajar, tutorial terapan, dan kurikulum praktis coding, embedded systems, dan AI gratis untuk pelajar dan mahasiswa lokal.
5. **📊 Open Data Majalengka**: Portal keterbukaan data agregat statistik panen komoditas unggulan, cuaca mikro, dan statistik daerah.

---

## 🎨 Majalengka Design System (MDS)

Sistem desain visual *single source of truth* untuk instansi pemerintah daerah dan aplikasi komunitas Majalengka:
- **Prinsip**: Kredibel, resmi, dan selaras dengan *INA Digital Design System (IDDS)*.
- **Aksesibilitas**: Memenuhi kepatuhan minimum **WCAG 2.1 Level AA**.
- **Tokens**: Palet warna Emerald Ciremai, tipografi Inter yang terbaca jelas di layar smartphone, dan skala spasi modular.

---

## 🧠 Open Knowledge Format (OKF) Google Cloud

Repositori ini menerapkan standar **Open Knowledge Format (OKF v0.2)** dari Google Cloud Platform di dalam folder [`okf/`](okf/):
- **Human & Agent Readable**: Ditulis dalam Markdown murni dengan blok YAML Frontmatter (`type`, `title`, `tags`, `verified`, `sources`).
- **Knowledge Graph Portable**: Tautan silang antar konsep menggunakan sintaks tautan markdown standar.
- **Git-Centric**: Pengetahuan dipelihara dengan pull request, version control, dan diff yang transparan.

---

## 🚀 Memulai (Development)

Proyek ini menggunakan **Bun** sebagai default package manager dan runtime:

```bash
# Clone repositori
git clone https://github.com/majalengka-tech/majalengka.tech.git
cd majalengka.tech

# Install dependensi
bun install

# Jalankan server pengembangan lokal
bun run dev

# Jalankan pemeriksaan tipe (typecheck)
bun run typecheck

# Jalankan linter (ESLint + eslint-plugin-better-tailwindcss)
bun run lint
```

---

## 🤝 Berkontribusi

Kami menyambut kontribusi dari siapa saja—mulai dari pelaporan issue, perbaikan dokumentasi, penambahan token desain, hingga modul IoT dan aplikasi web!

Silakan buat Pull Request atau buka Issue di repositori GitHub kami:
[https://github.com/majalengka-tech](https://github.com/majalengka-tech)