import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_SECRET_KEY } from './db-config.js';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

    try {
        const { environment, agentId, from, to, leadid } = req.body || {};

        if (!agentId || !to) {
            return res.status(400).json({ success: false, error: 'Missing agentId or target phone number' });
        }

        const generatedLeadId = leadid || 'Lead_' + Math.floor(Math.random() * 90000 + 10000);
        let simple2CallUrl, userId, userPassword;

        // Route explicitly based on selected environment
        if (environment === 'production') {
            simple2CallUrl = 'https://pbxed.simple2call.com/cim/page?tenant=custdemo&loginkey=wkjn23zdIV293kss1hWIE2S2bsn3w&script=cim_api&function=v1';
            userId = process.env.PROD_API_USER;
            userPassword = process.env.PROD_API_PASS;
        } else {
            // Lab environment
            simple2CallUrl = 'https://ccs1.simple2call.com/cim/page?tenant=id1_ccsdemo&loginkey=dijks9ksn9203ksfqmbxx1fncid&script=cim_api&function=v1';
            userId = process.env.LAB_API_USER;
            userPassword = process.env.LAB_API_PASS;
        }

        if (!userId || !userPassword) {
            return res.status(500).json({ 
                success: false, 
                error: `Server configuration error: Missing environment variables for [${environment || 'lab'}]` 
            });
        }
        
        const payload = {
            endpoint: "click2dial",
            method: "call",
            userId: userId,
            userPassword: userPassword,
            agentId: agentId,
            from: from,
            to: to,
            leadid: generatedLeadId
        };

        const apiResponse = await fetch(simple2CallUrl, { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const responseText = await apiResponse.text();
        let parsedResponse;
        try {
            parsedResponse = JSON.parse(responseText);
        } catch (e) {
            parsedResponse = { raw: responseText };
        }

        const isApiFailed = parsedResponse.status === 'ERROR' || parsedResponse.success === false || parsedResponse.error;
        const errorMessage = parsedResponse.error || parsedResponse.message || parsedResponse.raw || "Simple2Call rejected the request";
        
        const rawCallId = parsedResponse.callId || parsedResponse.callid || parsedResponse.id || parsedResponse.data?.callId;
        const returnedCallId = rawCallId ? parseInt(rawCallId, 10) : null;

        // Log transaction into Supabase safely
        try {
            const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);
            await supabase.from('click_calls').insert([{
                leadid: generatedLeadId,
                agentid: agentId,
                phone: to,
                from_number: from,
                callid: !isNaN(returnedCallId) ? returnedCallId : null,
                initiated_at: new Date().toISOString()
            }]);
        } catch (dbErr) {
            console.error("Supabase Log Error (Non-blocking):", dbErr);
        }

        if (isApiFailed) {
            return res.status(400).json({
                success: false,
                error: errorMessage,
                backendResponse: parsedResponse
            });
        }

        return res.status(200).json({
            success: true,
            backendResponse: parsedResponse
        });

    } catch (error) {
        console.error("Proxy Runtime Exception:", error);
        return res.status(500).json({ success: false, error: error.message || "Internal Server Error" });
    }
}
