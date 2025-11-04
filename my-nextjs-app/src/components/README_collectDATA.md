# collectDATA.jsx - Data Collection Module

## Overview
This module provides clean separation of concerns for data collection, transformation, and export functionality in the attendance system. It centralizes all data-related operations and provides a consistent API for the UI components.

**Updated for Database Structure:**
- Tabel `kehadiran`: id, siswa_id, nama, nis, nisn, kelas, password_input, status, alasan_ditolak, waktu_absen, created_at, updated_at
- Tabel `siswa`: id, nama, nis, nisn, kelas, created_at, updated_at, password

## Main Functions

### Data Fetching
- `fetchAttendanceData(options, filters)` - Main function to fetch kehadiran data with pagination and filtering
- `generateMockAttendanceData(count)` - Generates mock data for fallback scenarios

### Data Transformation
- `transformAttendanceItem(item)` - Transforms raw database data to display format
- `getAttendanceStatistics(data)` - Calculates attendance statistics from data array

### Data Export
- `exportAttendanceToCSV(data, filename)` - Exports attendance data to CSV format (includes NISN column)

### Helper Functions
- `formatDate(dateString)` - Formats date for display
- `formatTime(timeString)` - Formats time for display
- `getPresenceText(status)` - Maps status to presence text
- `getDisplayStatus(status)` - Maps database status to display status
- `getInfoFromStatus(status)` - Gets info text from status

### Validation Functions
- `validateAttendanceData(data)` - Validates attendance data structure
- `sanitizeAttendanceData(data)` - Cleans and sanitizes data

## Usage Example

```javascript
import { 
  fetchAttendanceData, 
  getAttendanceStatistics, 
  exportAttendanceToCSV 
} from './collectDATA';

// Fetch data with pagination and filters
const result = await fetchAttendanceData(
  { page: 1, pageSize: 10, sortBy: 'waktu_absen', sortOrder: 'desc' },
  { search: 'John', status: 'hadir', kelas: 'XI SIJA 1' }
);

// Get statistics
const stats = getAttendanceStatistics(result.data);

// Export to CSV (includes NISN)
exportAttendanceToCSV(result.data, 'attendance_export.csv');
```

## Status Values

### Database Status Values:
- `hadir` - Siswa hadir tepat waktu
- `terlambat` - Siswa hadir terlambat  
- `tidak_hadir` - Siswa tidak hadir
- `izin` - Siswa izin dengan keterangan
- `sakit` - Siswa sakit dengan surat
- `pending` - Menunggu verifikasi

### Display Status Mapping:
- `hadir` → `Accepted`
- `terlambat` → `Pending`
- `tidak_hadir` → `Rejected`
- `izin` → `Pending`
- `sakit` → `Accepted`
- `pending` → `Pending`

## Filter Options

```javascript
const filters = {
  siswaId: 'student-123',      // Filter by student ID
  kelas: 'XI SIJA 1',          // Filter by class
  status: 'hadir',             // Filter by status
  startDate: '2025-01-01',     // Filter from date
  endDate: '2025-01-31',       // Filter to date
  search: 'Ahmad'              // Search in nama, nis, or nisn
};
```

## Features
- ✅ Database integration with Supabase
- ✅ Mock data fallback for offline/demo mode
- ✅ Advanced filtering and search (nama, nis, nisn)
- ✅ Pagination support
- ✅ Data transformation and formatting
- ✅ Statistics calculation
- ✅ CSV export functionality with NISN
- ✅ Error handling and validation
- ✅ Clean separation of concerns
- ✅ Denormalized data support

## Error Handling
The module includes comprehensive error handling:
- Fallback to mock data when database is unavailable
- Graceful degradation for missing data
- Validation and sanitization of input data
- Clear error messages and logging

## Dependencies
- `supabase` from '../lib/supabase'
- Browser APIs for CSV export functionality

## Setup Requirements
1. Create Supabase project
2. Setup environment variables in `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
3. Create database tables using correct structure (see DATABASE_STRUCTURE.md)

## Database Query Structure

The module queries the `kehadiran` table with optional join to `siswa`:

```sql
SELECT 
  k.*,
  s.id, s.nama, s.nis, s.nisn, s.kelas, s.password
FROM kehadiran k
LEFT JOIN siswa s ON k.siswa_id = s.id
WHERE k.status = 'hadir'
ORDER BY k.waktu_absen DESC;
```

## Migration Notes

If migrating from different database structure:
1. Update all field references in the code
2. Update query structure to match new table names
3. Test all functionality thoroughly
4. Update mock data generation to match new fields