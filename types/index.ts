export type SpeakerRole = "Speaker" | "Evaluator";

export type EvaluationMode = "open" | "assigned";

export type Session = {
  id: string;
  creatorId?: string | null;
  title: string;
  date: string;
  evaluationMode?: EvaluationMode;
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
  assignedEvaluatorParticipantId: string | null;
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