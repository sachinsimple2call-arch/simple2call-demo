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

    const { agentId, from, to, leadid } = req.body;

    const tenant = "id1_ccsdemo";
    const loginkey = "dijks9ksn9203ksfqmbxx1fncid";

    // Option A: If Simple2Call expects query parameters (Current setup)
    const targetUrl = new URL(`https://ccs1.simple2call.com/cim/page`);
    targetUrl.searchParams.append('tenant', tenant);
    targetUrl.searchParams.append('loginkey', loginkey);
    targetUrl.searchParams.append('script', 'cim_api');
    targetUrl.searchParams.append('function', 'v1');

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
        // NOTE: If your API specifically requires a POST with a JSON body instead of a GET with query params, 
        // change method to 'POST' and pass payload in the 'body' property.
        const apiResponse = await fetch(targetUrl.toString(), {
            method: 'GET', 
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const responseText = await apiResponse.text();
        console.log("Simple2Call raw response:", responseText);

        return res.status(200).json({ 
            success: true, 
            backendResponse: responseText 
        });

    } catch (error) {
        console.error("Proxy error:", error);
        return res.status(500).json({ success: false, error: error.message });
    }
}
