-- Brands can also be reached by email (founders, 2026-11-19). Private like instagram/phone:
-- only creators who apply to the brand's listing see it (contact reveal, service role).
alter table public.brand_contacts
  add column email text,
  add constraint brand_contacts_email_len check (email is null or char_length(email) <= 254);
