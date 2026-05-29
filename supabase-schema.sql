-- ============================================================
-- True North Screen Printing — Order Submissions Table
-- Run this in your Supabase SQL Editor (once)
-- https://piiyxripiynzoabazhjd.supabase.co
-- ============================================================

create table if not exists order_submissions (
  id                  uuid primary key default gen_random_uuid(),

  -- Contact
  customer_name       text,
  customer_email      text,
  customer_phone      text,
  customer_company    text,
  referral_source     text,

  -- Decoration types (array, e.g. ["sp","emb"])
  services            text[],

  -- Screen printing
  sp_locations        text,
  sp_colours          text,
  sp_special_inks     text,
  sp_pantone          text,

  -- Embroidery
  emb_locations       text,
  emb_stitches        text,
  emb_colours         text,

  -- DTF
  dtf_size            text,
  dtf_placements      text,

  -- Vinyl
  vinyl_type          text,
  vinyl_placements    text,

  -- Garments
  garment_type        text,
  garment_brand       text,
  qty_total           integer,
  garment_colours     text,
  size_breakdown      text,
  garment_notes       text,

  -- Artwork
  artwork_status      text,
  design_placement    text,
  design_notes        text,
  files_attached      text[],

  -- Timeline & budget
  deadline            text,
  budget_range        text,
  extra_notes         text,

  -- Quote
  ai_estimate         text,
  form_summary        text,

  -- Pipeline status
  -- Values: new | reviewed | quoted | won | lost | no-reply
  status              text not null default 'new',

  -- Timestamps
  submitted_at        timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- Auto-update updated_at on any row change
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists order_submissions_updated_at on order_submissions;
create trigger order_submissions_updated_at
  before update on order_submissions
  for each row execute function update_updated_at();

-- Index for common queries (status board, email lookup)
create index if not exists idx_order_submissions_status      on order_submissions(status);
create index if not exists idx_order_submissions_email       on order_submissions(customer_email);
create index if not exists idx_order_submissions_submitted   on order_submissions(submitted_at desc);

-- Row-level security: only service-role key can write (your Netlify function uses service key)
alter table order_submissions enable row level security;

-- Allow the Netlify function (service key) full access — no extra policy needed for service role.
-- If you ever want to view submissions in a dashboard with the anon key, add a select policy:
-- create policy "Allow anon select" on order_submissions for select using (true);

-- ============================================================
-- OPTIONAL: quick view for your pipeline
-- ============================================================
create or replace view v_order_pipeline as
select
  id,
  submitted_at::date                            as date,
  customer_name,
  customer_email,
  customer_company,
  services,
  garment_type,
  qty_total,
  deadline,
  budget_range,
  status,
  left(ai_estimate, 120)                        as estimate_preview
from order_submissions
order by submitted_at desc;
