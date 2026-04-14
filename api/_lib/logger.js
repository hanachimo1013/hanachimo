import { getSupabaseAdmin } from './auth.js';

/**
 * Insert a system log entry (fire-and-forget).
 * @param {{ action: string, entity_type: string, entity_name?: string, details?: object, performed_by?: string }} entry
 */
export async function logSystemEvent(entry) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    await supabaseAdmin.from('system_logs').insert({
      action: entry.action,
      entity_type: entry.entity_type,
      entity_name: entry.entity_name || null,
      details: entry.details || {},
      performed_by: entry.performed_by || 'system',
    });
  } catch (err) {
    // Never let logging failure break the main operation
    console.error('logSystemEvent error (non-fatal):', err);
  }
}
