import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_SECRET_KEY } from './db-config.js';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET') return res.status(405).json({ success: false, error: 'Method not allowed' });

    try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);
        const { phone } = req.query;

        let cdrQuery = supabase.from('call_logs').select('*').order('callstart', { ascending: false }).limit(20);
        let ctiQuery = supabase.from('click_calls').select('*').order('initiated_at', { ascending: false }).limit(20);

        if (phone) {
            cdrQuery = cdrQuery.eq('phone', phone);
            ctiQuery = cdrQuery.eq('phone', phone); // note: filter both correctly
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
