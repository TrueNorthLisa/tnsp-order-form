exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };
  
  try {
    const fields = JSON.parse(event.body);
    
    const payload = {
      customer_name:    fields.name,
      customer_email:   fields.email,
      customer_phone:   fields.phone || null,
      company:          fields.company || null,
      referral:         fields.referral || null,
      decoration_types: fields.services || [],
      sp_placements:    fields.sp_placements || null,
      sp_special_inks:  fields.sp_special || null,
      sp_pantone:       fields.sp_pantone || null,
      emb_placements:   fields.emb_placements || null,
      emb_stitches:     fields.emb_stitches || null,
      emb_colours:      fields.emb_colours || null,
      dtf_size:         fields.dtf_size || null,
      dtf_placements:   fields.dtf_placements || null,
      vinyl_type:       fields.vinyl_type || null,
      vinyl_placements: fields.vinyl_placements || null,
      garment_type:     fields.garment_type || null,
      garment_brand:    fields.garment_brand || null,
      garment_colours:  fields.garment_colours || null,
      quantity:         parseInt(fields.qty_total) || 0,
      size_breakdown:   fields.size_breakdown || null,
      garment_notes:    fields.garment_notes || null,
      artwork_status:   fields.artwork_status || null,
      design_notes:     fields.design_notes || null,
      files_attached:   fields.files_attached || [],
      in_hand_date:     fields.deadline || null,
      budget_range:     fields.budget || null,
      notes:            fields.extra_notes || null,
      status:           'new',
    };

    const res = await fetch(`${process.env.SUPABASE_URL}/rest/v1/order_submissions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
        'Prefer': 'return=representation',
      },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    if (!res.ok) throw new Error(`Supabase error ${res.status}: ${text.slice(0,200)}`);

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  } catch (err) {
    console.error('save-submission error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
