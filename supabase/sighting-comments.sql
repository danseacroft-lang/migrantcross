-- Sighting comments: the table behind the Report Channel Crossing card (the eye button) on the homepage.
-- Paste this whole file into Supabase → SQL Editor → New query, and press Run. It is safe to run again.
--
-- What visitors can do with the public key (it is meant to be public, like the Web3Forms key):
--   * read every comment's id, time, text and X username
--   * add a comment (text, and an X username if they want one); nothing else
-- They can't edit or delete anything, and can't see the hashed address used for the limits below.
--
-- Spam and abuse limits, checked by the database itself so they can't be skipped:
--   * 3 to 500 characters, no links, no repeats of a comment already posted today
--   * from one connection: 3 comments in 10 minutes and 10 a day
--   * from everyone together: 60 an hour, so a flood can't bury the box
-- The address is kept only as a one-way hash mixed with the day, so it can't be read back or followed from one day to the next.
--
-- To remove a comment: Supabase → Table Editor → sighting_comments, tick its row and delete it. It disappears from the site at once.

create table if not exists public.sighting_comments (
  id         bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  body       text not null,
  sender     text
);
-- the optional "X username" box: stored without the @, letters, numbers and _ only, up to 15 characters (X's own rules)
alter table public.sighting_comments add column if not exists x_user text;
alter table public.sighting_comments drop constraint if exists sighting_comments_x_user;
alter table public.sighting_comments add constraint sighting_comments_x_user check (x_user ~ '^[A-Za-z0-9_]{1,15}$');
create index if not exists sighting_comments_created on public.sighting_comments (created_at desc);
create index if not exists sighting_comments_sender on public.sighting_comments (sender, created_at);

alter table public.sighting_comments enable row level security;

-- column by column: the public can read id, time and text, and write the text only
revoke all on public.sighting_comments from anon, authenticated;
grant select (id, created_at, body, x_user) on public.sighting_comments to anon, authenticated;
grant insert (body, x_user) on public.sighting_comments to anon, authenticated;

drop policy if exists "anyone can read comments" on public.sighting_comments;
create policy "anyone can read comments" on public.sighting_comments for select to anon, authenticated using (true);
drop policy if exists "anyone can add a comment" on public.sighting_comments;
create policy "anyone can add a comment" on public.sighting_comments for insert to anon, authenticated with check (true);

create or replace function public.sighting_comment_check() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  ip text := coalesce(nullif(split_part(coalesce(current_setting('request.headers', true)::json ->> 'x-forwarded-for', ''), ',', 1), ''), 'unknown');
begin
  new.body := btrim(regexp_replace(new.body, '\s+', ' ', 'g'));   -- one line, no runs of spaces
  new.created_at := now();                                        -- the time is always the server's
  new.x_user := nullif(ltrim(btrim(coalesce(new.x_user, '')), '@'), '');   -- "@name" and "name" are the same; blank means none
  new.sender := encode(sha256(convert_to(btrim(ip) || '|' || current_date::text, 'UTF8')), 'hex');

  if char_length(new.body) < 3 then raise exception 'Write a little more first.'; end if;
  if char_length(new.body) > 500 then raise exception 'Keep it under 500 characters.'; end if;
  if new.x_user is not null and new.x_user !~ '^[A-Za-z0-9_]{1,15}$' then
    raise exception 'X usernames are letters, numbers and _ only, up to 15 characters.';
  end if;
  if new.body ~* '(https?://|www\.|\m[a-z0-9-]+\.(com|net|org|ru|io|co|xyz|info|top|uk)\M)' then
    raise exception 'Links can''t be posted.';
  end if;
  if exists (select 1 from sighting_comments where lower(body) = lower(new.body) and created_at > now() - interval '1 day') then
    raise exception 'That comment is already here.';
  end if;
  if (select count(*) from sighting_comments where sender = new.sender and created_at > now() - interval '10 minutes') >= 3
     or (select count(*) from sighting_comments where sender = new.sender and created_at > now() - interval '1 day') >= 10 then
    raise exception 'You''ve posted a few already. Please try again later.';
  end if;
  if (select count(*) from sighting_comments where created_at > now() - interval '1 hour') >= 60 then
    raise exception 'Lots of comments are coming in. Please try again later.';
  end if;
  return new;
end $$;
revoke all on function public.sighting_comment_check() from public, anon, authenticated;

drop trigger if exists sighting_comment_check on public.sighting_comments;
create trigger sighting_comment_check before insert on public.sighting_comments
  for each row execute function public.sighting_comment_check();
