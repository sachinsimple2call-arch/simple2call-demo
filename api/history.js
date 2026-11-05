async function fetchAllHistory(phone = null, customerName = '') {
    try {
        currentFilteredPhone = phone;
        const titleElement = document.getElementById("logSectionTitle");
        titleElement.innerText = phone ? `History for ${customerName} (${phone})` : "Live Call History";

        let url = '/api/history';
        if (phone) url += `?phone=${phone}`;

        const res = await fetch(url);
        const text = await res.text();
        
        let data;
        try {
            data = JSON.parse(text);
        } catch (jsonErr) {
            console.error("Server returned non-JSON response:", text);
            return;
        }

        if (!data.success) {
            console.error("API error:", data.error);
            return;
        }

        const logsContainer = document.getElementById("callLogs");
        let htmlContent = "";

        if (data.cdr && data.cdr.length > 0) {
            htmlContent += data.cdr.map(l => `
                <div class="log-item">
                    <strong>[${l.callstart || 'N/A'}] [CDR]</strong> 
                    Customer: <b>${getCustomerName(l.phone)} (${l.phone})</b> | 
                    Agent: <b>${l.agentid}</b> | 
                    Status: <span style="color: ${l.callresult === 'Connected' ? '#16a34a' : '#dc2626'}">${l.callresult}</span> 
                    (Talk: ${l.talktime || 0}s)
                </div>
            `).join("");
        }

        if (data.cti && data.cti.length > 0) {
            htmlContent += data.cti.map(c => `
                <div class="log-item" style="background: #f8fafc;">
                    <strong>[${c.initiated_at ? c.initiated_at.replace('T', ' ').substring(0, 19) : 'N/A'}] [CTI Trigger]</strong> 
                    Customer: <b>${getCustomerName(c.phone)} (${c.phone})</b> | 
                    Agent: <b>${c.agentid}</b> | 
                    Status: <span style="color: #2563eb">Initiated</span>
                </div>
            `).join("");
        }

        logsContainer.innerHTML = htmlContent || `<div class="log-item">[System] No call history found.</div>`;
    } catch (e) {
        console.error("Error fetching history:", e);
    }
}
