import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_SECRET_KEY } from './db-config.js';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

    try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);
        const body = req.body || {};
        const data_list = body.data_list || [body];

        if (!Array.isArray(data_list)) {
            return res.status(400).json({ success: false, error: 'Invalid payload: data_list missing or not an array' });
        }

        const records = data_list.map(call => ({
            callid: call.callId || call.callid,
            agentid: call.agentId || call.agentid,
            phone: call.phone,
            talktime: call.talkTime || call.talktime || 0,
            calldirection: call.callDirection || call.calldirection || 'Outbound',
            callresult: call.callResult || call.callresult || 'Completed',
            callstart: call.callStart || call.callstart || new Date().toISOString(),
            callend: call.callEnd || call.callend || new Date().toISOString(),
            dnis: call.dnis || '',
            acd: call.acd || '',
            project_id: call.project_id || '',
            discby: call.discBy || call.discby || ''
        }));

        // 1. Upsert call logs
        const { error } = await supabase
            .from('call_logs')
            .upsert(records, { onConflict: 'callid' });

        if (error) throw error;

        // 2. Link callid or auto-create missing CTI records
        for (const call of records) {
            // Try updating existing row first
            const { data: updatedRows } = await supabase
                .from('click_calls')
                .update({ callid: call.callid })
                .eq('phone', call.phone)
                .is('callid', null)
                .select();

            // If no click_calls row was found to update, create a fallback CTI entry so it's never missing!
            if (!updatedRows || updatedRows.length === 0) {
                await supabase.from('click_calls').insert([{
                    leadid: 'Auto_' + call.callid,
                    agentid: call.agentid || 'unknown_agent',
                    phone: call.phone,
                    from_number: call.dnis || '',
                    callid: call.callid,
                    status: `Completed (${call.callresult || 'CDR Ingested'})`,
                    initiated_at: call.callstart // Match the exact call start time!
                }]);
            }
        }

        return res.status(200).json({ 
            success: true, 
            message: `Successfully processed ${records.length} call log(s)` 
        });

    } catch (err) {
        console.error("CDR Webhook Error:", err);
        return res.status(500).json({ success: false, error: err.message });
    }
}
