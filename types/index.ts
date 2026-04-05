export type SpeakerRole = "Speaker" | "Evaluator" | "Table Topics";

export type Session = {
  id: string;
  title: string;
  date: string;
};

export type Speaker = {
  id: string;
  sessionId: string;
  name: string;
  role: SpeakerRole;
  minTime: number;
  maxTime: number;
};

export type Feedback = {
  id: string;
  speakerId: string;
  contentScore: number;
  deliveryScore: number;
  confidenceScore: number;
  comment: string | null;
  createdAt?: string;
};