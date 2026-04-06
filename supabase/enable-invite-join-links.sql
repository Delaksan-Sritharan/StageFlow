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
grant execute on function public.accept_session_invitation(uuid, text) to authenticated;