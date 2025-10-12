"""
Test Queries untuk Supabase Database
Testing koneksi dan query untuk dashboard history
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from database import get_supabase_client
from datetime import datetime, timedelta

def test_connection():
    """Test koneksi ke Supabase"""
    try:
        client = get_supabase_client()
        print("✅ Koneksi Supabase berhasil!")
        return client
    except Exception as e:
        print(f"❌ Error koneksi: {e}")
        return None

def get_history_by_nis(nis, limit=10):
    """
    Ambil history kehadiran berdasarkan NIS
    
    Args:
        nis: NIS siswa
        limit: Jumlah maksimal record yang diambil
    
    Returns:
        List of kehadiran records
    """
    try:
        client = get_supabase_client()
        
        result = client.table("kehadiran")\
            .select("*")\
            .eq("nis", nis)\
            .order("waktu_absen", desc=True)\
            .limit(limit)\
            .execute()
        
        return result.data
    
    except Exception as e:
        print(f"❌ Error query history: {e}")
        return []

def get_history_today(nis):
    """
    Ambil history kehadiran hari ini
    
    Args:
        nis: NIS siswa
    
    Returns:
        List of kehadiran records hari ini
    """
    try:
        client = get_supabase_client()
        today = datetime.now().date().isoformat()
        
        result = client.table("kehadiran")\
            .select("*")\
            .eq("nis", nis)\
            .gte("waktu_absen", f"{today}T00:00:00")\
            .lte("waktu_absen", f"{today}T23:59:59")\
            .order("waktu_absen", desc=True)\
            .execute()
        
        return result.data
    
    except Exception as e:
        print(f"❌ Error query today: {e}")
        return []

def get_siswa_by_nis(nis):
    """
    Ambil data siswa berdasarkan NIS
    
    Args:
        nis: NIS siswa
    
    Returns:
        Siswa data atau None
    """
    try:
        client = get_supabase_client()
        
        result = client.table("siswa")\
            .select("*")\
            .eq("nis", nis)\
            .execute()
        
        if result.data:
            return result.data[0]
        return None
    
    except Exception as e:
        print(f"❌ Error query siswa: {e}")
        return None

def format_history_for_display(history_data):
    """
    Format history data untuk display di dashboard
    
    Args:
        history_data: List of kehadiran records
    
    Returns:
        List of formatted records
    """
    formatted = []
    
    for record in history_data:
        waktu = datetime.fromisoformat(record['waktu_absen'].replace('Z', '+00:00'))
        
        # Tentukan status dan icon
        if record['status'] == 'hadir':
            status_class = 'success'
            status_text = 'Berhasil melakukan presensi'
            icon = '✅'
        else:
            status_class = 'failed'
            status_text = f"Gagal presensi - {record.get('alasan_ditolak', 'Unknown')}"
            icon = '❌'
        
        formatted.append({
            'time': waktu.strftime('%H.%M'),
            'message': status_text,
            'icon': icon,
            'status_class': status_class,
            'full_time': waktu.strftime('%Y-%m-%d %H:%M:%S')
        })
    
    return formatted

# Testing functions
if __name__ == "__main__":
    print("=== Testing Supabase Queries ===\n")
    
    # Test 1: Koneksi
    print("1. Testing Koneksi...")
    client = test_connection()
    
    if client:
        # Test 2: Get siswa (ganti dengan NIS yang ada di database)
        print("\n2. Testing Get Siswa...")
        test_nis = "244119927"  # NIS: Hurrcane, XI SIJA 2
        siswa = get_siswa_by_nis(test_nis)
        if siswa:
            print(f"✅ Siswa ditemukan: {siswa['nama']} - {siswa['kelas']}")
        else:
            print(f"⚠️ Siswa dengan NIS {test_nis} tidak ditemukan")
        
        # Test 3: Get history
        print("\n3. Testing Get History...")
        history = get_history_by_nis(test_nis, limit=5)
        if history:
            print(f"✅ Ditemukan {len(history)} record history")
            for h in history[:3]:
                print(f"   - {h['waktu_absen']}: {h['status']}")
        else:
            print(f"⚠️ Tidak ada history untuk NIS {test_nis}")
        
        # Test 4: Format history
        print("\n4. Testing Format History...")
        if history:
            formatted = format_history_for_display(history)
            print("✅ History berhasil diformat:")
            for f in formatted[:3]:
                print(f"   {f['time']} - {f['message']} {f['icon']}")
        
        # Test 5: Get history today
        print("\n5. Testing Get History Today...")
        today_history = get_history_today(test_nis)
        print(f"✅ Ditemukan {len(today_history)} record hari ini")
    
    print("\n=== Testing Selesai ===")
