const { Resend } = require('resend');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };
  
  try {
    const fields = JSON.parse(event.body);

    const payload = {
      customer_name:    fields.name || null,
      customer_email:   fields.email || null,
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

    // 1. Save to Supabase
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
    if (!res.ok) throw new Error(`Supabase error ${res.status}: ${text.slice(0,300)}`);
    const saved = JSON.parse(text);
    const submissionId = saved[0]?.id || '—';

    // 2. Send notification email to team
    const resend = new Resend(process.env.RESEND_API_KEY);

    const row = (label, value) => value ? `
      <tr>
        <td style="padding:8px 12px;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#666;border-bottom:1px solid #1e1e1e;white-space:nowrap;vertical-align:top;">${label}</td>
        <td style="padding:8px 12px;font-size:13px;color:#d4d0c8;border-bottom:1px solid #1e1e1e;">${value}</td>
      </tr>` : '';

    const services = (fields.services || []).join(', ').toUpperCase() || '—';
    const spDetail = fields.sp_placements ? `Placements: ${fields.sp_placements}${fields.sp_special && fields.sp_special !== 'None' ? ' · Special: ' + fields.sp_special : ''}${fields.sp_pantone ? ' · Pantone: ' + fields.sp_pantone : ''}` : null;
    const embDetail = fields.emb_placements ? `Placements: ${fields.emb_placements}${fields.emb_stitches ? ' · Stitches: ' + fields.emb_stitches : ''}${fields.emb_colours ? ' · Colours: ' + fields.emb_colours : ''}` : null;
    const dtfDetail = fields.dtf_size ? `Size: ${fields.dtf_size} · Placements: ${fields.dtf_placements || '—'}` : null;
    const vinylDetail = fields.vinyl_type ? `Type: ${fields.vinyl_type} · Placements: ${fields.vinyl_placements || '—'}` : null;

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#0d0d0d;font-family:'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0d0d;padding:32px 20px;">
<tr><td align="center">
<table width="580" cellpadding="0" cellspacing="0" style="max-width:580px;width:100%;">

  <!-- Header -->
  <tr><td style="padding-bottom:24px;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="font-size:24px;font-weight:900;letter-spacing:6px;color:#f0ede8;">TRUE <span style="color:#c8392b;">NORTH</span></td>
        <td align="right" style="font-size:11px;letter-spacing:2px;color:#555;text-transform:uppercase;">New Order Request</td>
      </tr>
    </table>
    <div style="height:3px;background:#c8392b;margin-top:12px;"></div>
  </td></tr>

  <!-- Alert banner -->
  <tr><td style="background:#c8392b;padding:14px 20px;border-radius:4px;margin-bottom:20px;">
    <p style="margin:0;font-size:15px;font-weight:700;color:#fff;letter-spacing:1px;">🔔 NEW QUOTE REQUEST — ACTION REQUIRED</p>
    <p style="margin:4px 0 0;font-size:12px;color:rgba(255,255,255,0.8);">A customer has submitted an order request. Build their quote in the quote builder.</p>
  </td></tr>

  <tr><td style="height:16px;"></td></tr>

  <!-- Customer details -->
  <tr><td style="background:#141414;border:1px solid #2a2a2a;border-radius:6px;overflow:hidden;margin-bottom:16px;">
    <div style="background:#1a1a1a;padding:10px 16px;border-bottom:1px solid #2a2a2a;">
      <span style="font-size:10px;letter-spacing:2px;color:#c8392b;text-transform:uppercase;font-weight:700;">Customer</span>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0">
      ${row('Name', fields.name)}
      ${row('Company', fields.company)}
      ${row('Email', fields.email)}
      ${row('Phone', fields.phone)}
      ${row('Referral', fields.referral)}
    </table>
  </td></tr>

  <tr><td style="height:12px;"></td></tr>

  <!-- Decoration -->
  <tr><td style="background:#141414;border:1px solid #2a2a2a;border-radius:6px;overflow:hidden;margin-bottom:16px;">
    <div style="background:#1a1a1a;padding:10px 16px;border-bottom:1px solid #2a2a2a;">
      <span style="font-size:10px;letter-spacing:2px;color:#c8392b;text-transform:uppercase;font-weight:700;">Decoration</span>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0">
      ${row('Services', services)}
      ${row('Screen Print', spDetail)}
      ${row('Embroidery', embDetail)}
      ${row('DTF', dtfDetail)}
      ${row('Vinyl', vinylDetail)}
    </table>
  </td></tr>

  <tr><td style="height:12px;"></td></tr>

  <!-- Garment -->
  <tr><td style="background:#141414;border:1px solid #2a2a2a;border-radius:6px;overflow:hidden;margin-bottom:16px;">
    <div style="background:#1a1a1a;padding:10px 16px;border-bottom:1px solid #2a2a2a;">
      <span style="font-size:10px;letter-spacing:2px;color:#c8392b;text-transform:uppercase;font-weight:700;">Garment & Quantity</span>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0">
      ${row('Garment Type', fields.garment_type)}
      ${row('Brand / Style', fields.garment_brand)}
      ${row('Colour(s)', fields.garment_colours)}
      ${row('Total Qty', fields.qty_total ? fields.qty_total + ' units' : null)}
      ${row('Size Breakdown', fields.size_breakdown)}
      ${row('Garment Notes', fields.garment_notes)}
    </table>
  </td></tr>

  <tr><td style="height:12px;"></td></tr>

  <!-- Artwork & Timeline -->
  <tr><td style="background:#141414;border:1px solid #2a2a2a;border-radius:6px;overflow:hidden;margin-bottom:16px;">
    <div style="background:#1a1a1a;padding:10px 16px;border-bottom:1px solid #2a2a2a;">
      <span style="font-size:10px;letter-spacing:2px;color:#c8392b;text-transform:uppercase;font-weight:700;">Artwork & Timeline</span>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0">
      ${row('Artwork Status', fields.artwork_status)}
      ${row('Design Notes', fields.design_notes)}
      ${row('Files Attached', fields.files_attached?.length ? fields.files_attached.join(', ') : null)}
      ${row('In-Hands Date', fields.deadline)}
      ${row('Budget', fields.budget)}
      ${row('Extra Notes', fields.extra_notes)}
    </table>
  </td></tr>

  <!-- CTA -->
  <tr><td style="padding:20px 0;text-align:center;">
    <a href="https://tnspquote.netlify.app" style="display:inline-block;background:#e8c547;color:#0d0d0d;text-decoration:none;padding:14px 32px;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;border-radius:4px;">Open Quote Builder →</a>
  </td></tr>

  <!-- Footer -->
  <tr><td style="text-align:center;padding-top:8px;">
    <p style="font-size:11px;color:#333;margin:0;">Submission ID: ${submissionId}</p>
    <p style="font-size:11px;color:#333;margin:4px 0 0;">True North Screen Printing · Vancouver, BC</p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;

    await resend.emails.send({
      from: 'True North Order Form <sales@truenorthscreenprinting.ca>',
      to: ['sales@truenorthscreenprinting.ca'],
      cc: ['lisa@truenorthscreenprinting.ca'],
      subject: `🔔 New Quote Request — ${fields.name}${fields.company ? ' · ' + fields.company : ''} · ${fields.qty_total || '?'} units`,
      html,
    });

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (err) {
    console.error('save-submission error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
