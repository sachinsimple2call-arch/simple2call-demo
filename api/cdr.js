import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const supabaseUrl = "https://trzhfqurcdhiyagdxwgy.supabase.co";
    const supabaseKey = "sb_secret_mvYcKWR5zn1eJaZziYN2eQ_dZ41JU9K";

    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
        const { data_list } = req.body;

        if (!data_list || !Array.isArray(data_list)) {
            return res.status(400).json({ success: false, error: 'Invalid payload: data_list missing or not an array' });
        }

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

        const { error } = await supabase
            .from('call_logs')
            .upsert(records, { onConflict: 'callid' });

        if (error) throw error;

        return res.status(200).json({ 
            success: true, 
            version: "v2-nocache",
            message: `Successfully processed ${records.length} call log(s)` 
        });

    } catch (err) {
        console.error("CDR Webhook Error:", err);
        return res.status(500).json({ success: false, error: err.message });
    }
}
