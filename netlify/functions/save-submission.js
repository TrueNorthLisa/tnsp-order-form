// netlify/functions/save-submission.js
// Saves the completed form data + AI estimate to Supabase.

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

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

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Supabase not configured" }) };
  }

  const {
    // Contact
    name, email, phone, company, referral,
    // Services
    services,
    // Screen printing
    sp_locations, sp_colours, sp_special, sp_pantone,
    // Embroidery
    emb_locations, emb_stitches, emb_colours,
    // DTF
    dtf_size, dtf_placements,
    // Vinyl
    vinyl_type, vinyl_placements,
    // Garments
    garment_type, garment_brand, qty_total, garment_colours, size_breakdown, garment_notes,
    // Artwork
    artwork_status, design_placement, design_notes, files_attached,
    // Timeline
    deadline, budget, extra_notes,
    // Quote
    ai_estimate,
    // Meta
    form_summary,
  } = body;

  const record = {
    // Contact
    customer_name: name || null,
    customer_email: email || null,
    customer_phone: phone || null,
    customer_company: company || null,
    referral_source: referral || null,

    // Decoration
    services: services || [],
    sp_locations: sp_locations || null,
    sp_colours: sp_colours || null,
    sp_special_inks: sp_special || null,
    sp_pantone: sp_pantone || null,
    emb_locations: emb_locations || null,
    emb_stitches: emb_stitches || null,
    emb_colours: emb_colours || null,
    dtf_size: dtf_size || null,
    dtf_placements: dtf_placements || null,
    vinyl_type: vinyl_type || null,
    vinyl_placements: vinyl_placements || null,

    // Garments
    garment_type: garment_type || null,
    garment_brand: garment_brand || null,
    qty_total: qty_total ? parseInt(qty_total) : null,
    garment_colours: garment_colours || null,
    size_breakdown: size_breakdown || null,
    garment_notes: garment_notes || null,

    // Artwork
    artwork_status: artwork_status || null,
    design_placement: design_placement || null,
    design_notes: design_notes || null,
    files_attached: files_attached || [],

    // Timeline
    deadline: deadline || null,
    budget_range: budget || null,
    extra_notes: extra_notes || null,

    // Quote
    ai_estimate: ai_estimate || null,
    form_summary: form_summary || null,

    // Status for your pipeline
    status: "new",
    submitted_at: new Date().toISOString(),
  };

  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/order_submissions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
        "Prefer": "return=representation",
      },
      body: JSON.stringify(record),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Supabase error:", err);
      return { statusCode: 502, headers, body: JSON.stringify({ error: "Database error" }) };
    }

    const saved = await res.json();
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, id: saved?.[0]?.id }),
    };
  } catch (err) {
    console.error("Save error:", err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Internal error" }) };
  }
};
