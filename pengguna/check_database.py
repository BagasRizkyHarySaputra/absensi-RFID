"""
Check data yang ada di database Supabase
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from database import get_supabase_client

def list_all_siswa():
    """Tampilkan semua siswa di database"""
    try:
        client = get_supabase_client()
        result = client.table("siswa").select("*").execute()
        
        print(f"\n{'='*60}")
        print(f"DAFTAR SISWA DI DATABASE ({len(result.data)} siswa)")
        print(f"{'='*60}")
        
        if result.data:
            for siswa in result.data:
                print(f"\nID: {siswa.get('id')}")
                print(f"Nama: {siswa.get('nama')}")
                print(f"NIS: {siswa.get('nis')}")
                print(f"NISN: {siswa.get('nisn')}")
                print(f"Kelas: {siswa.get('kelas')}")
                print(f"{'-'*60}")
        else:
            print("\n⚠️ Belum ada siswa di database")
        
        return result.data
    
    except Exception as e:
        print(f"❌ Error: {e}")
        return []

def list_all_kehadiran():
    """Tampilkan semua data kehadiran di database"""
    try:
        client = get_supabase_client()
        result = client.table("kehadiran").select("*").order("waktu_absen", desc=True).limit(20).execute()
        
        print(f"\n{'='*60}")
        print(f"DAFTAR KEHADIRAN DI DATABASE (20 terakhir)")
        print(f"{'='*60}")
        
        if result.data:
            for kehadiran in result.data:
                print(f"\nNIS: {kehadiran.get('nis')}")
                print(f"Nama: {kehadiran.get('nama')}")
                print(f"Kelas: {kehadiran.get('kelas')}")
                print(f"Waktu: {kehadiran.get('waktu_absen')}")
                print(f"Status: {kehadiran.get('status')}")
                if kehadiran.get('alasan_ditolak'):
                    print(f"Alasan: {kehadiran.get('alasan_ditolak')}")
                print(f"{'-'*60}")
        else:
            print("\n⚠️ Belum ada data kehadiran di database")
        
        return result.data
    
    except Exception as e:
        print(f"❌ Error: {e}")
        return []

def check_table_structure():
    """Check struktur tabel"""
    print(f"\n{'='*60}")
    print("CHECKING TABLE STRUCTURE")
    print(f"{'='*60}")
    
    try:
        client = get_supabase_client()
        
        # Coba ambil 1 record dari setiap tabel untuk lihat strukturnya
        print("\nTabel SISWA:")
        siswa = client.table("siswa").select("*").limit(1).execute()
        if siswa.data:
            print(f"Kolom: {list(siswa.data[0].keys())}")
        else:
            print("Tabel kosong")
        
        print("\nTabel KEHADIRAN:")
        kehadiran = client.table("kehadiran").select("*").limit(1).execute()
        if kehadiran.data:
            print(f"Kolom: {list(kehadiran.data[0].keys())}")
        else:
            print("Tabel kosong")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    print("="*60)
    print("DATABASE INSPECTOR - Supabase")
    print("="*60)
    
    # Check struktur tabel
    check_table_structure()
    
    # List semua siswa
    siswa_list = list_all_siswa()
    
    # List semua kehadiran
    kehadiran_list = list_all_kehadiran()
    
    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)
    print(f"Total Siswa: {len(siswa_list)}")
    print(f"Total Kehadiran (20 terakhir): {len(kehadiran_list)}")
    
    if siswa_list:
        print(f"\n💡 Untuk testing, gunakan NIS: {siswa_list[0].get('nis')}")
        print(f"   Nama: {siswa_list[0].get('nama')}")
        print(f"   Kelas: {siswa_list[0].get('kelas')}")
