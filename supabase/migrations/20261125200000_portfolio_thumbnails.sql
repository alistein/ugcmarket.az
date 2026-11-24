-- Portfolio covers: brands judge a creator faster with the Reel's cover than with a bare link.
-- Providers give a cover URL (Instagram CDN links expire within days), so the server copies the
-- image into our own public bucket and stores that URL. Written by the service role only.

alter table public.portfolio_item_stats add column if not exists thumbnail_url text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('portfolio-thumbs', 'portfolio-thumbs', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;
