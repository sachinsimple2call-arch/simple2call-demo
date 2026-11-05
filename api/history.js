import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SECRET_KEY;

    if (!supabaseUrl || !supabaseKey) {
        return res.status(500).json({ error: "Server configuration error" });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { phone } = req.query;

    try {
        let cdrQuery = supabase.from('call_logs').select('*').order('callstart', { ascending: false }).limit(15);
        let ctiQuery = supabase.from('click_calls').select('*').order('initiated_at', { ascending: false }).limit(15);

        if (phone) {
            cdrQuery = cdrQuery.eq('phone', phone);
            ctiQuery = ctiQuery.eq('phone', phone);
        }

        const [cdrRes, ctiRes] = await Promise.all([cdrQuery, ctiQuery]);

        if (cdrRes.error) throw cdrRes.error;
        if (ctiRes.error) throw ctiRes.error;

        return res.status(200).json({
            success: true,
            cdr: cdrRes.data || [],
            cti: ctiRes.data || []
        });
    } catch (err) {
        console.error("Fetch History Error:", err);
        return res.status(500).json({ success: false, error: err.message });
    }
}
