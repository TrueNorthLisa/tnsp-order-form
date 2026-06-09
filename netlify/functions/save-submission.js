const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };
  
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );
    
    const fields = JSON.parse(event.body);
    
    const { data, error } = await supabase
      .from('order_submissions')
      .insert([{
        customer_name:    fields.name,
        customer_email:   fields.email,
        customer_phone:   fields.phone,
        company:          fields.company,
        referral:         fields.referral,
        decoration_types: fields.services,
        sp_placements:    fields.sp_placements,
        sp_special_inks:  fields.sp_special,
        sp_pantone:       fields.sp_pantone,
        emb_placements:   fields.emb_placements,
        emb_stitches:     fields.emb_stitches,
        emb_colours:      fields.emb_colours,
        dtf_size:         fields.dtf_size,
        dtf_placements:   fields.dtf_placements,
        vinyl_type:       fields.vinyl_type,
        vinyl_placements: fields.vinyl_placements,
        garment_type:     fields.garment_type,
        garment_brand:    fields.garment_brand,
        garment_colours:  fields.garment_colours,
        quantity:         parseInt(fields.qty_total) || 0,
        size_breakdown:   fields.size_breakdown,
        garment_notes:    fields.garment_notes,
        artwork_status:   fields.artwork_status,
        design_notes:     fields.design_notes,
        files_attached:   fields.files_attached,
        in_hand_date:     fields.deadline || null,
        budget_range:     fields.budget,
        notes:            fields.extra_notes,
        form_summary:     fields.form_summary,
        status:           'new',
      }])
      .select();

    if (error) throw error;

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, id: data[0]?.id }),
    };
  } catch (err) {
    console.error('save-submission error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
