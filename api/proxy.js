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

    // Build base URL with query parameters for authentication/routing
    const targetUrl = `https://ccs1.simple2call.com/cim/page?tenant=${tenant}&loginkey=${loginkey}&script=cim_api&function=v1`;

    // Send parameters as a JSON payload body (matching your original curl --data-raw structure)
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
        const apiResponse = await fetch(targetUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
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
