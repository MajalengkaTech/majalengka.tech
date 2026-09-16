---
name: anti-kaku
description: Menulis atau menyunting dokumentasi, blog post, copy website, halaman landing, README, atau konten apa pun berbahasa Indonesia agar TIDAK terdengar kaku/birokratis/seperti proposal-hibah. Gunakan skill ini setiap kali user meminta menulis atau memperbaiki teks berbahasa Indonesia untuk website, dokumentasi, artikel, landing page, deskripsi produk/proyek, atau bertanya "ini kaku ga?" / "kedengeran natural ga?" / "kok kayak AI?" — bahkan jika user tidak menyebut kata "kaku" secara eksplisit, misalnya cukup bilang "tolong tulisin", "bikinin copy", atau "review tulisan ini". Wajib dipakai juga saat menyunting draft yang sudah ada, bukan cuma menulis dari nol.
---

# Anti-Kaku

Skill untuk mendeteksi dan memperbaiki gaya bahasa Indonesia yang kaku — nadanya seperti proposal hibah, laporan pertanggungjawaban (LPJ), siaran pers instansi, atau hasil terjemahan mesin — supaya jadi tulisan yang enak dibaca manusia sungguhan, tapi tetap kredibel dan tidak childish.

Ini BUKAN skill untuk mengubah tulisan jadi terlalu santai/alay. Target akhirnya: profesional tapi hidup — seperti orang kompeten yang sedang menjelaskan sesuatu ke temannya, bukan pejabat yang membacakan sambutan.

## Kapan pakai skill ini

- Menulis konten baru: landing page, dokumentasi, README, blog post, deskripsi fitur/proyek
- Menyunting draft yang sudah ada dan user merasa "kok kaku ya" atau "kayak AI"
- Review halaman/copy yang sudah jadi sebelum publish
- Menerjemahkan dari EN ke ID (kombinasikan dengan skill `translate-id-en` jika tersedia)

## Ciri-ciri tulisan kaku (checklist deteksi)

Sebelum menulis atau setelah dapat draft, cek pola-pola ini:

1. **Nominalisasi bertumpuk** — kata benda turunan (pe-/-an, ke-/-an) dipakai berderet dalam satu kalimat.
   - Kaku: *"Menghubungkan manusia dan agen AI dengan arsitektur pengetahuan dan desain yang kredibel serta aksesibel."*
   - Natural: *"Kami merancang sistem yang gampang dipahami manusia maupun AI — jelas strukturnya, dan bisa diakses siapa saja."*

2. **Jargon proposal/birokrasi** — kata seperti "tepat guna", "pemberdayaan", "sinergi", "optimalisasi", "guna mendukung", "dalam rangka", "untuk kemajuan [wilayah]". Kata-kata ini valid tapi jadi red flag kalau dipakai berulang di satu halaman.
   - Kaku: *"solusi tepat guna yang menyelesaikan persoalan riil"*
   - Natural: *"solusi yang beneran kepake buat masalah sehari-hari warga"* (atau versi lebih formal sedikit: *"solusi yang benar-benar menjawab kebutuhan warga"*)

3. **Kalimat tanpa subjek/pelaku jelas, kalimat pasif berlebihan** — bikin teks berjarak, seperti pengumuman resmi.
   - Kaku: *"Seluruh source code dirilis dengan lisensi terbuka."*
   - Natural: *"Semua source code kami rilis dengan lisensi terbuka."* (aktif, ada "kami" sebagai pelaku)

4. **Semua kalimat panjangnya seragam** — tulisan kaku biasanya monoton, tiap kalimat 15-20 kata dengan struktur mirip. Tulisan natural punya variasi: kalimat pendek untuk penekanan, diselingi kalimat lebih panjang.

5. **Testimoni/kutipan yang terlalu rapi** — kalau semua testimoni punya struktur & panjang identik ("[Manfaat] + [nama alat] + [dampak positif]"), itu langsung kebaca AI-generated. Testimoni asli biasanya sedikit belepotan: ada penekanan spesifik, kadang mulai dari keluhan lama, kadang cuma satu kalimat.

6. **Daftar buzzword tanpa contoh konkret** — "inovatif", "agile", "kredibel", "berkelanjutan" tanpa penjelasan apa artinya di konteks itu.

7. **Terlalu banyak menyebut nama sendiri/proyek di kalimat singkat** — nada company-profile, bukan orang ngobrol.

## Cara memperbaiki

1. **Pecah nominalisasi jadi kata kerja.** "pemberdayaan talenta lokal" → "membuka akses buat talenta lokal" / "bikin talenta lokal makin jago".
2. **Ganti jargon dengan bahasa konkret.** Tanya ke diri sendiri: "kalau saya jelasin ini ke teman sambil ngopi, saya bakal ngomong apa?"
3. **Aktifkan kalimat.** Cari pelaku (kami/kita/[nama proyek]) dan taruh di depan kalimat kalau memungkinkan.
4. **Variasikan panjang kalimat.** Setelah kalimat panjang berisi detail, kasih satu kalimat pendek untuk penekanan atau transisi.
5. **Buat testimoni terasa personal.** Beda-bedakan struktur, panjang, dan sudut pandang tiap kutipan. Boleh mulai dari konteks masalah, boleh cuma satu-dua kalimat pendek.
6. **Konkretkan buzzword.** Ganti "aksesibel" jadi "bisa dipakai orang dengan gangguan penglihatan" kalau itu maksudnya; ganti "inovatif" dengan menyebut apa yang beda dari yang lain.
7. **Baca ulang dengan suara keras (mental).** Kalau kalimatnya kedengaran aneh diucapkan manusia beneran, tulis ulang.

## Yang TETAP dipertahankan (jangan overcorrect)

- Istilah teknis yang memang perlu (nama produk, istilah domain seperti "IoT", "WCAG 2.1 AA", nama tempat) — jangan dihilangkan demi kesan santai.
- Struktur informasi (heading, bullet list untuk fitur) — masalahnya di gaya bahasa dalam kalimat, bukan di strukturnya.
- Tingkat formalitas dasar sesuai audiens: konten untuk instansi pemerintah/akademik boleh tetap sedikit lebih formal daripada blog santai, tapi tetap harus aktif dan konkret, bukan berjarak.
- Jangan ganti "Anda"/nada formal jadi "lo-gue" kalau brand voice-nya memang bukan itu — natural ≠ gaul. Tanyakan dulu kalau brand voice belum jelas.

## Alur kerja

1. Kalau ini konten baru: tulis draft langsung dengan prinsip di atas, jangan tulis versi kaku dulu baru diperbaiki.
2. Kalau ini menyunting draft yang ada: tandai bagian yang kena ciri-ciri di atas, jelaskan singkat kenapa itu kaku, lalu kasih versi perbaikannya. Jangan rewrite seluruh halaman tanpa penjelasan kalau user cuma minta feedback.
3. Untuk halaman panjang, cukup contohkan 3-5 bagian paling parah dulu daripada me-rewrite semuanya sekaligus — biar user bisa approve arah gayanya sebelum lanjut ke sisa halaman.
4. Kalau ragu soal tingkat formalitas yang diinginkan, tanyakan satu pertanyaan singkat (mis. "mau tetap agak formal karena target pembacanya dinas/instansi, atau lebih santai kayak blog developer?") daripada menebak.
