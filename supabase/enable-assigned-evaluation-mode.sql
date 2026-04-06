-- Run this on an existing StageFlow database to enable assigned evaluation mode
-- without reapplying the larger catch-all repair script.

alter table if exists public.sessions
add column if not exists evaluation_mode text not null default 'open';

update public.sessions
set evaluation_mode = 'open'
where evaluation_mode is null;

alter table if exists public.sessions
drop constraint if exists sessions_evaluation_mode_check;

alter table if exists public.sessions
add constraint sessions_evaluation_mode_check
check (evaluation_mode in ('open', 'assigned'));

alter table if exists public.speakers
add column if not exists assigned_evaluator_participant_id bigint references public.session_participants(id) on delete set null;

create index if not exists speakers_assigned_evaluator_participant_id_idx
on public.speakers (assigned_evaluator_participant_id);

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
  and (
    public.speakers.assigned_evaluator_participant_id is null
    or exists (
      select 1
      from public.session_participants
      where public.session_participants.id = public.speakers.assigned_evaluator_participant_id
        and public.session_participants.session_id = public.speakers.session_id
        and coalesce(public.session_participants.accepted, true) = true
        and public.session_participants.role = 'Evaluator'
    )
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
  and exists (
    select 1
    from public.speakers
    join public.sessions on public.sessions.id = public.speakers.session_id
    join public.session_participants
      on public.session_participants.id = public.feedback.session_participant_id
    where public.speakers.id = public.feedback.speaker_id
      and public.speakers.session_participant_id = public.feedback.session_participant_id
      and public.session_participants.session_id = public.speakers.session_id
      and (
        (
          public.sessions.evaluation_mode = 'open'
          and public.can_access_session(public.speakers.session_id)
        )
        or (
          public.sessions.evaluation_mode = 'assigned'
          and public.speakers.assigned_evaluator_participant_id is not null
          and exists (
            select 1
            from public.session_participants as assigned_evaluator
            where assigned_evaluator.id = public.speakers.assigned_evaluator_participant_id
              and assigned_evaluator.user_id = auth.uid()
              and assigned_evaluator.role = 'Evaluator'
              and coalesce(assigned_evaluator.accepted, true) = true
          )
        )
      )
  )
);