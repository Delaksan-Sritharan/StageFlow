import { cookies } from "next/headers";

import { createClient } from "@/utils/supabase/server";

export default async function Page() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: todos, error } = await supabase.from("todos").select();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 px-6 py-10 md:px-10 md:py-14">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/45">
          StageFlow / Supabase
        </p>
        <h1 className="text-4xl font-semibold tracking-[-0.05em] text-black md:text-5xl">
          Todos
        </h1>
      </header>

      {error ? (
        <p className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
          Failed to load todos: {error.message}
        </p>
      ) : (
        <ul className="space-y-3">
          {todos?.map((todo) => (
            <li
              key={todo.id}
              className="rounded-3xl border border-black/8 bg-white/80 px-5 py-4 shadow-[0_18px_60px_rgba(15,23,42,0.06)]"
            >
              {todo.name}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
