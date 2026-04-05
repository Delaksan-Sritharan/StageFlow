import { PageLoading } from "@/components/PageLoading";

export default function Loading() {
  return (
    <PageLoading
      eyebrow="StageFlow / Session"
      title="Loading session"
      description="Fetching speakers, feedback, and session details."
    />
  );
}