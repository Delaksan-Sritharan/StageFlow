alter table if exists public.session_participants
add column if not exists status text default 'pending';

update public.session_participants
set status = case
  when coalesce(public.session_participants.accepted, false) then 'accepted'
  else 'pending'
end
where public.session_participants.status is null;

alter table if exists public.session_participants
drop constraint if exists session_participants_status_check;

alter table if exists public.session_participants
add constraint session_participants_status_check
check (status in ('pending', 'accepted', 'rejected'));

drop function if exists public.get_session_invitation(uuid);

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
  status text,
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
    coalesce(public.session_participants.accepted, false),
    coalesce(
      public.session_participants.status,
      case when coalesce(public.session_participants.accepted, false) then 'accepted' else 'pending' end
    ),
    public.session_participants.user_id
  from public.session_participants
  join public.sessions on public.sessions.id = public.session_participants.session_id
  where public.session_participants.invite_token = target_invite_token
  limit 1;
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
    coalesce(public.session_participants.accepted, false) as accepted,
    coalesce(
      public.session_participants.status,
      case when coalesce(public.session_participants.accepted, false) then 'accepted' else 'pending' end
    ) as status
  into invitation
  from public.session_participants
  where public.session_participants.invite_token = target_invite_token;

  if not found then
    raise exception 'This invitation link is invalid or has expired.';
  end if;

  if invitation.user_id is not null and invitation.user_id <> current_user_id then
    raise exception 'This invitation has already been claimed by another participant.';
  end if;

  if invitation.status = 'rejected' then
    raise exception 'This invitation has already been rejected.';
  end if;

  if invitation.accepted and invitation.status = 'accepted' and invitation.user_id = current_user_id then
    return invitation.session_id;
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
    accepted = true,
    status = 'accepted'
  where public.session_participants.id = invitation.id;

  return invitation.session_id;
end;
$$;

create or replace function public.reject_session_invitation(
  target_invite_token uuid
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
begin
  if current_user_id is null then
    raise exception 'You must be logged in to reject this invitation.';
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
    coalesce(public.session_participants.accepted, false) as accepted,
    coalesce(
      public.session_participants.status,
      case when coalesce(public.session_participants.accepted, false) then 'accepted' else 'pending' end
    ) as status
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

  if invitation.status = 'accepted' or invitation.accepted then
    raise exception 'This invitation has already been accepted.';
  end if;

  if invitation.status = 'rejected' then
    return invitation.session_id;
  end if;

  update public.session_participants
  set
    invited_email = coalesce(public.session_participants.invited_email, current_user_email),
    accepted = false,
    status = 'rejected'
  where public.session_participants.id = invitation.id;

  return invitation.session_id;
end;
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
  where coalesce(
      public.session_participants.status,
      case when coalesce(public.session_participants.accepted, false) then 'accepted' else 'pending' end
    ) = 'pending'
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

grant execute on function public.get_session_invitation(uuid) to anon, authenticated;
grant execute on function public.get_my_pending_invitations() to authenticated;
grant execute on function public.accept_session_invitation(uuid, text) to authenticated;
grant execute on function public.reject_session_invitation(uuid) to authenticated;

drop policy if exists "Users can delete related session participants" on public.session_participants;
create policy "Users can delete related session participants"
on public.session_participants
for delete
to authenticated
using (
  public.is_session_creator(public.session_participants.session_id)
);