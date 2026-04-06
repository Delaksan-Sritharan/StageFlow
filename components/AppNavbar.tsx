import Link from "next/link";
import Image from "next/image";
import { cookies } from "next/headers";

import { logout } from "@/app/auth/actions";
import { isSupabaseConfigured } from "@/utils/supabase/config";
import { createClient } from "@/utils/supabase/server";

const navLinks = [
  { href: "/", label: "Sessions" },
  { href: "/timer", label: "Timer" },
  { href: "/session/create", label: "Create Session" },
];

export async function AppNavbar() {
  let user: {
    email?: string;
    user_metadata?: { display_name?: string };
  } | null = null;

  if (isSupabaseConfigured()) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    user = authUser;
  }

  const displayName =
    user?.user_metadata?.display_name ||
    user?.email?.split("@")[0] ||
    "Account";

  return (
    <header className="sticky top-0 z-40 border-b border-black/8 bg-white/72 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between md:px-8">
        <div>
          <Link href="/" className="inline-flex items-center gap-3 text-black">
            <Image
              src="/stageflow-logo.svg"
              alt="StageFlow logo"
              width={128}
              height={128}
              className="h-10 w-auto shrink-0"
              priority
            />
            <span className="flex min-w-0 flex-col">
              <span className="text-lg font-semibold tracking-[-0.04em] text-black">
                StageFlow
              </span>
              <span className="text-xs uppercase tracking-[0.24em] text-black/45">
                Speaker sessions and timing
              </span>
            </span>
          </Link>
        </div>

        <nav className="flex flex-wrap items-center gap-2">
          {user
            ? navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="inline-flex items-center justify-center rounded-full border border-black/10 bg-white/72 px-4 py-2 text-sm font-semibold text-black transition-colors duration-200 hover:bg-black/3"
                >
                  {link.label}
                </Link>
              ))
            : null}

          {user ? (
            <>
              <span className="inline-flex items-center justify-center rounded-full border border-black/10 bg-black/3 px-4 py-2 text-sm font-semibold text-black">
                {displayName}
              </span>
              <form action={logout}>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-full border border-black/10 bg-white/72 px-4 py-2 text-sm font-semibold text-black transition-colors duration-200 hover:bg-black/3"
                >
                  Logout
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-full border border-black/10 bg-white/72 px-4 py-2 text-sm font-semibold text-black transition-colors duration-200 hover:bg-black/3"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-full bg-black px-4 py-2 text-sm font-semibold text-white transition-colors duration-200"
              >
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
