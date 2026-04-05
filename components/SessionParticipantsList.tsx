import type { SessionParticipant } from "@/types";

type SessionParticipantsListProps = {
  participants: SessionParticipant[];
  creatorId: string | null;
};

function getParticipantLabel(
  participant: SessionParticipant,
  creatorId: string | null,
) {
  if (participant.userId && participant.userId === creatorId) {
    return "Session creator";
  }

  if (participant.invitedEmail) {
    return participant.invitedEmail;
  }

  if (participant.userId) {
    return `Participant ${participant.userId.slice(0, 8)}`;
  }

  return "Accepted participant";
}

function getParticipantRole(
  participant: SessionParticipant,
  creatorId: string | null,
) {
  if (participant.userId && participant.userId === creatorId) {
    return "Creator";
  }

  return participant.role ?? "Participant";
}

export function SessionParticipantsList({
  participants,
  creatorId,
}: SessionParticipantsListProps) {
  if (participants.length === 0) {
    return (
      <p className="rounded-3xl border border-black/8 bg-white/80 px-4 py-3 text-sm text-black/62">
        No accepted participants yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {participants.map((participant) => (
        <article
          key={participant.id}
          className="rounded-3xl border border-black/8 bg-white/84 p-4"
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm font-semibold text-black">
                {getParticipantLabel(participant, creatorId)}
              </p>
              <p className="mt-1 text-sm text-black/58">
                {getParticipantRole(participant, creatorId)}
              </p>
            </div>

            <div className="rounded-full border border-black/8 bg-black/2 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-black/58">
              {participant.accepted ? "Accepted" : "Pending"}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
