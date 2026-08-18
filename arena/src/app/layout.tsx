import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import NavBar from "@/components/NavBar";

export const metadata: Metadata = {
  title: "প্রশ্নব্যাংক ও প্রশ্নপত্র জেনারেটর",
  description: "ক্লাস, বিষয়, অধ্যায় অনুযায়ী প্রশ্নব্যাংক তৈরি ও অটো-ফরম্যাট করা প্রশ্নপত্র জেনারেট করার টুল।",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="bn">
      <body className="bg-slate-100 text-slate-900 antialiased">
        <NavBar />
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</div>
      </body>
    </html>
  );
}
