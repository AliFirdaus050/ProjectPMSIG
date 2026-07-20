# PM Checklist App

Aplikasi web untuk mengelola checklist **Preventive Maintenance (PM)** perangkat IT di lingkungan operasional pabrik.

## Daftar Isi

- [Deskripsi Proyek](#deskripsi-proyek)
- [Fitur Utama](#fitur-utama)
- [Tech Stack](#tech-stack)
- [Arsitektur Singkat](#arsitektur-singkat)
- [Prasyarat](#prasyarat)
- [Instalasi](#instalasi)
- [Konfigurasi Environment Variables](#konfigurasi-environment-variables)
- [Menjalankan Proyek](#menjalankan-proyek)
- [Role & Hak Akses](#role--hak-akses)
- [Struktur Folder](#struktur-folder)
- [API Endpoints](#api-endpoints)
- [Kontribusi](#kontribusi)
- [Kontak](#kontak)

## Deskripsi Proyek

Sebelum aplikasi ini dibuat, proses PM dijalankan manual pakai form fisik (kertas/Excel) — teknisi menulis ulang data konfigurasi tiap perangkat setiap kunjungan, arsip tersebar, dan rawan human error.

PM Checklist App mengambil alih proses itu: teknisi tinggal input atau scan **Serial Number**, data konfigurasi perangkat (device, site, model, lokasi) otomatis terisi dari database — tidak perlu tulis ulang. Bagian checklist kondisi fisik tetap diisi manual (memang butuh observasi langsung di lapangan), lalu sistem men-generate PDF dengan layout mengikuti form fisik yang sudah dipakai perusahaan, sehingga proses tanda tangan dan arsip tetap sesuai SOP existing.

Aplikasi ini dipakai oleh 4 peran (Teknisi, SPV, PIC, Admin) dengan alur kerja: **jadwal PM diupload per periode → teknisi isi checklist untuk perangkat yang ada di jadwal → tanda tangan digital → PDF digenerate → SPV approve**.

## Fitur Utama

- Checklist PM digital untuk 3 kategori perangkat (**PC/Laptop**, **Printer**, **Switch**), masing-masing dengan section & item checklist yang berbeda
- Role-based access control (**Teknisi**, **SPV**, **PIC**, **Admin**) dengan hak akses menu berbeda per peran
- Lookup aset otomatis via Serial Number, termasuk scan QR/barcode pakai kamera
- Tanda tangan digital (canvas gambar bebas untuk PIC; tanda tangan tersimpan yang bisa dipakai ulang untuk Teknisi & SPV)
- Alur approval berjenjang: Teknisi isi & generate PDF → SPV approve
- Penjadwalan PM per periode (siklus tanggal 15–14 tiap bulan) dengan *schedule gating* — checklist hanya bisa diisi untuk perangkat yang ada di jadwal periode berjalan
- Upload jadwal PM dari file Excel, dengan pencocokan otomatis ke data aset
- Tracker PM — status per perangkat per periode (Belum PM / Menunggu Approval / Disetujui)
- Generate laporan PDF otomatis, template berbeda per kategori perangkat, mengikuti layout form fisik asli
- Preview PDF inline (render via PDF.js, jalan di browser desktop maupun mobile)
- Lampiran foto opsional pada checklist
- Riwayat checklist dengan filter (device, site, tanggal)
- Manajemen data master perangkat (tambah/ubah/hapus)
- Manajemen user & role oleh Admin/SPV
- Activity log — jejak audit aktivitas penting di sistem
- Dark/Light mode

## Tech Stack

**Backend**
- Node.js + Express
- PostgreSQL (`pg`)
- JWT (`jsonwebtoken`) untuk autentikasi, `bcrypt` untuk hashing password
- Puppeteer — generate PDF dari HTML/CSS
- `helmet` + `express-rate-limit` — hardening keamanan HTTP
- `multer` — upload file (Excel jadwal, lampiran foto)
- `xlsx` — parsing file Excel

**Frontend**
- React 18 + Vite
- React Router (`react-router-dom`)
- Tailwind CSS
- `pdfjs-dist` / `react-pdf` — render preview PDF
- `html5-qrcode` — scan barcode/QR via kamera

**Database**
- PostgreSQL, migration berbasis file SQL murni (tanpa ORM), dijalankan lewat script migration runner custom (`backend/src/db/migrate.js`)

## Arsitektur Singkat

```
┌──────────────┐        HTTPS/JSON        ┌──────────────────┐        SQL        ┌─────────────┐
│   Frontend    │ ───────────────────────► │      Backend      │ ─────────────────► │ PostgreSQL  │
│ React + Vite  │ ◄─────────────────────── │  Node.js/Express  │ ◄───────────────── │  Database   │
└──────────────┘                          └──────────────────┘                    └─────────────┘
                                                    │
                                                    ▼
                                            ┌──────────────────┐
                                            │    Puppeteer      │
                                            │  (Generate PDF)    │
                                            └──────────────────┘
                                                    │
                                                    ▼
                                            backend/storage/checklists/
                                            (file PDF hasil generate,
                                             disajikan via /files static route)
```

Alur singkat: Frontend memanggil REST API (`/api/v1/...`) berbasis JWT di header `Authorization: Bearer <token>`. Backend memvalidasi role via middleware `authenticate`/`authorize`, baca-tulis ke PostgreSQL, dan untuk endpoint generate PDF memanggil Puppeteer untuk merender template HTML checklist menjadi file PDF yang disimpan di `backend/storage/`.

## Prasyarat

| Tool | Versi Minimum |
|---|---|
| Node.js | 18.x atau lebih baru |
| pnpm | terbaru (`npm install -g pnpm`) |
| PostgreSQL | 13.x atau lebih baru (butuh extension `pgcrypto`) |
| Git | terbaru |

## Instalasi

### 1. Clone repository

```bash
git clone https://github.com/AliFirdaus050/ProjectPMSIG.git
cd ProjectPMSIG
```

### 2. Setup database

Buat database kosong:

```sql
-- via psql -U postgres
CREATE DATABASE pm_checklist_db;
```

### 3. Setup backend

```bash
cd backend
pnpm install
cp .env.example .env   # lalu sesuaikan isinya, lihat bagian Environment Variables
pnpm run migrate
```

### 4. Buat user pertama (Admin)

```bash
node scripts/seed-admin.js "Nama Lengkap" admin@perusahaan.com passwordAman123 admin
```

### 5. Import data aset awal (opsional, kalau ada data Excel existing)

```bash
node scripts/import-assets-from-excel.js "path/ke/data-aset.xlsx" --dry-run
node scripts/import-assets-from-excel.js "path/ke/data-aset.xlsx"
```

### 6. Setup frontend

```bash
cd ../frontend
pnpm install
```

## Konfigurasi Environment Variables

Buat file `.env` di folder `backend/` dengan variabel berikut:

| Variabel | Wajib | Contoh | Keterangan |
|---|---|---|---|
| `DATABASE_URL` | Ya | `postgresql://postgres:password@localhost:5432/pm_checklist_db` | Connection string PostgreSQL |
| `PORT` | Tidak | `4000` | Port server backend, default `4000` |
| `JWT_SECRET` | Ya | *(string acak panjang & rahasia)* | Secret untuk menandatangani JWT — **wajib diganti**, jangan pakai nilai contoh di production |
| `JWT_EXPIRES_IN` | Tidak | `8h` | Masa berlaku token login |
| `NODE_ENV` | Tidak | `development` / `production` | Mode environment |

> **Catatan keamanan:** jangan pernah commit file `.env` ke git (sudah di-ignore lewat `.gitignore`). Generate `JWT_SECRET` dengan nilai acak yang kuat, misalnya lewat `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`.

## Menjalankan Proyek

### Development

Jalankan backend dan frontend di 2 terminal terpisah:

```bash
# Terminal 1 — backend
cd backend
pnpm run dev      # nodemon, auto-reload

# Terminal 2 — frontend
cd frontend
pnpm run dev      # Vite dev server, default http://localhost:5173
```

Cek backend hidup: `http://localhost:4000/api/v1/health`

### Production

```bash
# Backend
cd backend
pnpm run start

# Frontend — build lalu serve hasil build (misal via reverse proxy/nginx)
cd frontend
pnpm run build    # hasil di frontend/dist/
```

## Role & Hak Akses

| Role | Deskripsi | Akses Utama |
|---|---|---|
| **Admin** | Superuser sistem | Semua menu — kelola user, kelola data aset, lihat activity log, akses penuh checklist & jadwal |
| **SPV** | Penanggung jawab unit, approval PM | Approve checklist PM, kelola user, kelola data aset, lihat Tracker PM & riwayat semua teknisi |
| **Teknisi** | Petugas lapangan | Isi checklist PM (device sesuai jadwal periode berjalan), upload jadwal PM, kelola data aset, lihat riwayat & tracker miliknya |
| **PIC** | Penanggung jawab perangkat (opsional, tergantung konfigurasi tim) | Tanda tangan checklist sebagai saksi/penanggung jawab perangkat saat PM berlangsung |

Kontrol akses diterapkan di dua lapis: middleware `authorize(...role)` di backend (menolak request di level API), dan pengondisian tampilan menu di frontend (`Layout.jsx`, route guard di `App.jsx`).

## Struktur Folder

```
ProjectPMSIG/
├── README.md
│
├── backend/
│   ├── .gitignore
│   ├── package.json
│   ├── package-lock.json
│   ├── pnpm-lock.yaml
│   ├── pnpm-workspace.yaml
│   ├── xlsx-0.20.3.tgz
│   │
│   ├── vendor/
│   │   └── xlsx-0.20.3.tgz
│   │
│   ├── scripts/
│   │   ├── import-assets-from-excel.js
│   │   ├── seed-admin.js
│   │   └── update-kategori-from-excel.js
│   │
│   └── src/
│       ├── server.js
│       │
│       ├── config/
│       │   └── db.js
│       │
│       ├── db/
│       │   ├── migrate.js
│       │   └── migrations/
│       │       ├── 000_extensions.sql
│       │       ├── 001_create_enum_types.sql
│       │       ├── 002_create_users.sql
│       │       ├── 003_create_assets.sql
│       │       ├── 004_create_pm_checklists.sql
│       │       ├── 005_create_checklist_device_items.sql
│       │       ├── 006_create_checklist_software_items.sql
│       │       ├── 007_create_checklist_additional_software.sql
│       │       ├── 008_indexes.sql
│       │       ├── 009_add_printer_switch_fields.sql
│       │       ├── 010_update_roles.sql
│       │       ├── 011_create_pm_schedules.sql
│       │       ├── 012_create_pic_assets.sql
│       │       ├── 013_add_approval_fields.sql
│       │       ├── 014_create_user_signatures.sql
│       │       ├── 015_add_spv_signature.sql
│       │       ├── 016_add_user_active_status.sql
│       │       ├── 017_add_kategori_column.sql
│       │       ├── 018_add_schedule_pic_name.sql
│       │       ├── 019_create_activity_logs.sql
│       │       ├── 020_add_kategori_to_assets.sql
│       │       ├── 021_dedupe_assets_by_asset_tag.sql
│       │       ├── 022_add_model_to_schedule.sql
│       │       ├── 023_add_checklist_attachments.sql
│       │       ├── 024_unique_draft_per_period.sql
│       │       └── 025_user_delete_support.sql
│       │
│       ├── middleware/
│       │   └── auth.js
│       │
│       ├── routes/
│       │   ├── assets.routes.js
│       │   ├── auth.routes.js
│       │   ├── checklists.routes.js
│       │   ├── logs.routes.js
│       │   ├── schedules.routes.js
│       │   ├── signatures.routes.js
│       │   └── users.routes.js
│       │
│       ├── services/
│       │   └── pdfGenerator.js
│       │
│       ├── templates/
│       │   ├── attachmentsSection.js
│       │   ├── pmChecklistTemplate.js
│       │   ├── printerChecklistTemplate.js
│       │   ├── switchChecklistTemplate.js
│       │   └── templateHelpers.js
│       │
│       └── utils/
│           ├── activityLog.js
│           ├── checklistDefaults.js
│           └── period.js
│
└── frontend/
    ├── .gitignore
    ├── index.html
    ├── package.json
    ├── pnpm-lock.yaml
    ├── pnpm-workspace.yaml
    ├── postcss.config.js
    ├── tailwind.config.js
    ├── vite.config.js
    │
    └── src/
        ├── App.jsx
        ├── main.jsx
        ├── index.css
        │
        ├── api/
        │   └── client.js
        │
        ├── components/
        │   ├── BarcodeScanner.jsx
        │   ├── Layout.jsx
        │   ├── PdfViewer.jsx
        │   └── SignaturePad.jsx
        │
        ├── context/
        │   ├── AuthContext.jsx
        │   └── ThemeContext.jsx
        │
        └── pages/
            ├── ActivityLogPage.jsx
            ├── AssetDatabasePage.jsx
            ├── ChecklistFormPage.jsx
            ├── ChecklistPreviewPage.jsx
            ├── HistoryPage.jsx
            ├── HomePage.jsx
            ├── LoginPage.jsx
            ├── ProfilePage.jsx
            ├── ScheduleUploadPage.jsx
            ├── SerialLookupPage.jsx
            ├── TrackerPage.jsx
            └── UserManagementPage.jsx
```

## API Endpoints

Base URL: `/api/v1`. Semua endpoint (kecuali `/auth/login`) butuh header `Authorization: Bearer <token>`.

### Autentikasi (`/auth`)

| Method | Endpoint | Deskripsi |
|---|---|---|
| POST | `/auth/login` | Login, mengembalikan JWT token |
| POST | `/auth/logout` | Logout |
| GET | `/auth/me` | Data user yang sedang login |

### Aset (`/assets`)

| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/assets/search?serial_number=` | Lookup aset berdasarkan serial number |
| POST | `/assets` | Registrasi aset baru |
| GET | `/assets/:id` | Detail satu aset |
| GET | `/assets` | List aset (pagination, search) |
| PATCH | `/assets/:id` | Edit data aset |
| DELETE | `/assets/:id` | Hapus aset |

### Checklist PM (`/checklists`)

| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/checklists/template?asset_name=` | Konfigurasi section/item checklist untuk kategori device tertentu |
| POST | `/checklists` | Buat checklist baru (status draft) |
| PATCH | `/checklists/:id` | Auto-save isi checklist |
| POST | `/checklists/:id/generate-pdf` | Finalisasi checklist & generate PDF |
| POST | `/checklists/:id/approve` | SPV approve checklist |
| GET | `/checklists/:id/pdf` | Unduh PDF yang sudah digenerate |
| GET | `/checklists/:id` | Detail satu checklist |
| GET | `/checklists` | Riwayat checklist (filter: site, serial number, tanggal, status) |

### Jadwal PM (`/schedules`)

| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/schedules/period-info` | Info periode berjalan & periode berikutnya |
| GET | `/schedules/periods` | Daftar periode + status upload jadwal |
| POST | `/schedules/upload` | Upload jadwal PM (file Excel) |
| DELETE | `/schedules` | Hapus jadwal periode tertentu |
| GET | `/schedules` | List jadwal per periode |
| GET | `/schedules/check/:assetId` | Cek apakah aset ada di jadwal periode berjalan |
| GET | `/schedules/tracker` | Status PM seluruh aset pada periode tertentu |

### Tanda Tangan (`/signatures`)

| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/signatures/me` | Ambil tanda tangan tersimpan milik user login |
| PUT | `/signatures/me` | Simpan/update tanda tangan |

### User Management (`/users`)

| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/users` | List user |
| POST | `/users` | Buat user baru |
| PATCH | `/users/:id` | Edit user |
| POST | `/users/:id/reset-password` | Reset password user |
| DELETE | `/users/:id` | Hapus user |
| GET/POST/DELETE | `/users/:id/pic-assets` | Kelola relasi PIC ↔ aset |

### Activity Log (`/logs`)

| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/logs` | List activity log |
| GET | `/logs/actions` | Daftar jenis aksi yang tercatat |

## Kontribusi

1. Buat branch baru dari `main` untuk tiap fitur/perbaikan (`git checkout -b nama-fitur`)
2. Commit dengan pesan yang jelas menjelaskan perubahan
3. Pastikan migration baru diberi nomor urut berikutnya di `backend/src/db/migrations/`
4. Jangan commit file `.env`, file data internal (`*.xlsx`), atau sertifikat (`*.pem`/`*.key`) — sudah diatur di `.gitignore`
5. Push branch dan buat Pull Request ke `main` untuk direview sebelum merge

## Kontak

Dikembangkan oleh Mahasiswa magang untuk kebutuhan operasional IT Site Operation.
