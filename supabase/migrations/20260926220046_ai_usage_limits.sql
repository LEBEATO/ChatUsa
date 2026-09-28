-- Run only in the CHAT USA Supabase project. No conversations are stored here.
begin;
create schema if not exists chat_usa_private;
revoke all on schema chat_usa_private from public, anon;
grant usage on schema chat_usa_private to authenticated;

create table chat_usa_private.ai_usage (
  user_id uuid primary key references auth.users(id) on delete cascade,
  minute_start timestamptz not null,
  minute_count integer not null default 0 check (minute_count >= 0),
  day_start date not null,
  day_count integer not null default 0 check (day_count >= 0)
);
alter table chat_usa_private.ai_usage enable row level security;
revoke all on chat_usa_private.ai_usage from public, anon, authenticated;

-- A privileged function is necessary only for counters. The caller's verified
-- JWT determines the user; no supplied user ID, quota or timestamp is accepted.
create function chat_usa_private.consume_ai_quota()
returns boolean language plpgsql security definer set search_path = '' as $$
declare
  caller uuid := auth.uid();
  now_minute timestamptz := date_trunc('minute', statement_timestamp());
  today date := (statement_timestamp() at time zone 'UTC')::date;
  usage chat_usa_private.ai_usage%rowtype;
  minute_used integer;
  day_used integer;
begin
  if caller is null or coalesce((auth.jwt()->>'is_anonymous')::boolean, false) then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  insert into chat_usa_private.ai_usage(user_id, minute_start, day_start)
    values (caller, now_minute, today) on conflict (user_id) do nothing;
  select * into usage from chat_usa_private.ai_usage where user_id = caller for update;
  minute_used := case when usage.minute_start = now_minute then usage.minute_count else 0 end;
  day_used := case when usage.day_start = today then usage.day_count else 0 end;
  if minute_used >= 20 or day_used >= 100 then return false; end if;
  update chat_usa_private.ai_usage set minute_start = now_minute,
    minute_count = minute_used + 1, day_start = today, day_count = day_used + 1
    where user_id = caller;
  return true;
end;
$$;
revoke all on function chat_usa_private.consume_ai_quota() from public, anon;
grant execute on function chat_usa_private.consume_ai_quota() to authenticated;

-- Public RPC wrapper runs as the caller. Privileged code stays outside public.
create function public.consume_ai_quota()
returns boolean language sql security invoker set search_path = '' as $$
  select chat_usa_private.consume_ai_quota();
$$;
revoke all on function public.consume_ai_quota() from public, anon;
grant execute on function public.consume_ai_quota() to authenticated;
commit;
