-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create projets table
create table projets (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  nom text not null,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create decisions table
create table decisions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  titre text not null,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create actions table
create table actions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  titre text not null,
  description text,
  priorite integer default 1 not null check (priorite >= 1 and priorite <= 10),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create priorities table (top 3 priorities)
create table priorities (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  action_id uuid references actions(id) on delete cascade not null,
  rank integer not null check (rank >= 1 and rank <= 3),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, rank)
);

-- Enable Row Level Security
alter table projets enable row level security;
alter table decisions enable row level security;
alter table actions enable row level security;
alter table priorities enable row level security;

-- Create policies for projets
create policy "Users can view their own projets"
  on projets for select
  using (auth.uid() = user_id);

create policy "Users can insert their own projets"
  on projets for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own projets"
  on projets for update
  using (auth.uid() = user_id);

create policy "Users can delete their own projets"
  on projets for delete
  using (auth.uid() = user_id);

-- Create policies for decisions
create policy "Users can view their own decisions"
  on decisions for select
  using (auth.uid() = user_id);

create policy "Users can insert their own decisions"
  on decisions for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own decisions"
  on decisions for update
  using (auth.uid() = user_id);

create policy "Users can delete their own decisions"
  on decisions for delete
  using (auth.uid() = user_id);

-- Create policies for actions
create policy "Users can view their own actions"
  on actions for select
  using (auth.uid() = user_id);

create policy "Users can insert their own actions"
  on actions for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own actions"
  on actions for update
  using (auth.uid() = user_id);

create policy "Users can delete their own actions"
  on actions for delete
  using (auth.uid() = user_id);

-- Create policies for priorities
create policy "Users can view their own priorities"
  on priorities for select
  using (auth.uid() = user_id);

create policy "Users can insert their own priorities"
  on priorities for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own priorities"
  on priorities for update
  using (auth.uid() = user_id);

create policy "Users can delete their own priorities"
  on priorities for delete
  using (auth.uid() = user_id);

