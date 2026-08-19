"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "ড্যাশবোর্ড" },
  { href: "/manage", label: "ক্লাস/বিষয়/অধ্যায়" },
  { href: "/questions", label: "প্রশ্ন যোগ ও তালিকা" },
  { href: "/bank", label: "প্রশ্নব্যাংক (সব প্রশ্ন)" },
  { href: "/paper", label: "প্রশ্নপত্র তৈরি" },
  { href: "/settings", label: "স্কুল সেটিংস" },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <header className="no-print sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="text-lg font-extrabold text-emerald-700">
          📘 প্রশ্নব্যাংক জেনারেটর
        </Link>
        <nav className="flex flex-wrap gap-1">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`nav-link ${pathname === link.href ? "active" : ""}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
