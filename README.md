# PM Checklist App

Aplikasi web full-stack untuk mengelola checklist **Preventive Maintenance (PM)** di lingkungan operasional pabrik/site SIG. Menggantikan proses checklist manual berbasis kertas dengan alur digital yang terverifikasi, terjadwal, dan bisa diaudit.

---

## Daftar Isi

1. [Deskripsi Proyek](#deskripsi-proyek)
2. [Fitur Utama](#fitur-utama)
3. [Tech Stack](#tech-stack)
4. [Arsitektur Singkat](#arsitektur-singkat)
5. [Prasyarat](#prasyarat)
6. [Instalasi](#instalasi)
7. [Konfigurasi Environment Variables](#konfigurasi-environment-variables)
8. [Menjalankan Proyek](#menjalankan-proyek)
9. [Role & Hak Akses](#role--hak-akses)
10. [Struktur Folder](#struktur-folder)
11. [API Endpoints](#api-endpoints)
12. [Kontribusi](#kontribusi)
13. [Lisensi](#lisensi)
14. [Kontak / Penulis](#kontak--penulis)

---

## Deskripsi Proyek

**PM Checklist App** dibangun untuk mendigitalkan proses Preventive Maintenance di lingkungan IT Site Operation SIG. Sebelumnya, checklist PM dikerjakan manual di atas kertas: rawan hilang, sulit direkap, dan sulit diverifikasi siapa yang mengerjakan dan siapa yang menyetujui.

Aplikasi ini dipakai oleh beberapa kelompok pengguna dalam satu alur kerja yang sama:

- **Teknisi** — mengisi checklist PM untuk tiap perangkat sesuai kategori (PC/Laptop, Printer, Switch), menandatangani secara digital, lalu menghasilkan laporan PDF.
- **PIC (Person in Charge)** — pihak yang bertanggung jawab atas aset di lapangan, ikut menandatangani sebagai bukti perangkat sudah dicek bersama.
- **SPV (Supervisor)** — meninjau dan menyetujui (approve) checklist yang sudah diselesaikan teknisi, sebelum dianggap final.
- **Admin** — mengelola data pengguna, aset, dan penjadwalan PM secara keseluruhan.

Masalah utama yang diselesaikan:

- Checklist kertas gampang hilang dan sulit direkap jadi laporan.
- Tidak ada jaminan checklist dikerjakan sesuai jadwal PM yang ditentukan.
- Tidak ada jejak audit yang jelas soal siapa mengerjakan, siapa menyetujui, dan kapan.
- Rekap riwayat PM per aset (histori kondisi dari waktu ke waktu) sulit ditelusuri manual.

Aplikasi ini berjalan di jaringan internal (LAN) site, tidak menghadap ke internet publik.

## Fitur Utama

- **Checklist PM digital multi-kategori** — form dan template laporan berbeda otomatis mengikuti kategori perangkat (PC/Laptop, Printer, Switch), tanpa perlu isi ulang form generik yang tidak relevan.
- **Role-based access control** — hak akses berbeda untuk teknisi, SPV, dan admin, termasuk pembatasan siapa boleh mengedit checklist di status apa (draft / menunggu approval / sudah di-approve).
- **Tanda tangan digital** — teknisi, PIC, dan SPV menandatangani langsung di aplikasi, tersimpan sebagai bagian checklist maupun sebagai tanda tangan tersimpan per akun untuk dipakai ulang.
- **Penjadwalan dengan schedule gating** — jadwal PM diunggah lewat file Excel per periode, checklist untuk suatu aset hanya relevan diisi sesuai jadwal periode berjalan (dipantau lewat halaman Tracker).
- **Pemindaian barcode/QR** — identifikasi cepat perangkat di lapangan lewat kamera perangkat, tanpa perlu mengetik manual serial number/asset tag.
- **Generate laporan PDF otomatis** — hasil checklist dirender jadi PDF resmi mengikuti layout form fisik asli, per kategori perangkat.
- **Riwayat & pelacakan (Tracker + History)** — status PM tiap aset per periode (belum dikerjakan / menunggu approval / sudah disetujui) bisa dipantau, riwayat checklist bisa difilter berdasarkan aset, site, serial number, dan rentang tanggal.
- **Log aktivitas** — jejak audit aktivitas penting (login, buat/ubah checklist, approve, reset password, hapus akun, dsb.) untuk keperluan admin/SPV.
- **Manajemen pengguna** — admin dapat menambah, menonaktifkan, mereset password, dan menghapus akun pengguna, dengan riwayat PM yang tetap tersimpan meskipun akun penggunanya sudah dihapus.
- **Dark/Light mode** — preferensi tema tersimpan per browser.

## Tech Stack

**Backend**
- [Node.js](https://nodejs.org/) + [Express](https://expressjs.com/) — REST API
- [PostgreSQL](https://www.postgresql.org/) + [`pg`](https://node-postgres.com/) — database & driver (SQL murni, tanpa ORM)
- [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) — autentikasi berbasis JWT (algoritma HS256)
- [bcrypt](https://www.npmjs.com/package/bcrypt) — hashing password
- [Puppeteer](https://pptr.dev/) — render laporan checklist menjadi PDF (headless Chromium)
- [Multer](https://www.npmjs.com/package/multer) — upload file jadwal PM (Excel)
- [SheetJS (xlsx)](https://sheetjs.com/) — parsing file Excel jadwal PM
- [Helmet](https://helmetjs.github.io/) — HTTP security headers
- [express-rate-limit](https://www.npmjs.com/package/express-rate-limit) — pembatasan percobaan login
- [CORS](https://www.npmjs.com/package/cors) — whitelist origin frontend

**Frontend**
- [React 18](https://react.dev/) + [Vite](https://vitejs.dev/) — SPA & tooling build
- [React Router](https://reactrouter.com/) — routing sisi klien
- [Tailwind CSS](https://tailwindcss.com/) — styling berbasis utility class
- [html5-qrcode](https://www.npmjs.com/package/html5-qrcode) — pemindaian barcode/QR lewat kamera
- [react-pdf](https://github.com/wojtekmaj/react-pdf) / [pdf.js](https://mozilla.github.io/pdf.js/) — preview PDF di browser

**Infrastruktur & Tooling**
- [pnpm](https://pnpm.io/) — package manager (backend & frontend)
- [nodemon](https://nodemon.io/) — auto-restart server saat development

## Arsitektur Singkat

Aplikasi mengikuti arsitektur client-server standar tiga lapis, di-deploy di jaringan internal:

```
┌───────────────────────┐        HTTPS (LAN)        ┌──────────────────────┐
│    Browser (User)      │ ─────────────────────────▶ │  Frontend (Vite/     │
│  Teknisi / SPV / Admin  │ ◀───────────────────────── │  Static Build) :5173 │
└───────────────────────┘                            └───────────┬──────────┘
                                                                   │ fetch('/api/v1/...')
                                                                   │ Authorization: Bearer <JWT>
                                                                   ▼
                                                       ┌──────────────────────┐
                                                       │  Backend (Express)    │
                                                       │  :4000                │
                                                       │  - Route & middleware │
                                                       │  - Auth (JWT)         │
                                                       │  - Puppeteer (PDF)    │
                                                       └───────────┬──────────┘
                                                                   │ SQL (pg)
                                                                   ▼
                                                       ┌──────────────────────┐
                                                       │   PostgreSQL          │
                                                       │   pm_checklist_db     │
                                                       └──────────────────────┘
```

Alur singkat:

1. Pengguna login lewat frontend, backend memverifikasi kredensial dan mengembalikan JWT.
2. Setiap request API dari frontend menyertakan token JWT di header `Authorization`.
3. Backend memvalidasi token dan role pengguna di tiap endpoint sebelum mengakses database.
4. Saat checklist selesai diisi, backend memakai Puppeteer untuk merender HTML checklist menjadi PDF, disimpan di server, dan hanya bisa diunduh lewat endpoint terautentikasi (bukan file publik).

## Prasyarat

Pastikan environment pengembangan sudah memiliki:

| Tools | Versi Minimum | Catatan |
|---|---|---|
| Node.js | 18 LTS ke atas (disarankan 20 LTS) | Dibutuhkan Puppeteer & tooling Vite |
| pnpm | 8 ke atas | `npm install -g pnpm` kalau belum ada |
| PostgreSQL | 14 ke atas | Database lokal atau server internal |
| Git | versi terbaru | Untuk clone & kolaborasi |

Puppeteer akan mengunduh binary Chromium sendiri saat instalasi pertama, pastikan koneksi internet tersedia saat `pnpm install` di folder `backend`.

## Role & Hak Akses

| Role | Checklist Draft | Checklist Menunggu Approval | Checklist Sudah Approved | Approve Checklist | Kelola User | Kelola Aset | Upload Jadwal PM |
|---|---|---|---|---|---|---|---|
| **Teknisi** | Bisa lihat & edit (semua teknisi, siapa pun) | Hanya teknisi yang menyelesaikan checklist tersebut yang bisa edit | Tidak bisa edit, hanya lihat & unduh PDF | Tidak bisa | Tidak bisa | Bisa tambah aset, tidak bisa hapus | Bisa upload |
| **SPV (Supervisor)** | Tidak bisa buka detail | Tidak bisa buka detail, hanya lihat PDF | Hanya bisa lihat & unduh PDF | **Bisa** | Tidak bisa | Tidak bisa | Tidak bisa |
| **Admin** | Bisa lihat & edit kapan saja | Bisa lihat & edit kapan saja | Bisa lihat & edit (koreksi data) | Tidak bisa | **Bisa** (tambah, nonaktifkan, reset password, hapus) | **Bisa** (tambah & hapus) | Bisa upload & hapus jadwal |

### Aksi yang bisa dilakukan

| Area | Teknisi | SPV | Admin |
|---|---|---|---|
| Checklist berstatus **draft** (belum di-generate PDF) | Bisa lihat & edit — **siapa pun teknisi**, tidak dibatasi hanya yang memulai | Tidak bisa buka detailnya sama sekali | Bisa lihat & edit kapan saja |
| Checklist berstatus **menunggu approval** (sudah di-generate PDF, belum di-approve) | Hanya teknisi yang **menyelesaikan** checklist itu (generate PDF terakhir) yang bisa lanjut edit | Tidak bisa buka detail mentahnya, cuma bisa lihat file PDF-nya | Bisa lihat & edit kapan saja |
| Checklist berstatus **sudah disetujui (approved)** | Bisa lihat & unduh PDF, tidak bisa edit | Bisa lihat & unduh PDF | Bisa lihat, unduh, dan tetap bisa edit (untuk koreksi manual kalau perlu) |
| Approve checklist | Tidak bisa | **Bisa** — ini satu-satunya aksi utama SPV di aplikasi ini | Tidak diberi akses (approval sengaja dijaga khusus jalur SPV) |
| Kelola pengguna (tambah/nonaktifkan/reset password/hapus) | Tidak bisa | Bisa, **kecuali** terhadap akun admin (SPV tidak bisa membuat, mengubah, atau reset password akun admin) | Bisa penuh |
| Kelola data aset (tambah) | Bisa | Bisa | Bisa |
| Hapus data aset | Bisa | Bisa | Bisa |
| Upload jadwal PM (Excel) | Bisa | Tidak bisa | Bisa |
| Hapus jadwal PM | Tidak bisa | Tidak bisa | Bisa |
| Lihat log aktivitas | Tidak bisa | Tidak bisa | Bisa |
| Tracker & History (lihat status/riwayat PM) | Bisa, tapi tombol "lanjutkan" hanya muncul untuk checklist yang memang jadi haknya | Bisa lihat semua, tanpa tombol "lanjutkan" (SPV bukan pengerjаa PM) | Bisa lihat semua |
 
Beberapa catatan tambahan yang mungkin relevan waktu kalian menyusun skenario pengujian:
 
- **Siapa yang tercatat sebagai "pemilik" checklist bisa berpindah.** Kalau teknisi A memulai draft tapi tidak menyelesaikannya, lalu teknisi B yang melanjutkan dan generate PDF-nya, maka B yang tercatat sebagai penanggung jawab — bukan A. ini keputusan desain yang disengaja (yang menyelesaikan yang bertanggung jawab), bukan bug.
- **Akun yang dihapus tidak menghapus riwayat checklist-nya.** Nama pengguna tetap tersimpan di checklist yang pernah dia kerjakan/setujui, meskipun akunnya sendiri sudah dihapus dari sistem — ini untuk menjaga jejak audit tetap utuh.
- Endpoint `GET /:id/pdf` saat ini bisa diakses oleh **teknisi, SPV, maupun admin** yang sudah login — tidak dibatasi berdasarkan siapa pemilik checklist tersebut (siapa pun yang login bisa lihat PDF checklist siapa saja). Kalau ini bukan perilaku yang diharapkan dari sudut pandang kebijakan keamanan kalian, ini poin yang bagus untuk didiskusikan dengan tim developer.

## Struktur Folder

```
ProjectPMSIG/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js                    # koneksi pool PostgreSQL
│   │   ├── db/
│   │   │   ├── migrate.js               # runner migration
│   │   │   └── migrations/              # file .sql migration, urut berdasar nomor
│   │   ├── middleware/
│   │   │   └── auth.js                  # authenticate (JWT) & authorize (role)
│   │   ├── routes/
│   │   │   ├── auth.routes.js           # login, logout, profil sendiri
│   │   │   ├── assets.routes.js         # CRUD data aset/perangkat
│   │   │   ├── checklists.routes.js     # CRUD checklist PM, approve, generate PDF
│   │   │   ├── schedules.routes.js      # upload & tracking jadwal PM
│   │   │   ├── signatures.routes.js     # tanda tangan tersimpan per akun
│   │   │   ├── users.routes.js          # manajemen pengguna (admin)
│   │   │   └── logs.routes.js           # log aktivitas
│   │   ├── templates/                   # template HTML sumber untuk render PDF
│   │   │   ├── pmChecklistTemplate.js       # PC/Laptop
│   │   │   ├── switchChecklistTemplate.js   # Switch
│   │   │   ├── printerChecklistTemplate.js  # Printer
│   │   │   ├── attachmentsSection.js        # bagian lampiran/foto
│   │   │   └── templateHelpers.js           # helper bersama (escapeHtml, dsb.)
│   │   ├── services/
│   │   │   └── pdfGenerator.js          # wrapper Puppeteer
│   │   ├── utils/
│   │   │   ├── checklistDefaults.js     # konfigurasi item checklist per kategori
│   │   │   ├── period.js                # perhitungan periode PM berjalan
│   │   │   └── activityLog.js           # pencatat log aktivitas
│   │   └── server.js                    # entry point Express
│   ├── scripts/
│   │   ├── import-assets-from-excel.js  # import data aset awal
│   │   ├── seed-admin.js                # bikin akun admin pertama
│   │   └── update-kategori-from-excel.js
│   ├── storage/checklists/              # PDF hasil generate (gitignored)
│   └── package.json
└── frontend/
    ├── src/
    │   ├── api/
    │   │   └── client.js                # fetch wrapper + auth header + blob fetch
    │   ├── context/
    │   │   ├── AuthContext.jsx          # state login & user aktif
    │   │   └── ThemeContext.jsx         # dark/light mode
    │   ├── components/                  # komponen UI yang dipakai ulang
    │   ├── pages/
    │   │   ├── LoginPage.jsx
    │   │   ├── HomePage.jsx
    │   │   ├── SerialLookupPage.jsx      # lookup/registrasi aset + scan barcode
    │   │   ├── ChecklistFormPage.jsx     # form checklist dinamis per kategori
    │   │   ├── ChecklistPreviewPage.jsx  # preview & unduh PDF
    │   │   ├── HistoryPage.jsx           # riwayat checklist
    │   │   ├── TrackerPage.jsx           # status PM berjalan per periode
    │   │   ├── ScheduleUploadPage.jsx    # upload jadwal PM (admin/teknisi)
    │   │   ├── AssetDatabasePage.jsx     # database aset
    │   │   ├── UserManagementPage.jsx    # manajemen pengguna (admin)
    │   │   ├── ActivityLogPage.jsx       # log aktivitas (admin/spv)
    │   │   └── ProfilePage.jsx
    │   └── App.jsx                      # routing utama
    └── package.json
```

## Setup dari Laptop Baru — Windows
 
### 1. Clone repository

```bash
git clone https://github.com/AliFirdaus050/ProjectPMSIG.git
cd ProjectPMSIG
```

### 2. Siapkan database PostgreSQL

```sql
-- lewat psql atau tools GUI seperti pgAdmin
CREATE DATABASE pm_checklist_db;
```

### 3. Setup Backend

```bash
cd backend
pnpm install
pnpm approve-builds   # approve postinstall script (esbuild, puppeteer, bcrypt)
pnpm install          # ulangi supaya Chromium ke-download sempurna
```

Salin `.env.example` menjadi `.env`, lalu isi sesuai [tabel environment variables](#konfigurasi-environment-variables) di bawah.

Jalankan migration untuk membuat seluruh skema tabel:

```bash
pnpm run migrate
```

(Opsional) Import data aset awal dari file Excel:

```bash
# Dry run dulu untuk cek hasil parsing
node scripts/import-assets-from-excel.js "Perangkat Tuban.xlsx" --dry-run

# Import sungguhan per kategori
node scripts/import-assets-from-excel.js "Perangkat Tuban.xlsx" --only=PC/Laptop
node scripts/import-assets-from-excel.js "Perangkat Tuban.xlsx" --only=Printer,Switch
```

Buat akun admin pertama:

```bash
node scripts/seed-admin.js "Nama Lengkap" email@sig.co.id passwordAmanAdmin1
```

### 4. Setup Frontend

```bash
cd ../frontend
pnpm install
pnpm approve-builds   # kalau ada peringatan build script
pnpm install
```

Kalau menjalankan lewat HTTPS lokal (disarankan, karena kamera untuk pemindaian barcode butuh koneksi aman), siapkan sertifikat lokal (misal lewat [mkcert](https://github.com/FiloSottile/mkcert)) dan sesuaikan path-nya di `vite.config.js`.

## Konfigurasi Environment Variables

Buat file `.env` di folder `backend/` dengan variabel berikut:

| Variabel | Wajib | Contoh | Keterangan |
|---|---|---|---|
| `DATABASE_URL` | Ya | `postgresql://postgres:password@localhost:5432/pm_checklist_db` | Connection string PostgreSQL |
| `PORT` | Tidak | `4000` | Port backend, default `4000` jika tidak diisi |
| `JWT_SECRET` | Ya | string acak & panjang (≥32 karakter) | Kunci penandatanganan token JWT, **jangan** pakai nilai contoh |
| `JWT_EXPIRES_IN` | Tidak | `8h` | Masa berlaku token, default `8h` jika tidak diisi |
| `FRONTEND_URL` | Ya (produksi) | `https://10.6.55.200:5173,https://localhost:5173` | Whitelist origin untuk CORS, bisa lebih dari satu dipisah koma |
| `NODE_ENV` | Tidak | `development` / `production` | Memengaruhi verbosity log & beberapa perilaku keamanan |
| `OVERRIDE_TODAY` | Tidak | `2026-07-01` | **Hanya untuk testing**, override tanggal "hari ini" saat menghitung periode PM |

> **Penting:** jangan commit file `.env` ke repository. `JWT_SECRET` wajib diisi nilai acak sendiri, bukan nilai contoh di dokumentasi ini.

## Menjalankan Proyek

### Development

Jalankan backend dan frontend di dua terminal terpisah.

```bash
# terminal 1 — backend
cd backend
pnpm run dev
# server berjalan di http://localhost:4000
# cek kesehatan server: GET http://localhost:4000/api/v1/health

# terminal 2 — frontend
cd frontend
pnpm run dev
# aplikasi berjalan di http://localhost:5173 (atau sesuai konfigurasi vite.config.js)
```

## Setup dari Laptop Baru — Ubuntu/Linux
 
### 1. Update dulu & install Git
 
```bash
sudo apt update
sudo apt install -y git curl
```
 
### 2. Install Node.js
 
Cara paling gampang pakai NodeSource (contoh untuk Node 20 LTS):
 
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v
```
 
### 3. Install pnpm
 
```bash
sudo npm install -g pnpm
pnpm -v
```
 
### 4. Install PostgreSQL
 
```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable --now postgresql
```
 
Buat user & database:
 
```bash
sudo -u postgres psql
```
 
Di dalam prompt `psql`:
 
```sql
ALTER USER postgres WITH PASSWORD 'passwordAmanKalian';
CREATE DATABASE pm_checklist_db;
\q
```
 
### 5. Install mkcert
 
```bash
sudo apt install -y libnss3-tools
curl -JLO "https://dl.filippo.io/mkcert/latest?for=linux/amd64"
chmod +x mkcert-v*-linux-amd64
sudo mv mkcert-v*-linux-amd64 /usr/local/bin/mkcert
mkcert -install
```
 
### 6. Install dependency Puppeteer
 
Puppeteer butuh beberapa library sistem tambahan untuk menjalankan Chromium headless di Linux:
 
```bash
sudo apt install -y libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 \
  libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 \
  libxrandr2 libgbm1 libasound2
```
 
### 7. Clone repository
 
```bash
git clone https://github.com/AliFirdaus050/ProjectPMSIG.git
cd ProjectPMSIG
```
 
### 8. Setup Backend
 
```bash
cd backend
pnpm install
pnpm approve-builds
pnpm install
```
 
Buat file `.env`:
 
```bash
nano .env
```
 
Isi sesuai [Environment Variables](#environment-variables), lalu jalankan migration dan buat akun admin pertama:
 
```bash
pnpm run migrate
node scripts/seed-admin.js "Nama Lengkap" admin@sig.co.id passwordAmanAdmin1
```
 
### 9. Setup Frontend
 
```bash
cd ../frontend
pnpm install
pnpm approve-builds
pnpm install
mkcert localhost 127.0.0.1
```
 
Sama seperti di Windows, sesuaikan `frontend/vite.config.js` supaya path `key`/`cert` menunjuk ke nama file hasil `mkcert` yang baru saja dibuat.
 
## Menjalankan untuk Testing Sehari-hari
 
Ini mode yang paling sering dipakai selama development maupun waktu kalian eksplorasi/testing manual — dua proses jalan terpisah, masing-masing auto-reload kalau ada perubahan kode.
 
```bash
# terminal 1 — backend
cd backend
pnpm run dev
# jalan di http://localhost:4000
# cek hidup/tidaknya: GET http://localhost:4000/api/v1/health
 
# terminal 2 — frontend
cd frontend
pnpm run dev
# jalan di https://localhost:5173 (perhatikan HTTPS, bukan HTTP)
```
 
Buka `https://localhost:5173` di browser, login pakai akun admin yang dibuat lewat `seed-admin.js` tadi.
 
## Deployment Sungguhan (PM2 + Nginx)
 
Di lingkungan kami, aplikasi ini jalan begini: backend dijaga **PM2** (biar otomatis restart kalau crash dan tetap hidup 24 jam), dan **Nginx** berdiri di depan sebagai reverse proxy sekaligus yang menyajikan hasil build frontend.
 
> Catatan: file konfigurasi PM2 (`ecosystem.config.js`) dan Nginx belum kami commit ke repository ini, jadi contoh di bawah adalah representasi dari setup yang sebenarnya kami pakai — sesuaikan path dan domain/IP-nya dengan environment kalian.
 
### 1. Build frontend
 
```bash
cd frontend
pnpm run build
```
 
Ini menghasilkan folder `frontend/dist/` berisi static file siap disajikan.
 
### 2. Jalankan backend lewat PM2
 
Install PM2 secara global sekali saja:
 
```bash
sudo npm install -g pm2
```
 
Contoh `ecosystem.config.js` yang ditaruh di folder `backend/`:
 
```js
module.exports = {
  apps: [
    {
      name: 'pm-checklist-backend',
      script: 'src/server.js',
      cwd: __dirname,
      env: {
        NODE_ENV: 'production',
      },
      instances: 1,
      autorestart: true,
      watch: false,
    },
  ],
};
```
 
Jalankan:
 
```bash
cd backend
pnpm install --prod
pm2 start ecosystem.config.js
pm2 save
pm2 startup   # supaya PM2 otomatis jalan lagi kalau server reboot
```

## API Endpoints

Semua endpoint diawali prefix `/api/v1`. Endpoint selain `/auth/login` dan `/health` membutuhkan header `Authorization: Bearer <token>`.

### Auth (`/api/v1/auth`)

| Method | Endpoint | Deskripsi | Role |
|---|---|---|---|
| POST | `/login` | Login, mengembalikan JWT | Publik |
| POST | `/logout` | Logout (invalidasi sisi klien) | Semua role |
| GET | `/me` | Data profil pengguna yang sedang login | Semua role |

### Assets (`/api/v1/assets`)

| Method | Endpoint | Deskripsi | Role |
|---|---|---|---|
| GET | `/search` | Cari aset berdasarkan serial number/asset tag | Semua role |
| GET | `/` | Daftar seluruh aset | Semua role |
| GET | `/:id` | Detail satu aset | Semua role |
| POST | `/` | Registrasi aset baru | Teknisi, SPV, Admin |
| PATCH | `/:id` | Perbarui data aset | Teknisi, SPV, Admin |
| DELETE | `/:id` | Hapus aset | SPV, Admin |

### Checklists (`/api/v1/checklists`)

| Method | Endpoint | Deskripsi | Role |
|---|---|---|---|
| GET | `/template` | Konfigurasi item checklist per kategori | Semua role |
| GET | `/` | Daftar/riwayat checklist (filterable) | Semua role |
| POST | `/` | Mulai checklist baru untuk suatu aset+periode | Teknisi, Admin |
| GET | `/:id` | Detail lengkap checklist | Teknisi, Admin |
| PATCH | `/:id` | Simpan progres pengisian checklist | Teknisi (sesuai kepemilikan), Admin |
| POST | `/:id/generate-pdf` | Render checklist menjadi PDF | Teknisi (sesuai kepemilikan), Admin |
| GET | `/:id/pdf` | Unduh/lihat PDF checklist | Teknisi, SPV, Admin |
| POST | `/:id/approve` | Menyetujui checklist yang sudah selesai | SPV |

### Schedules (`/api/v1/schedules`)

| Method | Endpoint | Deskripsi | Role |
|---|---|---|---|
| GET | `/period-info` | Info periode PM berjalan | Semua role |
| GET | `/periods` | Daftar periode yang tersedia | Semua role |
| POST | `/upload` | Upload jadwal PM (Excel) | Teknisi, Admin |
| DELETE | `/` | Hapus jadwal periode tertentu | Admin |
| GET | `/` | Daftar jadwal | Semua role |
| GET | `/check/:assetId` | Cek jadwal untuk satu aset | Semua role |
| GET | `/tracker` | Data status PM untuk halaman Tracker | Semua role |

### Signatures (`/api/v1/signatures`)

| Method | Endpoint | Deskripsi | Role |
|---|---|---|---|
| GET | `/me` | Tanda tangan tersimpan milik akun sendiri | Semua role |
| PUT | `/me` | Simpan/perbarui tanda tangan sendiri | Semua role |

### Users (`/api/v1/users`)

| Method | Endpoint | Deskripsi | Role |
|---|---|---|---|
| GET | `/` | Daftar pengguna | Admin |
| POST | `/` | Tambah pengguna baru | Admin |
| PATCH | `/:id` | Perbarui data/role/status aktif pengguna | Admin |
| POST | `/:id/reset-password` | Reset password pengguna | Admin |
| DELETE | `/:id` | Hapus akun pengguna (riwayat checklist tetap tersimpan) | Admin |
| GET | `/:id/pic-assets` | Daftar aset yang ditugaskan ke PIC | Admin |
| POST | `/:id/pic-assets` | Tugaskan aset ke PIC | Admin |
| DELETE | `/:id/pic-assets/:assetId` | Batalkan penugasan aset ke PIC | Admin |

### Logs (`/api/v1/logs`)

| Method | Endpoint | Deskripsi | Role |
|---|---|---|---|
| GET | `/` | Daftar log aktivitas | Admin, SPV |
| GET | `/actions` | Daftar jenis aksi yang tercatat | Admin, SPV |


Untuk pertanyaan, laporan bug, atau usulan fitur, silakan buka issue di repository ini atau hubungi tim pengembang secara langsung.
