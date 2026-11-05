import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    // Safely check environment variables
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SECRET_KEY;

    if (!supabaseUrl || !supabaseKey) {
        return res.status(500).json({ 
            success: false, 
            error: "Server configuration error: Missing Supabase credentials in Vercel" 
        });
    }

    try {
        const supabase = createClient(supabaseUrl, supabaseKey);
        const { phone } = req.query;

        let cdrQuery = supabase.from('call_logs').select('*').order('callstart', { ascending: false }).limit(15);
        let ctiQuery = supabase.from('click_calls').select('*').order('initiated_at', { ascending: false }).limit(15);

        if (phone) {
            cdrQuery = cdrQuery.eq('phone', phone);
            ctiQuery = ctiQuery.eq('phone', phone);
        }

        const [cdrRes, ctiRes] = await Promise.all([cdrQuery, ctiQuery]);

        return res.status(200).json({
            success: true,
            cdr: cdrRes.data || [],
            cti: ctiRes.data || []
        });

    } catch (err) {
        console.error("Fetch History API Error:", err);
        return res.status(500).json({ success: false, error: err.message });
    }
}
