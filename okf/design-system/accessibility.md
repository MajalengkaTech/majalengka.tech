---
type: Guideline
title: Panduan Aksesibilitas Web (WCAG 2.1 AA)
description: Standar aksesibilitas digital untuk memastikan portal dapat diakses oleh semua kalangan masyarakat termasuk penyandang disabilitas.
tags: [a11y, accessibility, wcag, usability]
status: active
verified: human:narr07
sources:
  - type: standard
    name: W3C Web Content Accessibility Guidelines (WCAG) 2.1
    url: https://www.w3.org/TR/WCAG21/
---

# Panduan Aksesibilitas Web

Portal publik instansi dan komunitas wajib memenuhi kriteria kepatuhan minimum **WCAG 2.1 Level AA**.

## Prinsip Utama

### 1. Dapat Dipersepsi (Perceivable)
- **Teks Alternatif (Alt Text)**: Setiap gambar informatif wajib memiliki atribut `alt` deskriptif.
- **Rasio Kontras**: Teks standar memiliki rasio kontras minimum `4.5:1` terhadap latar belakang. Teks besar atau tebal minimal `3:1`.

### 2. Dapat Dioperasikan (Operable)
- **Navigasi Keyboard**: Seluruh fungsi interaktif (tombol, tautan, form) wajib dapat dijangkau dan dioperasikan menggunakan tombol `Tab`, `Enter`, dan `Space`.
- **Indikator Fokus Jelas**: Hindari `outline: none` tanpa menyediakan visual fokus pengganti yang terlihat kontras (`ring-2 ring-emerald-500`).
- **Skip to Content Link**: Sediakan tautan lewati ke konten utama di bagian paling atas dokumen HTML.

### 3. Dapat Dipahami (Understandable)
- Bahasa halaman didefinisikan dengan benar (`<html lang="id">`).
- Notifikasi kesalahan input formulir disampaikan secara jelas dan menyertakan saran perbaikan.

### 4. Kokoh (Robust)
- Menggunakan elemen HTML5 semantik (`<nav>`, `<main>`, `<article>`, `<header>`, `<footer>`).
- Menggunakan atribut ARIA hanya jika elemen semantik bawaan belum mencukupi.
