type PageLoadingProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function PageLoading({ eyebrow, title, description }: PageLoadingProps) {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-6xl flex-col gap-6 px-6 py-10 md:px-10 md:py-12">
      <section className="rounded-4xl border border-black/8 bg-white/78 p-8 shadow-[0_24px_90px_rgba(15,23,42,0.06)] backdrop-blur md:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/45">
          {eyebrow}
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-black md:text-5xl">
          {title}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-black/62">
          {description}
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="h-44 animate-pulse rounded-4xl border border-black/8 bg-white/62" />
        <div className="h-44 animate-pulse rounded-4xl border border-black/8 bg-white/62" />
      </section>
    </main>
  );
}