-- Create the study_sessions table
create table public.study_sessions (
    id uuid default gen_random_uuid() primary key,
    user_id uuid, -- Optional for now, ready for when we add authentication
    session_type text not null check (session_type in ('quiz', 'tutor')),
    start_page integer not null,
    end_page integer not null,
    language text not null,
    content jsonb not null, -- JSONB is Postgres's superpower for storing arrays/dicts
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Turn on Row Level Security (RLS) for future data protection
alter table public.study_sessions enable row level security;

-- Create a temporary bypass policy so our FastAPI backend can write freely 
-- (We will lock this down when we add real user login)
create policy "Allow all access to study_sessions" 
on public.study_sessions 
for all 
using (true) 
with check (true);