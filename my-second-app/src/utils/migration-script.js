// migration-script.js - Utility for migrating existing approved pengajuan_izin to report table
// Run this once to migrate existing data

import { bulkTransferApproved } from '../lib/reportService.js';

/**
 * Migration script to transfer all approved pengajuan_izin to report table
 * This should be run once when implementing the new report system
 */
export async function runMigration() {
  console.log('🚀 Starting migration of approved pengajuan_izin to report table...');
  
  try {
    const result = await bulkTransferApproved();
    
    if (result.success) {
      console.log('✅ Migration completed successfully!');
      console.log(`📊 Transferred: ${result.transferred} records`);
      console.log(`❌ Failed: ${result.failed} records`);
      
      if (result.failed > 0) {
        console.log('⚠️ Some records failed to transfer. Check the results for details:');
        const failedResults = result.results?.filter(r => !r.result.success) || [];
        failedResults.forEach(failure => {
          console.log(`   - Pengajuan ID ${failure.pengajuanId}: ${failure.result.error}`);
        });
      }
    } else {
      console.error('❌ Migration failed:', result.error);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Unexpected error during migration:', error);
    return { success: false, error: error.message };
  }
}

// Usage instructions:
console.log(`
📋 Migration Script Usage:
---------------------------
1. Ensure the 'report' table exists in your Supabase database with columns:
   - id (primary key)
   - nama (text)
   - nis (text)  
   - nisn (text)
   - kelas (text)
   - izin (boolean)
   - tanggal_mulai (timestamp)
   - tanggal_selesai (timestamp)
   - alasan (text)
   - pengajuan_izin_id (bigint, reference to pengajuan_izin.id)
   - created_at (timestamp)

2. Run this migration function to transfer existing approved data:
   import { runMigration } from './migration-script.js';
   await runMigration();

3. After migration, all new approvals will automatically transfer to report table.
`);

export default { runMigration };