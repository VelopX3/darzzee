-- DARZZEE: storage for features that previously only showed a success toast
-- without saving anything (tailor applications, newsletter sign-ups,
-- alteration photos, tailor portfolio uploads).
--
-- NOT APPLIED AUTOMATICALLY. Review, then run it in the Supabase SQL editor
-- (or `supabase db push`). It only CREATES new objects; it does not modify
-- the existing `profiles` or `bookings` tables.

-- ---------------------------------------------------------------------------
-- Admin helper (mirrors isAdminUser() in src/lib/auth-utils.js).
-- app_metadata can only be set server-side, so it is safe to trust.
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    or lower(auth.jwt() ->> 'email') = 'admin@darzzee.com',
    false
  );
$$;

-- ---------------------------------------------------------------------------
-- Tailor applications (Join as Tailor form)
-- ---------------------------------------------------------------------------
create table if not exists public.tailor_applications (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users (id) on delete cascade default auth.uid(),
  full_name        text not null check (char_length(full_name) between 2 and 80),
  email            text not null check (char_length(email) <= 254 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]{2,}$'),
  phone            text not null check (phone ~ '^[0-9]{10,15}$'),
  city             text not null check (char_length(city) between 2 and 60),
  experience_years integer not null check (experience_years between 0 and 70),
  portfolio_url    text check (portfolio_url is null or (char_length(portfolio_url) <= 300 and portfolio_url ~* '^https?://')),
  specialties      text not null check (char_length(specialties) between 10 and 1000),
  attachment_path  text check (attachment_path is null or char_length(attachment_path) <= 200),
  status           text not null default 'new' check (status in ('new', 'reviewing', 'approved', 'rejected')),
  created_at       timestamptz not null default now()
);

create index if not exists tailor_applications_user_id_idx on public.tailor_applications (user_id);

alter table public.tailor_applications enable row level security;

drop policy if exists "applicants insert their own application" on public.tailor_applications;
create policy "applicants insert their own application"
  on public.tailor_applications for insert to authenticated
  with check (user_id = (select auth.uid()) and status = 'new');

drop policy if exists "applicants read their own applications" on public.tailor_applications;
create policy "applicants read their own applications"
  on public.tailor_applications for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists "admins update applications" on public.tailor_applications;
create policy "admins update applications"
  on public.tailor_applications for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- Newsletter ("Notify me" in the footer). Insert-only for visitors.
-- ---------------------------------------------------------------------------
create table if not exists public.newsletter_subscribers (
  id         uuid primary key default gen_random_uuid(),
  email      text not null check (char_length(email) <= 254 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]{2,}$'),
  created_at timestamptz not null default now()
);

create unique index if not exists newsletter_subscribers_email_key on public.newsletter_subscribers (lower(email));

alter table public.newsletter_subscribers enable row level security;

drop policy if exists "anyone can subscribe" on public.newsletter_subscribers;
create policy "anyone can subscribe"
  on public.newsletter_subscribers for insert to anon, authenticated
  with check (true);

drop policy if exists "admins read subscribers" on public.newsletter_subscribers;
create policy "admins read subscribers"
  on public.newsletter_subscribers for select to authenticated
  using ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- Private upload buckets. Size and MIME limits are enforced by Storage
-- itself; files live under "<user id>/<random uuid>.<ext>".
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('alteration-photos', 'alteration-photos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('tailor-portfolios', 'tailor-portfolios', false, 26214400, array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "users upload into their own folder" on storage.objects;
create policy "users upload into their own folder"
  on storage.objects for insert to authenticated
  with check (
    bucket_id in ('alteration-photos', 'tailor-portfolios')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "users read own uploads, admins read all" on storage.objects;
create policy "users read own uploads, admins read all"
  on storage.objects for select to authenticated
  using (
    bucket_id in ('alteration-photos', 'tailor-portfolios')
    and ((storage.foldername(name))[1] = (select auth.uid())::text or (select public.is_admin()))
  );
