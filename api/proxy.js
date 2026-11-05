export default async function handler(req, res) {
    // Enable CORS for your frontend
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

    // Build the target URL and append all parameters as query strings (since GET requests cannot have a body)
    const targetUrl = new URL(`https://ccs1.simple2call.com/cim/page`);
    targetUrl.searchParams.append('tenant', tenant);
    targetUrl.searchParams.append('loginkey', loginkey);
    targetUrl.searchParams.append('script', 'cim_api');
    targetUrl.searchParams.append('function', 'v1');
    targetUrl.searchParams.append('endpoint', 'click2dial');
    targetUrl.searchParams.append('method', 'call');
    targetUrl.searchParams.append('userId', 'script_admin');
    targetUrl.searchParams.append('userPassword', 'wuNAHW11g434!1');
    targetUrl.searchParams.append('agentId', agentId);
    targetUrl.searchParams.append('from', from);
    targetUrl.searchParams.append('to', to);
    targetUrl.searchParams.append('leadid', leadid);

    try {
        // Execute GET request without a body
        const apiResponse = await fetch(targetUrl.toString(), {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await apiResponse.text();
        return res.status(200).json({ success: true, rawResponse: data });
    } catch (error) {
        console.error("Proxy error:", error);
        return res.status(500).json({ success: false, error: error.message });
    }
}
