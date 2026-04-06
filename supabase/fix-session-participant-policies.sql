create extension if not exists pgcrypto;

alter table if exists public.sessions
add column if not exists user_id uuid references public.users(id) on delete cascade;

alter table if exists public.sessions
add column if not exists creator_id uuid references public.users(id) on delete cascade;

update public.sessions
set creator_id = coalesce(creator_id, user_id)
where creator_id is null
  and user_id is not null;

alter table if exists public.session_participants
alter column user_id drop not null;

alter table if exists public.session_participants
add column if not exists invited_email text;

alter table if exists public.session_participants
add column if not exists role text;

alter table if exists public.session_participants
add column if not exists accepted boolean default true;

alter table if exists public.session_participants
add column if not exists invite_token uuid default gen_random_uuid();

alter table if exists public.speakers
add column if not exists session_participant_id bigint references public.session_participants(id) on delete set null;

alter table if exists public.feedback
add column if not exists session_participant_id bigint references public.session_participants(id) on delete set null;

alter table if exists public.feedback
add column if not exists user_id uuid references public.users(id) on delete set null;

update public.session_participants
set accepted = true
where accepted is null;

update public.session_participants
set invite_token = gen_random_uuid()
where invite_token is null;

update public.feedback
set session_participant_id = public.speakers.session_participant_id
from public.speakers
where public.speakers.id = public.feedback.speaker_id
  and public.feedback.session_participant_id is null;

alter table if exists public.session_participants
alter column accepted set default true;

alter table if exists public.session_participants
alter column invite_token set default gen_random_uuid();

alter table if exists public.session_participants
drop constraint if exists session_participants_role_check;

alter table if exists public.speakers
drop constraint if exists speakers_role_check;

update public.session_participants
set role = 'Speaker'
where role = 'Table Topics';

update public.speakers
set role = 'Speaker'
where role = 'Table Topics';

alter table if exists public.session_participants
add constraint session_participants_role_check
check (role is null or role in ('Speaker', 'Evaluator'));

alter table if exists public.speakers
add constraint speakers_role_check
check (role in ('Speaker', 'Evaluator'));

insert into public.session_participants (session_id, user_id)
select public.sessions.id, coalesce(public.sessions.creator_id, public.sessions.user_id)
from public.sessions
where coalesce(public.sessions.creator_id, public.sessions.user_id) is not null
on conflict (session_id, user_id) do nothing;

create unique index if not exists session_participants_invited_email_idx
on public.session_participants (session_id, invited_email)
where invited_email is not null;

create unique index if not exists session_participants_invite_token_idx
on public.session_participants (invite_token);

create index if not exists speakers_session_participant_id_idx
on public.speakers (session_participant_id);

create index if not exists feedback_session_participant_id_idx
on public.feedback (session_participant_id);

create index if not exists feedback_user_id_idx
on public.feedback (user_id);

create or replace function public.is_session_creator(
  target_session_id bigint,
  target_user_id uuid default auth.uid()
)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.sessions
    where public.sessions.id = target_session_id
      and coalesce(public.sessions.creator_id, public.sessions.user_id) = target_user_id
  );
$$;

create or replace function public.is_session_participant(
  target_session_id bigint,
  target_user_id uuid default auth.uid()
)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.session_participants
    where public.session_participants.session_id = target_session_id
      and public.session_participants.user_id = target_user_id
      and coalesce(public.session_participants.accepted, true) = true
  );
$$;

create or replace function public.can_access_session(
  target_session_id bigint,
  target_user_id uuid default auth.uid()
)
returns boolean
language sql
security definer
set search_path = public
as $$
  select public.is_session_creator(target_session_id, target_user_id)
      or public.is_session_participant(target_session_id, target_user_id);
$$;

create or replace function public.get_session_invitation(
  target_invite_token uuid
)
returns table (
  participant_id bigint,
  session_id bigint,
  session_title text,
  session_date date,
  invited_email text,
  assigned_role text,
  accepted boolean,
  participant_user_id uuid
)
language sql
security definer
set search_path = public
as $$
  select
    public.session_participants.id,
    public.session_participants.session_id,
    public.sessions.title,
    public.sessions.date,
    public.session_participants.invited_email,
    public.session_participants.role,
    coalesce(public.session_participants.accepted, true),
    public.session_participants.user_id
  from public.session_participants
  join public.sessions on public.sessions.id = public.session_participants.session_id
  where public.session_participants.invite_token = target_invite_token
  limit 1;
$$;

create or replace function public.get_my_pending_invitations()
returns table (
  participant_id bigint,
  session_id bigint,
  session_title text,
  session_date date,
  assigned_role text,
  invite_token uuid,
  invited_email text
)
language sql
security definer
set search_path = public
as $$
  select
    public.session_participants.id,
    public.session_participants.session_id,
    public.sessions.title,
    public.sessions.date,
    public.session_participants.role,
    public.session_participants.invite_token,
    public.session_participants.invited_email
  from public.session_participants
  join public.sessions on public.sessions.id = public.session_participants.session_id
  left join public.users on public.users.id = auth.uid()
  where coalesce(public.session_participants.accepted, false) = false
    and (
      public.session_participants.user_id = auth.uid()
      or (
        public.session_participants.invited_email is not null
        and lower(public.session_participants.invited_email) = lower(
          coalesce(public.users.email, auth.jwt() ->> 'email', '')
        )
      )
    )
  order by public.sessions.date asc, public.session_participants.created_at asc;
$$;

create or replace function public.accept_session_invitation(
  target_invite_token uuid,
  selected_role text default null
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  invitation record;
  current_user_id uuid := auth.uid();
  current_user_email text;
  normalized_role text := nullif(trim(selected_role), '');
begin
  if current_user_id is null then
    raise exception 'You must be logged in to accept this invitation.';
  end if;

  current_user_email := lower(
    coalesce(
      (select public.users.email from public.users where public.users.id = current_user_id),
      auth.jwt() ->> 'email'
    )
  );

  select
    public.session_participants.id,
    public.session_participants.session_id,
    public.session_participants.user_id,
    public.session_participants.invited_email,
    public.session_participants.role,
    coalesce(public.session_participants.accepted, true) as accepted
  into invitation
  from public.session_participants
  where public.session_participants.invite_token = target_invite_token;

  if not found then
    raise exception 'This invitation link is invalid or has expired.';
  end if;

  if invitation.user_id is not null and invitation.user_id <> current_user_id then
    raise exception 'This invitation has already been claimed by another participant.';
  end if;

  if invitation.invited_email is not null then
    if current_user_email is null then
      raise exception 'We could not verify your account email for this invitation.';
    end if;

    if lower(invitation.invited_email) <> current_user_email and invitation.user_id is distinct from current_user_id then
      raise exception 'This invitation is reserved for a different email address.';
    end if;
  end if;

  if normalized_role is null then
    normalized_role := invitation.role;
  end if;

  if normalized_role is null then
    raise exception 'Choose a role before joining this session.';
  end if;

  if normalized_role not in ('Speaker', 'Evaluator') then
    raise exception 'Choose a valid role before joining this session.';
  end if;

  update public.session_participants
  set
    user_id = current_user_id,
    invited_email = coalesce(public.session_participants.invited_email, current_user_email),
    role = normalized_role,
    accepted = true
  where public.session_participants.id = invitation.id;

  return invitation.session_id;
end;
$$;

grant execute on function public.get_session_invitation(uuid) to anon, authenticated;
grant execute on function public.get_my_pending_invitations() to authenticated;
grant execute on function public.accept_session_invitation(uuid, text) to authenticated;

do $$
declare
  policy_record record;
begin
  for policy_record in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'users',
        'sessions',
        'session_participants',
        'speakers',
        'feedback'
      )
  loop
    execute format(
      'drop policy if exists %I on %I.%I',
      policy_record.policyname,
      policy_record.schemaname,
      policy_record.tablename
    );
  end loop;
end
$$;

drop policy if exists "Users can read related sessions" on public.sessions;
create policy "Users can read related sessions"
on public.sessions
for select
to authenticated
using (public.can_access_session(public.sessions.id));

drop policy if exists "Users can insert own sessions" on public.sessions;
create policy "Users can insert own sessions"
on public.sessions
for insert
to authenticated
with check (coalesce(creator_id, user_id) = auth.uid());

drop policy if exists "Users can update own sessions" on public.sessions;
create policy "Users can update own sessions"
on public.sessions
for update
to authenticated
using (public.is_session_creator(public.sessions.id))
with check (public.is_session_creator(public.sessions.id));

drop policy if exists "Users can delete own sessions" on public.sessions;
create policy "Users can delete own sessions"
on public.sessions
for delete
to authenticated
using (public.is_session_creator(public.sessions.id));

drop policy if exists "Users can read related session participants" on public.session_participants;
create policy "Users can read related session participants"
on public.session_participants
for select
to authenticated
using (
  auth.uid() = user_id
  or public.is_session_creator(public.session_participants.session_id)
  or public.is_session_participant(public.session_participants.session_id)
);

drop policy if exists "Creators can insert invitations" on public.session_participants;
create policy "Creators can insert invitations"
on public.session_participants
for insert
to authenticated
with check (public.is_session_creator(public.session_participants.session_id));

drop policy if exists "Users can delete related session participants" on public.session_participants;
create policy "Users can delete related session participants"
on public.session_participants
for delete
to authenticated
using (
  auth.uid() = user_id
  or public.is_session_creator(public.session_participants.session_id)
);

drop policy if exists "Users can read related speakers" on public.speakers;
create policy "Users can read related speakers"
on public.speakers
for select
to authenticated
using (
  exists (
    select 1
    from public.sessions
    where public.sessions.id = public.speakers.session_id
      and public.can_access_session(public.sessions.id)
  )
);

drop policy if exists "Users can insert own speakers" on public.speakers;
create policy "Users can insert own speakers"
on public.speakers
for insert
to authenticated
with check (
  public.is_session_creator(public.speakers.session_id)
  and exists (
    select 1
    from public.session_participants
    where public.session_participants.id = public.speakers.session_participant_id
      and public.session_participants.session_id = public.speakers.session_id
      and coalesce(public.session_participants.accepted, true) = true
  )
);

drop policy if exists "Users can update own speakers" on public.speakers;
create policy "Users can update own speakers"
on public.speakers
for update
to authenticated
using (public.is_session_creator(public.speakers.session_id))
with check (public.is_session_creator(public.speakers.session_id));

drop policy if exists "Users can delete own speakers" on public.speakers;
create policy "Users can delete own speakers"
on public.speakers
for delete
to authenticated
using (public.is_session_creator(public.speakers.session_id));

drop policy if exists "Users can read related feedback" on public.feedback;
create policy "Users can read related feedback"
on public.feedback
for select
to authenticated
using (
  exists (
    select 1
    from public.speakers
    where public.speakers.id = public.feedback.speaker_id
      and public.can_access_session(public.speakers.session_id)
  )
);

drop policy if exists "Users can insert own feedback" on public.feedback;
create policy "Users can insert own feedback"
on public.feedback
for insert
to authenticated
with check (
  public.feedback.user_id = auth.uid()
  and exists (
    select 1
    from public.session_participants
    where public.session_participants.id = public.feedback.session_participant_id
      and coalesce(public.session_participants.accepted, true) = true
  )
  and
  exists (
    select 1
    from public.speakers
    join public.session_participants
      on public.session_participants.id = public.feedback.session_participant_id
    where public.speakers.id = public.feedback.speaker_id
      and public.speakers.session_participant_id = public.feedback.session_participant_id
      and public.session_participants.session_id = public.speakers.session_id
      and public.can_access_session(public.speakers.session_id)
  )
);

drop policy if exists "Users can update own feedback" on public.feedback;
create policy "Users can update own feedback"
on public.feedback
for update
to authenticated
using (
  exists (
    select 1
    from public.speakers
    where public.speakers.id = public.feedback.speaker_id
      and public.is_session_creator(public.speakers.session_id)
  )
)
with check (
  exists (
    select 1
    from public.speakers
    where public.speakers.id = public.feedback.speaker_id
      and public.is_session_creator(public.speakers.session_id)
  )
);

drop policy if exists "Users can delete own feedback" on public.feedback;
create policy "Users can delete own feedback"
on public.feedback
for delete
to authenticated
using (
  exists (
    select 1
    from public.speakers
    where public.speakers.id = public.feedback.speaker_id
      and public.is_session_creator(public.speakers.session_id)
  )
);