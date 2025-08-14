-- 基本辞書
create table if not exists scenes (
  id text primary key,
  name text not null
);

create table if not exists theories (
  id text primary key,
  name_ja text not null,
  name_en text not null,
  domain text not null,
  one_liner text not null,
  mechanism text,
  when_to_use jsonb default '[]',
  how_to jsonb default '[]',
  dos jsonb default '[]',
  donts jsonb default '[]',
  pitfalls jsonb default '[]',
  templates jsonb default '{}'::jsonb,
  examples jsonb default '[]',
  tags text[] default '{}'
);

create table if not exists mapping_rules (
  id uuid primary key default gen_random_uuid(),
  scene_id text references scenes(id) on delete cascade,
  weights jsonb not null,          -- e.g. {"time_limit.short":0.3,"goal.decide":0.3}
  theory_scores jsonb not null     -- e.g. {"anchoring":{"time_limit.short":0.4,"goal.decide":0.3}}
);

-- 実行ログ
create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  scene_id text,
  goal text,
  participants int,
  relationship text,
  time_limit text,
  stakes text,
  created_at timestamptz default now()
);

create table if not exists session_advices (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade,
  theory_id text references theories(id),
  short_advice text,
  selected_rank int
);

create table if not exists feedbacks (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade,
  result text check (result in ('success','partial','fail')),
  comment text,
  executed_theory_ids text[],
  created_at timestamptz default now()
);