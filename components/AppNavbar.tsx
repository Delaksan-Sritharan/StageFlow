import Link from "next/link";

const navLinks = [
  { href: "/", label: "Sessions" },
  { href: "/timer", label: "Timer" },
  { href: "/session/create", label: "Create Session" },
];

export function AppNavbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-black/8 bg-white/72 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between md:px-8">
        <div className="space-y-1">
          <Link
            href="/"
            className="text-lg font-semibold tracking-[-0.04em] text-black"
          >
            StageFlow
          </Link>
          <p className="text-xs uppercase tracking-[0.24em] text-black/45">
            Speaker sessions and timing
          </p>
        </div>

        <nav className="flex flex-wrap items-center gap-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="inline-flex items-center justify-center rounded-full border border-black/10 bg-white/72 px-4 py-2 text-sm font-semibold text-black transition-colors duration-200 hover:bg-black/3"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}