// netlify/functions/get-quote.js
// Proxies requests to the Anthropic API so the key never touches the browser.

const SYSTEM_PROMPT = `You are the quoting assistant for True North Screen Printing Ltd. (TNSP), a professional screen printing and embroidery shop based in Vancouver, BC, Canada. You generate clear, friendly, and accurate preliminary price estimates for customers who submit order intake forms.

PRICING KNOWLEDGE (all prices in CAD, exclude GST/PST):

SCREEN PRINTING:
Setup/screens: ~$25–35 per colour per location. Amortized over the run.
Printing per piece (1 location, 1 colour):
  12–23 pcs: ~$8–10
  24–47 pcs: ~$5–7
  48–71 pcs: ~$4–5
  72–143 pcs: ~$3–4
  144+: ~$2.50–3
Add ~$1–2 per extra colour per piece. Special inks (puff, metallic) add ~$1–2/pc.
2nd location adds ~60–80% of base location cost.

EMBROIDERY:
Digitizing (one-time setup if new logo): $35–75 depending on complexity.
Per piece pricing by stitch count:
  Under 5k stitches: $5–8/pc
  5k–10k: $8–12/pc
  10k–15k: $12–16/pc
  15k+: $16–22/pc
Minimum recommended: 6 pcs. Additional locations add 50–70% of base.

DTF TRANSFER:
Small patch (up to 4"): $2–4/transfer
Standard chest (4"–8"): $4–6/transfer
Oversized (8"+): $6–10/transfer
Gang sheets: quote by sheet area.
No setup fees. No minimums.

VINYL HEAT PRESS:
Cut vinyl (per piece, 1 colour): $3–6
Printed HTV (full colour): $5–9
Reflective: add ~$2–3
Per additional placement: add 60–80% of base.

BLANK GARMENTS (approximate wholesale, included in total):
T-shirts: $5–12 (Gildan economy to premium like Bella+Canvas)
Hoodies: $18–35
Hats: $10–22
Polos: $18–30
Jackets: $45–90

OUTPUT FORMAT:
- Open warmly, reference the customer's specific order
- Show a clear per-unit estimate AND total estimate range
- Break down the key cost components (blanks, decoration, setup) in plain language
- Note what's included and what could affect final price (artwork cleanup fees, rush, etc.)
- Mention that the team will confirm within 1 business day
- Keep it friendly and professional — this is a boutique shop, not a big-box printer
- If quantity is very small (under 12 for screen printing), gently recommend DTF or vinyl instead and price accordingly
- Flag if the deadline sounds tight and note a potential rush fee
- Use **bold** for key numbers and headers
- Do NOT include taxes in the estimate but mention they apply`;

exports.handler = async (event) => {
  // Only allow POST
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  // Basic CORS headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid JSON" }) };
  }

  const { formSummary } = body;
  if (!formSummary || typeof formSummary !== "string") {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing formSummary" }) };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: "API key not configured" }) };
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: `Please generate a preliminary quote estimate for this order inquiry:\n\n${formSummary}` }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Anthropic API error:", err);
      return { statusCode: 502, headers, body: JSON.stringify({ error: "Upstream API error" }) };
    }

    const data = await response.json();
    const quote = data.content?.[0]?.text || "";

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ quote }),
    };
  } catch (err) {
    console.error("Function error:", err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Internal error" }) };
  }
};
