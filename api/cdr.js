import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.https://trzhfqurcdhiyagdxwgy.supabase.co/rest/v1/, 
    process.env.eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyemhmcXVyY2RoaXlhZ2R4d2d5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM4NjI2NzEsImV4cCI6MjEwOTQzODY3MX0.z1XUhHVu0-9tpvAR-9vN2dKrRa8janUR0j0zCKLEpdM
);

export default async function handler(req, res) {
    // Enable CORS for your webhook endpoint
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { data_list } = req.body;

        if (!data_list || !Array.isArray(data_list)) {
            return res.status(400).json({ success: false, error: 'Invalid payload: data_list missing or not an array' });
        }

        // Map incoming Simple2Call JSON keys to database columns
        const records = data_list.map(call => ({
            callid: call.callId,
            agentid: call.agentId,
            phone: call.phone,
            talktime: call.talkTime,
            calldirection: call.callDirection,
            callresult: call.callResult,
            callstart: call.callStart,
            callend: call.callEnd,
            dnis: call.dnis,
            acd: call.acd,
            project_id: call.project_id,
            discby: call.discBy
        }));

        // Upsert into Supabase (updates existing row if callid already exists)
        const { data, error } = await supabase
            .from('call_logs')
            .upsert(records, { onConflict: 'callid' });

        if (error) throw error;

        return res.status(200).json({ 
            success: true, 
            message: `Successfully processed ${records.length} call log(s)` 
        });

    } catch (err) {
        console.error("CDR Webhook Error:", err);
        return res.status(500).json({ success: false, error: err.message });
    }
}
