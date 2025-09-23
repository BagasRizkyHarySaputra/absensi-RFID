from flask import Flask, request, jsonify, render_template_string
from datetime import datetime, timedelta
import json
import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)

# Initialize Supabase client
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)

class AbsensiWebServer:
    def __init__(self):
        self.client = supabase
        self.siswa_table = "siswa"
        self.kehadiran_table = "kehadiran"
    
    def validate_siswa(self, nama, nis, nisn, kelas, password):
        """Validasi data siswa dari ESP32"""
        try:
            result = self.client.table(self.siswa_table).select("*").eq("nis", nis).execute()
            
            if not result.data:
                return False, None, ["NIS tidak ditemukan dalam database"]
            
            siswa = result.data[0]
            errors = []
            
            if siswa['nama'].lower() != nama.lower():
                errors.append(f"Nama tidak sesuai")
            
            if siswa['nisn'] != nisn:
                errors.append(f"NISN tidak sesuai")
            
            if siswa['kelas'].lower() != kelas.lower():
                errors.append(f"Kelas tidak sesuai")
            
            if siswa['password'] != password:
                errors.append("Password salah")
            
            if errors:
                return False, siswa, errors
            
            return True, siswa, []
            
        except Exception as e:
            return False, None, [f"Error database: {str(e)}"]
    
    def catat_kehadiran(self, nama, nis, nisn, kelas, password):
        """Catat kehadiran siswa"""
        is_valid, siswa_data, errors = self.validate_siswa(nama, nis, nisn, kelas, password)
        
        kehadiran_data = {
            "nama": nama,
            "nis": nis,
            "nisn": nisn,
            "kelas": kelas,
            "password_input": password,
            "waktu_absen": datetime.now().isoformat()
        }
        
        if is_valid:
            kehadiran_data.update({
                "siswa_id": siswa_data['id'],
                "status": "hadir",
                "alasan_ditolak": None
            })
            
            try:
                result = self.client.table(self.kehadiran_table).insert(kehadiran_data).execute()
                return {
                    "status": "success",
                    "message": f"Selamat datang {nama}! Absensi berhasil dicatat.",
                    "siswa": siswa_data,
                    "waktu": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                }
            except Exception as e:
                return {
                    "status": "error",
                    "message": "Terjadi kesalahan sistem",
                    "error": str(e)
                }
        else:
            kehadiran_data.update({
                "siswa_id": siswa_data['id'] if siswa_data else None,
                "status": "ditolak",
                "alasan_ditolak": "; ".join(errors)
            })
            
            try:
                self.client.table(self.kehadiran_table).insert(kehadiran_data).execute()
                return {
                    "status": "rejected",
                    "message": "Data tidak valid. Hubungi admin.",
                    "errors": errors,
                    "waktu": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                }
            except Exception as e:
                return {
                    "status": "error",
                    "message": "Terjadi kesalahan sistem",
                    "error": str(e)
                }
    
    def get_kehadiran(self, tanggal=None, kelas=None, status=None, limit=100):
        """Ambil data kehadiran dengan filter"""
        try:
            query = self.client.table(self.kehadiran_table).select("*")
            
            if tanggal:
                query = query.gte("waktu_absen", f"{tanggal} 00:00:00").lte("waktu_absen", f"{tanggal} 23:59:59")
            
            if kelas:
                query = query.eq("kelas", kelas)
            
            if status:
                query = query.eq("status", status)
            
            result = query.order("waktu_absen", desc=True).limit(limit).execute()
            return result.data
            
        except Exception as e:
            print(f"Error mengambil data kehadiran: {e}")
            return []
    
    def get_stats_kehadiran(self, tanggal=None):
        """Ambil statistik kehadiran"""
        try:
            query = self.client.table(self.kehadiran_table).select("status")
            
            if tanggal:
                # Debug print
                start_time = f"{tanggal} 00:00:00"
                end_time = f"{tanggal} 23:59:59"
                print(f"🔍 Mencari kehadiran dari {start_time} sampai {end_time}")
                
                query = query.gte("waktu_absen", start_time).lte("waktu_absen", end_time)
            
            result = query.execute()
            data = result.data
            
            print(f"📊 Data ditemukan: {len(data)} record")
            print(f"📊 Sample data: {data[:3] if data else 'Tidak ada data'}")
            
            total = len(data)
            hadir = len([x for x in data if x['status'] == 'hadir'])
            ditolak = len([x for x in data if x['status'] == 'ditolak'])
            
            stats = {
                "total": total,
                "hadir": hadir,
                "ditolak": ditolak,
                "persentase_hadir": round((hadir/total*100) if total > 0 else 0, 1)
            }
            
            print(f"📊 Stats hasil: {stats}")
            return stats
            
        except Exception as e:
            print(f"❌ Error get_stats_kehadiran: {e}")
            return {"total": 0, "hadir": 0, "ditolak": 0, "persentase_hadir": 0}
    
    def get_siswa_stats(self):
        """Ambil statistik per siswa"""
        try:
            # Ambil semua siswa
            siswa_result = self.client.table(self.siswa_table).select("*").execute()
            
            if not siswa_result.data:
                return []
            
            stats = []
            for siswa in siswa_result.data:
                # Ambil semua kehadiran untuk siswa ini
                kehadiran_result = self.client.table(self.kehadiran_table)\
                    .select("status, waktu_absen")\
                    .eq("nis", siswa['nis'])\
                    .execute()
                
                kehadiran_data = kehadiran_result.data if kehadiran_result.data else []
                
                total_absensi = len(kehadiran_data)
                total_hadir = len([x for x in kehadiran_data if x['status'] == 'hadir'])
                total_ditolak = len([x for x in kehadiran_data if x['status'] == 'ditolak'])
                
                persentase_kehadiran = round((total_hadir / total_absensi * 100) if total_absensi > 0 else 0, 2)
                absensi_terakhir = max([x['waktu_absen'] for x in kehadiran_data], default=None)
                
                stats.append({
                    'nama': siswa['nama'],
                    'nis': siswa['nis'],
                    'kelas': siswa['kelas'],
                    'total_absensi': total_absensi,
                    'total_hadir': total_hadir,
                    'total_ditolak': total_ditolak,
                    'persentase_kehadiran': persentase_kehadiran,
                    'absensi_terakhir': absensi_terakhir
                })
            
            # Sort by total_ditolak descending
            stats.sort(key=lambda x: x['total_ditolak'], reverse=True)
            return stats
            
        except Exception as e:
            print(f"Error mengambil stats siswa: {e}")
            return []
    
    def update_kehadiran_status(self, kehadiran_id, new_status, alasan=None):
        """Update status kehadiran secara manual"""
        try:
            update_data = {
                "status": new_status,
                "updated_at": datetime.now().isoformat()
            }
            
            if new_status == "ditolak" and alasan:
                update_data["alasan_ditolak"] = f"Diubah manual oleh admin: {alasan}"
            elif new_status == "hadir":
                update_data["alasan_ditolak"] = None
            
            result = self.client.table(self.kehadiran_table).update(update_data).eq("id", kehadiran_id).execute()
            return True, "Status berhasil diupdate"
            
        except Exception as e:
            return False, f"Error update status: {str(e)}"

# Initialize absensi system
absensi_system = AbsensiWebServer()

# ===============================
# API ENDPOINTS
# ===============================

@app.route('/api/absensi', methods=['POST'])
def api_absensi():
    """Endpoint untuk ESP32 kirim data absensi"""
    try:
        data = request.get_json()
        
        nama = data.get('nama', '').strip()
        nis = data.get('nis', '').strip()
        nisn = data.get('nisn', '').strip()
        kelas = data.get('kelas', '').strip()
        password = data.get('password', '').strip()
        
        if not all([nama, nis, nisn, kelas, password]):
            return jsonify({
                "status": "error",
                "message": "Data tidak lengkap"
            }), 400
        
        result = absensi_system.catat_kehadiran(nama, nis, nisn, kelas, password)
        
        status_code = 200 if result['status'] == 'success' else 400
        return jsonify(result), status_code
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": "Server error",
            "error": str(e)
        }), 500

@app.route('/api/kehadiran')
def api_kehadiran():
    """API untuk ambil data kehadiran"""
    tanggal = request.args.get('tanggal')  # Format: YYYY-MM-DD
    kelas = request.args.get('kelas')
    status = request.args.get('status')  # hadir/ditolak
    limit = int(request.args.get('limit', 100))
    
    data = absensi_system.get_kehadiran(tanggal, kelas, status, limit)
    return jsonify(data)

@app.route('/api/debug')
def api_debug():
    """Debug endpoint untuk cek data"""
    try:
        # Cek jumlah siswa
        siswa_count = len(absensi_system.client.table("siswa").select("id").execute().data)
        
        # Cek jumlah kehadiran
        kehadiran_count = len(absensi_system.client.table("kehadiran").select("id").execute().data)
        
        # Cek kehadiran hari ini
        tanggal_hari_ini = datetime.now().strftime("%Y-%m-%d")
        kehadiran_hari_ini = absensi_system.get_kehadiran(tanggal=tanggal_hari_ini)
        
        # Sample data siswa
        sample_siswa = absensi_system.client.table("siswa").select("*").limit(3).execute().data
        
        # Sample data kehadiran
        sample_kehadiran = absensi_system.client.table("kehadiran").select("*").limit(3).execute().data
        
        return jsonify({
            "siswa_count": siswa_count,
            "kehadiran_count": kehadiran_count,
            "kehadiran_hari_ini_count": len(kehadiran_hari_ini),
            "sample_siswa": sample_siswa,
            "sample_kehadiran": sample_kehadiran,
            "tanggal_hari_ini": tanggal_hari_ini
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    """API untuk update status kehadiran"""
    try:
        data = request.get_json()
        kehadiran_id = data.get('id')
        new_status = data.get('status')  # 'hadir' atau 'ditolak'
        alasan = data.get('alasan', '')
        
        if not kehadiran_id or not new_status:
            return jsonify({"error": "ID dan status harus diisi"}), 400
        
        if new_status not in ['hadir', 'ditolak']:
            return jsonify({"error": "Status harus 'hadir' atau 'ditolak'"}), 400
        
        success, message = absensi_system.update_kehadiran_status(kehadiran_id, new_status, alasan)
        
        if success:
            return jsonify({"message": message})
        else:
            return jsonify({"error": message}), 500
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/admin')
def admin_panel():
    """Admin panel untuk manage kehadiran"""
    
    # Ambil data untuk admin
    tanggal_hari_ini = datetime.now().strftime("%Y-%m-%d")
    kehadiran_hari_ini = absensi_system.get_kehadiran(tanggal=tanggal_hari_ini, limit=200)
    stats_hari_ini = absensi_system.get_stats_kehadiran(tanggal=tanggal_hari_ini)
    
    admin_html = """
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Panel - Absensi Siswa</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
            background: white;
            border-radius: 15px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(45deg, #e74c3c, #c0392b);
            color: white;
            padding: 30px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
        }
        
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            padding: 30px;
            background: #f8f9fa;
        }
        
        .stat-card {
            background: white;
            border-radius: 10px;
            padding: 25px;
            text-align: center;
            box-shadow: 0 5px 15px rgba(0,0,0,0.08);
        }
        
        .stat-card h3 {
            color: #666;
            font-size: 0.9em;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 10px;
        }
        
        .stat-card .number {
            font-size: 2.5em;
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .stat-card.success .number { color: #28a745; }
        .stat-card.danger .number { color: #dc3545; }
        .stat-card.info .number { color: #17a2b8; }
        
        .content {
            padding: 30px;
        }
        
        .section {
            margin-bottom: 40px;
        }
        
        .section h2 {
            color: #333;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #eee;
        }
        
        .table-container {
            overflow-x: auto;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.08);
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            background: white;
        }
        
        th, td {
            padding: 15px;
            text-align: left;
            border-bottom: 1px solid #eee;
        }
        
        th {
            background: #f8f9fa;
            font-weight: 600;
            color: #333;
            text-transform: uppercase;
            font-size: 0.85em;
        }
        
        tr:hover {
            background: #f8f9fa;
        }
        
        .status {
            padding: 5px 12px;
            border-radius: 20px;
            font-size: 0.85em;
            font-weight: 500;
            text-transform: uppercase;
        }
        
        .status.hadir {
            background: #d4edda;
            color: #155724;
        }
        
        .status.ditolak {
            background: #f8d7da;
            color: #721c24;
        }
        
        .action-btn {
            padding: 5px 10px;
            margin: 2px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 12px;
            transition: all 0.3s;
        }
        
        .btn-hadir {
            background: #28a745;
            color: white;
        }
        
        .btn-hadir:hover {
            background: #218838;
        }
        
        .btn-tolak {
            background: #dc3545;
            color: white;
        }
        
        .btn-tolak:hover {
            background: #c82333;
        }
        
        .modal {
            display: none;
            position: fixed;
            z-index: 1000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.5);
        }
        
        .modal-content {
            background-color: white;
            margin: 15% auto;
            padding: 20px;
            border-radius: 10px;
            width: 300px;
            text-align: center;
        }
        
        .close {
            color: #aaa;
            float: right;
            font-size: 28px;
            font-weight: bold;
            cursor: pointer;
        }
        
        .close:hover {
            color: black;
        }
        
        .modal input, .modal textarea {
            width: 100%;
            padding: 10px;
            margin: 10px 0;
            border: 1px solid #ddd;
            border-radius: 5px;
        }
        
        .modal button {
            background: #007bff;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            margin: 5px;
        }
        
        .modal button:hover {
            background: #0056b3;
        }
        
        .alert {
            padding: 15px;
            margin: 20px 0;
            border-radius: 5px;
            display: none;
        }
        
        .alert.success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        
        .alert.error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔧 Admin Panel Absensi</h1>
            <p>Kelola status kehadiran siswa - {{ tanggal_hari_ini }}</p>
        </div>
        
        <div class="stats">
            <div class="stat-card info">
                <h3>Total Absensi Hari Ini</h3>
                <div class="number">{{ stats_hari_ini.total }}</div>
            </div>
            
            <div class="stat-card success">
                <h3>Siswa Hadir</h3>
                <div class="number">{{ stats_hari_ini.hadir }}</div>
            </div>
            
            <div class="stat-card danger">
                <h3>Ditolak</h3>
                <div class="number">{{ stats_hari_ini.ditolak }}</div>
            </div>
            
            <div class="stat-card info">
                <h3>Persentase Hadir</h3>
                <div class="number">{{ stats_hari_ini.persentase_hadir }}%</div>
            </div>
        </div>
        
        <div class="content">
            <div id="alert" class="alert"></div>
            
            <div class="section">
                <h2>🛠️ Kelola Kehadiran Hari Ini</h2>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Waktu</th>
                                <th>Nama</th>
                                <th>NIS</th>
                                <th>Kelas</th>
                                <th>Status</th>
                                <th>Keterangan</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {% for entry in kehadiran_hari_ini %}
                            <tr>
                                <td>{{ entry.waktu_absen[:19].replace('T', ' ') }}</td>
                                <td><strong>{{ entry.nama }}</strong></td>
                                <td>{{ entry.nis }}</td>
                                <td>{{ entry.kelas }}</td>
                                <td>
                                    <span class="status {{ entry.status }}">{{ entry.status }}</span>
                                </td>
                                <td>
                                    {% if entry.alasan_ditolak %}
                                        {{ entry.alasan_ditolak }}
                                    {% else %}
                                        ✅ Sukses
                                    {% endif %}
                                </td>
                                <td>
                                    <button class="action-btn btn-hadir" onclick="updateStatus({{ entry.id }}, 'hadir')">
                                        ✅ Hadir
                                    </button>
                                    <button class="action-btn btn-tolak" onclick="openRejectModal({{ entry.id }})">
                                        ❌ Tolak
                                    </button>
                                </td>
                            </tr>
                            {% endfor %}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Modal untuk input alasan penolakan -->
    <div id="rejectModal" class="modal">
        <div class="modal-content">
            <span class="close" onclick="closeRejectModal()">&times;</span>
            <h3>Alasan Penolakan</h3>
            <textarea id="rejectReason" placeholder="Masukkan alasan penolakan..." rows="3"></textarea>
            <button onclick="confirmReject()">Konfirmasi</button>
            <button onclick="closeRejectModal()">Batal</button>
        </div>
    </div>
    
    <script>
        let currentId = null;
        
        function updateStatus(id, status) {
            fetch('/api/update_status', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: id,
                    status: status
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.message) {
                    showAlert(data.message, 'success');
                    setTimeout(() => location.reload(), 1500);
                } else {
                    showAlert(data.error || 'Terjadi kesalahan', 'error');
                }
            })
            .catch(error => {
                showAlert('Error: ' + error, 'error');
            });
        }
        
        function openRejectModal(id) {
            currentId = id;
            document.getElementById('rejectModal').style.display = 'block';
            document.getElementById('rejectReason').value = '';
        }
        
        function closeRejectModal() {
            document.getElementById('rejectModal').style.display = 'none';
            currentId = null;
        }
        
        function confirmReject() {
            const reason = document.getElementById('rejectReason').value.trim();
            if (!reason) {
                alert('Alasan penolakan harus diisi!');
                return;
            }
            
            fetch('/api/update_status', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: currentId,
                    status: 'ditolak',
                    alasan: reason
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.message) {
                    showAlert(data.message, 'success');
                    closeRejectModal();
                    setTimeout(() => location.reload(), 1500);
                } else {
                    showAlert(data.error || 'Terjadi kesalahan', 'error');
                }
            })
            .catch(error => {
                showAlert('Error: ' + error, 'error');
            });
        }
        
        function showAlert(message, type) {
            const alert = document.getElementById('alert');
            alert.className = `alert ${type}`;
            alert.textContent = message;
            alert.style.display = 'block';
            
            setTimeout(() => {
                alert.style.display = 'none';
            }, 5000);
        }
        
        // Close modal when clicking outside
        window.onclick = function(event) {
            const modal = document.getElementById('rejectModal');
            if (event.target == modal) {
                closeRejectModal();
            }
        }
    </script>
</body>
</html>
    """
    
    return render_template_string(admin_html, 
                                tanggal_hari_ini=tanggal_hari_ini,
                                kehadiran_hari_ini=kehadiran_hari_ini,
                                stats_hari_ini=stats_hari_ini)

# ===============================
# WEB DASHBOARD
# ===============================

@app.route('/')
def dashboard():
    """Dashboard utama"""
    
    # Ambil data hari ini
    tanggal_hari_ini = datetime.now().strftime("%Y-%m-%d")
    kehadiran_hari_ini = absensi_system.get_kehadiran(tanggal=tanggal_hari_ini)
    stats_hari_ini = absensi_system.get_stats_kehadiran(tanggal=tanggal_hari_ini)
    
    # Ambil semua kehadiran (50 terakhir)
    semua_kehadiran = absensi_system.get_kehadiran(limit=50)
    
    dashboard_html = """
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard Absensi Siswa</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 15px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(45deg, #2196F3, #21CBF3);
            color: white;
            padding: 30px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
        }
        
        .header p {
            font-size: 1.1em;
            opacity: 0.9;
        }
        
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            padding: 30px;
            background: #f8f9fa;
        }
        
        .stat-card {
            background: white;
            border-radius: 10px;
            padding: 25px;
            text-align: center;
            box-shadow: 0 5px 15px rgba(0,0,0,0.08);
            transition: transform 0.3s ease;
        }
        
        .stat-card:hover {
            transform: translateY(-5px);
        }
        
        .stat-card h3 {
            color: #666;
            font-size: 0.9em;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 10px;
        }
        
        .stat-card .number {
            font-size: 2.5em;
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .stat-card.success .number { color: #28a745; }
        .stat-card.danger .number { color: #dc3545; }
        .stat-card.info .number { color: #17a2b8; }
        
        .content {
            padding: 30px;
        }
        
        .section {
            margin-bottom: 40px;
        }
        
        .section h2 {
            color: #333;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #eee;
        }
        
        .filter-bar {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 20px;
            display: flex;
            gap: 15px;
            flex-wrap: wrap;
            align-items: center;
        }
        
        .filter-bar input, .filter-bar select, .filter-bar button {
            padding: 10px 15px;
            border: 1px solid #ddd;
            border-radius: 5px;
            font-size: 14px;
        }
        
        .filter-bar button {
            background: #007bff;
            color: white;
            border: none;
            cursor: pointer;
            transition: background 0.3s;
        }
        
        .filter-bar button:hover {
            background: #0056b3;
        }
        
        .table-container {
            overflow-x: auto;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.08);
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            background: white;
        }
        
        th, td {
            padding: 15px;
            text-align: left;
            border-bottom: 1px solid #eee;
        }
        
        th {
            background: #f8f9fa;
            font-weight: 600;
            color: #333;
            text-transform: uppercase;
            font-size: 0.85em;
            letter-spacing: 0.5px;
        }
        
        tr:hover {
            background: #f8f9fa;
        }
        
        .status {
            padding: 5px 12px;
            border-radius: 20px;
            font-size: 0.85em;
            font-weight: 500;
            text-transform: uppercase;
        }
        
        .status.hadir {
            background: #d4edda;
            color: #155724;
        }
        
        .status.ditolak {
            background: #f8d7da;
            color: #721c24;
        }
        
        .refresh-btn {
            position: fixed;
            bottom: 30px;
            right: 30px;
            background: #28a745;
            color: white;
            border: none;
            padding: 15px;
            border-radius: 50%;
            font-size: 20px;
            cursor: pointer;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            transition: all 0.3s ease;
        }
        
        .refresh-btn:hover {
            background: #218838;
            transform: rotate(180deg);
        }
        
        @media (max-width: 768px) {
            .container { margin: 10px; }
            .header { padding: 20px; }
            .header h1 { font-size: 2em; }
            .stats { grid-template-columns: repeat(2, 1fr); }
            .content { padding: 20px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📚 Dashboard Absensi</h1>
            <p>Sistem Monitoring Kehadiran Siswa - {{ tanggal_hari_ini }}</p>
        </div>
        
        <div class="stats">
            <div class="stat-card info">
                <h3>Total Absensi Hari Ini</h3>
                <div class="number">{{ stats_hari_ini.total }}</div>
            </div>
            
            <div class="stat-card success">
                <h3>Siswa Hadir</h3>
                <div class="number">{{ stats_hari_ini.hadir }}</div>
            </div>
            
            <div class="stat-card danger">
                <h3>Ditolak</h3>
                <div class="number">{{ stats_hari_ini.ditolak }}</div>
            </div>
            
            <div class="stat-card info">
                <h3>Persentase Hadir</h3>
                <div class="number">{{ stats_hari_ini.persentase_hadir }}%</div>
            </div>
        </div>
        
        <div class="content">
            <div class="section">
                <h2>🔍 Filter Data</h2>
                <div class="filter-bar">
                    <input type="date" id="filterTanggal" value="{{ tanggal_hari_ini }}">
                    <input type="text" id="filterKelas" placeholder="Filter Kelas (e.g. XI SIJA 2)">
                    <select id="filterStatus">
                        <option value="">Semua Status</option>
                        <option value="hadir">Hadir</option>
                        <option value="ditolak">Ditolak</option>
                    </select>
                    <button onclick="applyFilter()">🔍 Filter</button>
                    <button onclick="clearFilter()">🔄 Reset</button>
                </div>
            </div>
            
            <div class="section">
                <h2>📋 Data Absensi Hari Ini</h2>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Waktu</th>
                                <th>Nama</th>
                                <th>NIS</th>
                                <th>Kelas</th>
                                <th>Status</th>
                                <th>Keterangan</th>
                            </tr>
                        </thead>
                        <tbody id="tableBody">
                            {% for entry in kehadiran_hari_ini %}
                            <tr>
                                <td>{{ entry.waktu_absen[:19].replace('T', ' ') }}</td>
                                <td><strong>{{ entry.nama }}</strong></td>
                                <td>{{ entry.nis }}</td>
                                <td>{{ entry.kelas }}</td>
                                <td>
                                    <span class="status {{ entry.status }}">{{ entry.status }}</span>
                                </td>
                                <td>
                                    {% if entry.alasan_ditolak %}
                                        {{ entry.alasan_ditolak }}
                                    {% else %}
                                        ✅ Sukses
                                    {% endif %}
                                </td>
                            </tr>
                            {% endfor %}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div class="section">
                <h2>📊 Riwayat Absensi (50 Terakhir)</h2>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Waktu</th>
                                <th>Nama</th>
                                <th>NIS</th>
                                <th>Kelas</th>
                                <th>Status</th>
                                <th>Keterangan</th>
                            </tr>
                        </thead>
                        <tbody>
                            {% for entry in semua_kehadiran %}
                            <tr>
                                <td>{{ entry.waktu_absen[:19].replace('T', ' ') }}</td>
                                <td><strong>{{ entry.nama }}</strong></td>
                                <td>{{ entry.nis }}</td>
                                <td>{{ entry.kelas }}</td>
                                <td>
                                    <span class="status {{ entry.status }}">{{ entry.status }}</span>
                                </td>
                                <td>
                                    {% if entry.alasan_ditolak %}
                                        {{ entry.alasan_ditolak }}
                                    {% else %}
                                        ✅ Sukses
                                    {% endif %}
                                </td>
                            </tr>
                            {% endfor %}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
    
    <button class="refresh-btn" onclick="location.reload()" title="Refresh Data">🔄</button>
    
    <script>
        function applyFilter() {
            const tanggal = document.getElementById('filterTanggal').value;
            const kelas = document.getElementById('filterKelas').value;
            const status = document.getElementById('filterStatus').value;
            
            let url = '/api/kehadiran?';
            const params = [];
            
            if (tanggal) params.push(`tanggal=${tanggal}`);
            if (kelas) params.push(`kelas=${encodeURIComponent(kelas)}`);
            if (status) params.push(`status=${status}`);
            
            url += params.join('&');
            
            fetch(url)
                .then(response => response.json())
                .then(data => {
                    updateTable(data);
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('Gagal memuat data');
                });
        }
        
        function clearFilter() {
            document.getElementById('filterTanggal').value = '{{ tanggal_hari_ini }}';
            document.getElementById('filterKelas').value = '';
            document.getElementById('filterStatus').value = '';
            applyFilter();
        }
        
        function updateTable(data) {
            const tbody = document.getElementById('tableBody');
            tbody.innerHTML = '';
            
            data.forEach(entry => {
                const row = tbody.insertRow();
                const waktu = entry.waktu_absen.substring(0, 19).replace('T', ' ');
                const statusClass = entry.status;
                const keterangan = entry.alasan_ditolak || '✅ Sukses';
                
                row.innerHTML = `
                    <td>${waktu}</td>
                    <td><strong>${entry.nama}</strong></td>
                    <td>${entry.nis}</td>
                    <td>${entry.kelas}</td>
                    <td><span class="status ${statusClass}">${entry.status}</span></td>
                    <td>${keterangan}</td>
                `;
            });
        }
        
        // Auto refresh setiap 30 detik
        setInterval(() => {
            console.log('Auto refreshing data...');
            applyFilter();
        }, 30000);
    </script>
</body>
</html>
    """
    
    return render_template_string(dashboard_html, 
                                tanggal_hari_ini=tanggal_hari_ini,
                                kehadiran_hari_ini=kehadiran_hari_ini,
                                semua_kehadiran=semua_kehadiran,
                                stats_hari_ini=stats_hari_ini)

@app.route('/test')
def test_page():
    """Halaman test untuk simulasi ESP32"""
    test_html = """
<!DOCTYPE html>
<html>
<head>
    <title>Test ESP32 Simulator</title>
    <style>
        body { font-family: Arial; max-width: 600px; margin: 50px auto; padding: 20px; }
        .form-group { margin: 15px 0; }
        label { display: block; margin-bottom: 5px; font-weight: bold; }
        input, button { width: 100%; padding: 10px; font-size: 16px; }
        button { background: #007bff; color: white; border: none; cursor: pointer; margin-top: 20px; }
        button:hover { background: #0056b3; }
        .response { margin-top: 20px; padding: 15px; border-radius: 5px; }
        .success { background: #d4edda; color: #155724; }
        .error { background: #f8d7da; color: #721c24; }
    </style>
</head>
<body>
    <h1>🧪 ESP32 Simulator - Test Absensi</h1>
    
    <form id="testForm">
        <div class="form-group">
            <label>Nama:</label>
            <input type="text" id="nama" value="haninkuu" required>
        </div>
        
        <div class="form-group">
            <label>NIS:</label>
            <input type="text" id="nis" value="244119927" required>
        </div>
        
        <div class="form-group">
            <label>NISN:</label>
            <input type="text" id="nisn" value="000000000000" required>
        </div>
        
        <div class="form-group">
            <label>Kelas:</label>
            <input type="text" id="kelas" value="XI SIJA 2" required>
        </div>
        
        <div class="form-group">
            <label>Password:</label>
            <input type="password" id="password" value="176" required>
        </div>
        
        <button type="submit">🚀 Kirim Absensi</button>
    </form>
    
    <div id="response"></div>
    
    <script>
        document.getElementById('testForm').onsubmit = function(e) {
            e.preventDefault();
            
            const data = {
                nama: document.getElementById('nama').value,
                nis: document.getElementById('nis').value,
                nisn: document.getElementById('nisn').value,
                kelas: document.getElementById('kelas').value,
                password: document.getElementById('password').value
            };
            
            fetch('/api/absensi', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            })
            .then(response => response.json())
            .then(result => {
                const responseDiv = document.getElementById('response');
                const className = result.status === 'success' ? 'success' : 'error';
                responseDiv.className = `response ${className}`;
                responseDiv.innerHTML = `
                    <h3>Response:</h3>
                    <pre>${JSON.stringify(result, null, 2)}</pre>
                `;
            })
            .catch(error => {
                document.getElementById('response').innerHTML = `
                    <div class="response error">
                        <h3>Error:</h3>
                        <p>${error}</p>
                    </div>
                `;
            });
        };
    </script>
</body>
</html>
    """
    return test_html

if __name__ == '__main__':
    print("🚀 Starting Absensi Web Server...")
    print("📊 Dashboard: http://localhost:5000")
    print("🔧 Admin Panel: http://localhost:5000/admin")
    print("🧪 Test ESP32: http://localhost:5000/test")
    print("🔌 API Absensi: POST http://localhost:5000/api/absensi")
    print("📋 API Data: GET http://localhost:5000/api/kehadiran")
    print("⚙️ API Update Status: POST http://localhost:5000/api/update_status")
    
    app.run(host='0.0.0.0', port=5000, debug=True)