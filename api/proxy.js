import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_SECRET_KEY } from './db-config.js';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

    const { agentId, from, to, leadid } = req.body;

    if (!agentId || !to) {
        return res.status(400).json({ success: false, error: 'Missing agentId or target phone number' });
    }

    const generatedLeadId = leadid || 'Lead_' + Math.floor(Math.random() * 90000 + 10000);

    // 1. Securely log CTI initiation to Supabase
    try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);
        await supabase.from('click_calls').insert([{
            leadid: generatedLeadId,
            agentid: agentId,
            phone: to,
            from_number: from
        }]);
    } catch (dbErr) {
        console.error("Failed to log CTI initiation to Supabase:", dbErr);
    }

    // 2. Trigger Simple2Call Click-to-Call API via POST with the JSON body
    try {
        const simple2CallUrl = 'https://ccs1.simple2call.com/cim/page?tenant=id1_ccsdemo&loginkey=dijks9ksn9203ksfqmbxx1fncid&script=cim_api&function=v1';
        
        const payload = {
            endpoint: "click2dial",
            method: "call",
            userId: "script_admin",
            userPassword: "wuNAHW11g434!1",
            agentId: agentId,
            from: from,
            to: to,
            leadid: generatedLeadId
        };

        const apiResponse = await fetch(simple2CallUrl, { 
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const responseText = await apiResponse.text();
        
        let parsedResponse;
        try {
            parsedResponse = JSON.parse(responseText);
        } catch (e) {
            parsedResponse = responseText;
        }

        return res.status(200).json({
            success: true,
            backendResponse: parsedResponse
        });
    } catch (error) {
        console.error("Proxy Fetch Error:", error);
        return res.status(500).json({ success: false, error: error.message });
    }
}
