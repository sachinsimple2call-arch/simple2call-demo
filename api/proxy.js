import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_SECRET_KEY } from './db-config.js';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

    const { agentId, from, to, leadid } = req.body;

    // 1. Log CTI initiation to Supabase
    try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);
        await supabase.from('click_calls').insert([{
            leadid: leadid || 'Lead_' + Math.floor(Math.random() * 90000 + 10000),
            agentid: agentId,
            phone: to,
            from_number: from
        }]);
    } catch (dbErr) {
        console.error("Failed to log CTI initiation:", dbErr);
    }

    // 2. Trigger actual Click-to-Call API
    try {
        const apiUrl = `https://api.simple2call.com/api/v1/clickToCall?agentId=${encodeURIComponent(agentId)}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&leadid=${encodeURIComponent(leadid)}`;
        
        const apiResponse = await fetch(apiUrl, { method: 'POST' });
        const responseText = await apiResponse.text();

        return res.status(200).json({
            success: true,
            backendResponse: responseText
        });
    } catch (error) {
        console.error("Proxy Error:", error);
        return res.status(500).json({ success: false, error: error.message });
    }
}
