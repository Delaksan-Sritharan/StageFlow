import { PageLoading } from "@/components/PageLoading";

export default function Loading() {
  return (
    <PageLoading
      eyebrow="StageFlow"
      title="Loading workspace"
      description="Pulling the latest session and speaker data from Supabase."
    />
  );
}