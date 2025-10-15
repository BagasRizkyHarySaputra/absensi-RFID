# 🚀 Panduan Deploy Dashboard Absensi RFID ke Vercel

## ✅ Prerequisites

1. **Akun GitHub** (untuk push code)
2. **Akun Vercel** (gratis) - [Daftar di vercel.com](https://vercel.com)
3. **Supabase Project** yang sudah berjalan

---

## 📋 Struktur Project

```
pengguna/
├── app.py                  # Main Flask application (entry point)
├── database.py             # Supabase client configuration
├── requirements.txt        # Python dependencies
├── vercel.json            # Vercel deployment configuration
├── .env.example           # Template environment variables
├── .gitignore             # Files to ignore in Git
├── static/                # CSS & JavaScript files
│   ├── css/
│   └── js/
└── templates/             # HTML templates
    ├── dashboard_detector.html
    ├── dashboard_landscape.html
    ├── dashboard_potrait.html
    └── login.html
```

---

## 🔧 Langkah-langkah Deploy

### 1️⃣ Setup Environment Variables Lokal

```bash
# Copy template .env
cp .env.example .env

# Edit .env dan isi dengan nilai yang benar:
# SUPABASE_URL=https://your-project.supabase.co
# SUPABASE_KEY=your_anon_key_here
# SECRET_KEY=your_random_secret_key_here
```

### 2️⃣ Push ke GitHub

```bash
# Initialize git (jika belum)
git init

# Add semua files
git add .

# Commit
git commit -m "Initial commit - Dashboard Absensi RFID"

# Push ke GitHub
git remote add origin https://github.com/username/repo-name.git
git branch -M main
git push -u origin main
```

### 3️⃣ Deploy ke Vercel

1. **Login ke Vercel**
   - Buka [vercel.com](https://vercel.com)
   - Login dengan akun GitHub

2. **Import Project**
   - Klik tombol **"Add New Project"**
   - Pilih repository GitHub yang tadi dibuat
   - Klik **"Import"**

3. **Configure Project**
   - **Framework Preset**: Other
   - **Root Directory**: `pengguna` (jika project ada di subfolder)
   - Atau biarkan kosong jika `app.py` ada di root

4. **Setup Environment Variables**
   
   Di dashboard Vercel, masuk ke:
   - **Settings** → **Environment Variables**
   
   Tambahkan variabel berikut:
   
   | Key | Value | Environment |
   |-----|-------|-------------|
   | `SUPABASE_URL` | `https://your-project.supabase.co` | Production |
   | `SUPABASE_KEY` | `eyJhbGc...` (Supabase Anon Key) | Production |
   | `SECRET_KEY` | `random-secret-string` | Production |

   **Generate SECRET_KEY:**
   ```python
   python -c "import secrets; print(secrets.token_hex(32))"
   ```

5. **Deploy**
   - Klik tombol **"Deploy"**
   - Tunggu proses build selesai (~2-3 menit)
   - Vercel akan memberikan URL seperti: `https://your-project.vercel.app`

---

## 🧪 Testing Setelah Deploy

1. **Buka URL** yang diberikan Vercel
2. **Test Login** dengan kredensial yang ada di database Supabase
3. **Check Dashboard** apakah data muncul dengan benar
4. **Test API Endpoint**: 
   - `/test-connection` - Test koneksi Supabase
   - `/api/history/<nis>` - Test API history kehadiran

---

## 🔄 Update Deployment

Setiap kali push ke GitHub, Vercel akan **otomatis deploy ulang**:

```bash
# Setelah edit code
git add .
git commit -m "Update feature X"
git push origin main

# Vercel otomatis detect dan deploy
```

---

## 🐛 Troubleshooting

### Error: "Module not found"
- Pastikan semua dependencies ada di `requirements.txt`
- Check apakah import statement sudah benar

### Error: "SUPABASE_URL belum di-set"
- Pastikan Environment Variables sudah diset di Vercel Dashboard
- Redeploy setelah menambahkan env vars

### Dashboard Loading Lama (Cold Start)
- **Normal** untuk serverless: delay 1-3 detik saat pertama akses
- Setelah warm, akan lebih cepat

### Static Files Not Found
- Check apakah folder `static/` sudah ter-push ke GitHub
- Vercel harus bisa akses folder `static/` dan `templates/`

### Session Tidak Tersimpan
- Pastikan `SECRET_KEY` sudah diset di environment variables
- Jangan gunakan default value di production

---

## 📊 Monitoring

1. **Vercel Dashboard**
   - Lihat logs realtime
   - Monitor errors dan performance
   - Check analytics (jumlah request)

2. **Supabase Dashboard**
   - Monitor database queries
   - Check API usage
   - Lihat logs errors

---

## 🔒 Keamanan

- ✅ File `.env` sudah di-ignore di Git
- ✅ Secret key menggunakan environment variable
- ✅ Supabase key tidak hardcoded di code
- ⚠️ Gunakan Supabase RLS (Row Level Security) untuk protect data

---

## 💡 Tips

1. **Custom Domain**: 
   - Bisa tambahkan custom domain di Vercel (gratis)
   - Settings → Domains → Add Domain

2. **Preview Deployments**:
   - Setiap pull request otomatis dapat preview URL
   - Bisa test sebelum merge ke main

3. **Rollback**:
   - Bisa rollback ke deployment sebelumnya
   - Deployments → pilih versi → Promote to Production

4. **Logs**:
   - Realtime logs: Vercel Dashboard → Project → Logs
   - Function logs: Check untuk debug serverless functions

---

## 📞 Support

- **Vercel Docs**: https://vercel.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **Flask Docs**: https://flask.palletsprojects.com/

---

## ✨ Fitur Vercel yang Bisa Digunakan

- ✅ **Auto HTTPS** (SSL certificate gratis)
- ✅ **Global CDN** (loading cepat di seluruh dunia)
- ✅ **Auto Scaling** (handle traffic tinggi otomatis)
- ✅ **Instant Rollbacks** (rollback deployment dalam 1 klik)
- ✅ **Preview Deployments** (test sebelum production)
- ✅ **Analytics** (monitor traffic dan performance)

---

**Happy Deploying! 🎉**
