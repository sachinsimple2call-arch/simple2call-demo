export default async function handler(req, res) {
    // Enable CORS for your Vercel frontend domain
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { agentId, from, to, leadid } = req.body;

    const tenant = "id1_ccsdemo";
    const loginkey = "dijks9ksn9203ksfqmbxx1fncid";
    const targetUrl = `https://ccs1.simple2call.com/cim/page?tenant=${tenant}&loginkey=${loginkey}&script=cim_api&function=v1`;

    const payload = {
        endpoint: "click2dial",
        method: "call",
        userId: "script_admin",
        userPassword: "wuNAHW11g434!1",
        agentId: agentId,
        from: from,
        to: to,
        leadid: leadid
    };

    try {
        // Server-to-server request bypasses browser CORS completely
        const apiResponse = await fetch(targetUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await apiResponse.text();
        return res.status(200).json({ success: true, rawResponse: data });
    } catch (error) {
        console.error("Proxy error:", error);
        return res.status(500).json({ success: false, error: error.message });
    }
}
