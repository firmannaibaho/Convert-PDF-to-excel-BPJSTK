# Project Overview: Sistem Akuisisi Kepling BPJS Ketenagakerjaan

Sistem ini adalah aplikasi otomasi data yang dirancang untuk mempercepat proses verifikasi dan pemetaan akuisisi peserta BPJS Ketenagakerjaan melalui data Kepala Lingkungan (Kepling) di wilayah Kota Medan.

---

## Arsitektur Sistem

Aplikasi ini menggunakan arsitektur Full-Stack Modern dengan pemisahan tanggung jawab yang jelas:

### 1. Frontend (React + Vite)
Dibangun dengan prinsip **Modular Component-Based Architecture**.
- **State Management**: React Hooks (`useState`, `useCallback`, `useMemo`) untuk performa tinggi dan render yang efisien.
- **UI/UX Style**: Neobrutalist Design System (modern, kontras tinggi, bold) menggunakan Vanilla CSS.
- **Mapping**: Integrasi Leaflet.js untuk visualisasi peta wilayah binaan (GIS).
- **Icons**: Lucide React.
- **Excel Processing**: SheetJS (XLSX) untuk integrasi laporan spreadsheet.

### 2. Backend (FastAPI + Python)
Server API berperan sebagai otak pemrosesan data.
- **FastAPI**: Framework performa tinggi untuk routing dan validasi data.
- **PDF Extraction**: Pemrosesan tabel dari file PDF secara otomatis menggunakan pustaka Python khusus.
- **Data Matcher**: Mesin pencocokan NIK antara hasil ekstraksi PDF dengan database wilayah binaan.
- **Caching**: Implementasi In-Memory TTL Cache untuk mempercepat respons data statis (Kepling & Form Results).

### 3. Database (Supabase / PostgreSQL)
Penyimpanan data cloud untuk persistensi:
- **Tabel Keplings**: Menyimpan profil Kepling, akun perisai, wilayah (Kec/Kel/Ling), dan target.
- **Tabel Form Results**: Menyimpan riwayat pendaftaran/akuisisi yang sudah divalidasi.

---

## Struktur Modul Frontend (Refactored)

Setelah dilakukan modularisasi, kode diatur ke dalam folder yang rapi:
- `/src/pages`: Halaman utama aplikasi (Dashboard, Extract, Kepling, Login).
- `/src/components`: UI modular (Modals, Charts, Tables, KPI Cards).
- `/src/hooks`: Logika bisnis yang dapat digunakan kembali (Pencarian, Filter, Upload, GIS).
- `/src/services`: Pusat komunikasi API via `fetch`.
- `/src/utils`: Helper fungsi untuk Excel, perhitungan GIS, dan format Tanggal.

---

## Alur Kerja Data

1. **Input PDF**: Operator mengunggah berkas PDF pendaftaran di halaman Ekstrak.
2. **Ekstraksi**: Backend mengekstrak NIK, Nama, dan Tanggal Daftar.
3. **Pencocokan**: Sistem mencocokkan data NIK tersebut dengan database NIK terdaftar dan database Wilayah Kepling.
4. **Validasi**:
   - Jika ditemukan di database Kepling, masuk ke **Data Cocok**.
   - Jika NIK sudah terdaftar sebelumnya, masuk ke **Sudah Pernah Ada**.
   - Jika data tidak valid atau format salah, masuk ke **Error Log**.
5. **Pelaporan**: Operator dapat mengekspor hasil pencocokan ke file Excel yang sudah terformat standar laporan.

---

## Fitur Utama

- **GIS (Geographic Information System)**: Pemetaan visual real-time capaian akuisisi per kecamatan dan kelurahan.
- **Manajemen Kepling**: Kontrol penuh atas data profil Kepling, akun perisai, dan nomor rekening per wilayah.
- **KPI Monitoring**: Pantauan performa Pembina Wilayah terhadap target (80 akuisisi) dan Kepling (25 akuisisi).
- **Automated Logging**: Pencatatan otomatis operator (Nama & NIM) yang melakukan input data.

---

## API Endpoints (Routes)

| Method | Endpoint | Fungsi |
|---|---|---|
| POST | `/upload` | Ekstraksi PDF & Pencocokan Data |
| GET | `/pembina-stats` | Ambil statistik performa pembina |
| GET | `/keplings` | Ambil list wilayah & profil Kepling |
| POST | `/update-kepling` | Update data profil Kepling |
| POST | `/mark-exported` | Tandai data sebagai 'Sudah Diekspor' |
| GET | `/download/forms` | Export data akuisisi ke CSV (Backend) |

---

**Dikembangkan Oleh:**
*Firman Karunia Naibaho (231402074)*
