-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- USERS TABLE (Extends Supabase Auth)
-- This table should be automatically populated via triggers on auth.users, but for this schema we define the structure.
create table public.users (
  id uuid references auth.users not null primary key,
  email text,
  full_name text,
  auth_provider text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, full_name, auth_provider)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_app_meta_data->>'provider');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to call the function on new user creation
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- INVOICES TABLE
create table public.invoices (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  image_url text not null, -- Path to the image in Supabase Storage
  store_name text,
  purchase_date date,
  qrcode_hash text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- PRODUCTS TABLE
create table public.products (
  id uuid default uuid_generate_v4() primary key,
  invoice_id uuid references public.invoices(id) on delete cascade not null,
  name text not null,
  warranty_months integer default 36,
  warranty_end_date date,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ROW LEVEL SECURITY (RLS)
alter table public.users enable row level security;
alter table public.invoices enable row level security;
alter table public.products enable row level security;

-- POLICIES

-- Users can only see their own profile
create policy "Users can view own profile"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.users for update
  using (auth.uid() = id);

-- Invoices policies
create policy "Users can view own invoices"
  on public.invoices for select
  using (auth.uid() = user_id);

create policy "Users can insert own invoices"
  on public.invoices for insert
  with check (auth.uid() = user_id);

create policy "Users can update own invoices"
  on public.invoices for update
  using (auth.uid() = user_id);

create policy "Users can delete own invoices"
  on public.invoices for delete
  using (auth.uid() = user_id);

-- Products policies (Access via Invoice ownership)
create policy "Users can view products of their invoices"
  on public.products for select
  using (
    exists (
      select 1 from public.invoices
      where public.invoices.id = public.products.invoice_id
      and public.invoices.user_id = auth.uid()
    )
  );

create policy "Users can insert products to their invoices"
  on public.products for insert
  with check (
    exists (
      select 1 from public.invoices
      where public.invoices.id = public.products.invoice_id
      and public.invoices.user_id = auth.uid()
    )
  );

create policy "Users can update products of their invoices"
  on public.products for update
  using (
    exists (
      select 1 from public.invoices
      where public.invoices.id = public.products.invoice_id
      and public.invoices.user_id = auth.uid()
    )
  );

create policy "Users can delete products of their invoices"
  on public.products for delete
  using (
    exists (
      select 1 from public.invoices
      where public.invoices.id = public.products.invoice_id
      and public.invoices.user_id = auth.uid()
    )
  );

-- STORAGE POLICIES (Assuming a bucket named 'invoices')
-- You would need to create the bucket in the dashboard
-- insert into storage.buckets (id, name) values ('invoices', 'invoices');

-- create policy "Users can upload invoice images"
-- on storage.objects for insert
-- with check ( bucket_id = 'invoices' and auth.uid()::text = (storage.foldername(name))[1] );

-- create policy "Users can view own invoice images"
-- on storage.objects for select
-- using ( bucket_id = 'invoices' and auth.uid()::text = (storage.foldername(name))[1] );
