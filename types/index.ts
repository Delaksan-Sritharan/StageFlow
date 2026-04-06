export type SpeakerRole = "Speaker" | "Evaluator";

export type Session = {
  id: string;
  creatorId?: string | null;
  title: string;
  date: string;
};

export type SessionParticipant = {
  id: string;
  sessionId: string;
  userId: string | null;
  invitedEmail: string | null;
  role: SpeakerRole | null;
  accepted: boolean;
  inviteToken: string | null;
};

export type Speaker = {
  id: string;
  sessionId: string;
  sessionParticipantId: string | null;
  name: string;
  role: SpeakerRole;
  minTime: number;
  maxTime: number;
};

export type Feedback = {
  id: string;
  speakerId: string;
  sessionParticipantId: string | null;
  userId: string | null;
  contentScore: number;
  deliveryScore: number;
  confidenceScore: number;
  comment: string | null;
  createdAt?: string;
};