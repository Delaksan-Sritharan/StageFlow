type SessionDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function SessionDetailPage({
  params,
}: SessionDetailPageProps) {
  const { id } = await params;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-6 py-12 md:px-10">
      <div className="rounded-[2rem] border border-black/8 bg-white/80 p-8 shadow-[0_24px_90px_rgba(15,23,42,0.06)] backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/45">
          StageFlow / Session detail
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-black">
          Session {id}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-black/65">
          This placeholder route is ready for the upcoming session dashboard, speaker list, and feedback summary work.
        </p>
      </div>
    </main>
  );
}