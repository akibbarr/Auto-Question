import Link from "next/link";

const CARDS = [
  {
    href: "/manage",
    title: "ক্লাস / বিষয় / অধ্যায়",
    desc: "প্রশ্নব্যাংকের কাঠামো তৈরি করুন — ক্লাস, বিষয়, অধ্যায় যোগ/এডিট/ডিলিট করুন।",
    icon: "🗂️",
  },
  {
    href: "/questions",
    title: "প্রশ্ন যোগ করুন",
    desc: "বহুনির্বাচনি, সংক্ষিপ্ত ও সৃজনশীল প্রশ্ন যোগ করুন — সৃজনশীল প্রশ্ন বাল্ক পেস্ট করে অটো-পার্স করুন।",
    icon: "✍️",
  },
  {
    href: "/bank",
    title: "প্রশ্নব্যাংক (সব প্রশ্ন)",
    desc: "আপনার তৈরি করা সব প্রশ্ন এক জায়গায় দেখুন — ক্লাস/বিষয়/অধ্যায় অনুযায়ী গ্রুপ করা, সার্চ ও ফিল্টার সহ।",
    icon: "📚",
  },
  {
    href: "/paper",
    title: "প্রশ্নপত্র তৈরি করুন",
    desc: "প্রশ্ন বাছাই করে ফরম্যাট করা প্রশ্নপত্র প্রিভিউ দেখুন, কাস্টমাইজ করুন ও .docx ডাউনলোড করুন।",
    icon: "📄",
  },
  {
    href: "/settings",
    title: "স্কুলের হেডার সেটিংস",
    desc: "স্কুলের নাম, ঠিকানা, লোগো একবার সেভ করুন — প্রতিটি নতুন প্রশ্নপত্রে অটো-লোড হবে।",
    icon: "🏫",
  },
];

export default function HomePage() {
  return (
    <main className="space-y-8">
      <section className="card p-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">প্রশ্নব্যাংক টুল</p>
        <h1 className="mt-2 text-3xl font-extrabold text-slate-900 sm:text-4xl">
          প্রশ্নব্যাংক তৈরি করুন, বাছাই করুন, অটো-ফরম্যাট করা প্রশ্নপত্র পান
        </h1>
        <p className="mt-3 max-w-2xl text-slate-600">
          ক্লাস → বিষয় → অধ্যায় → প্রশ্নের ধরন অনুযায়ী প্রশ্ন সংরক্ষণ করুন, পরে চেকবক্স দিয়ে বাছাই করে
          সুন্দর করে ফরম্যাট করা প্রশ্নপত্র প্রিভিউ দেখে সরাসরি Word (.docx) ফাইলে এক্সপোর্ট করুন — Kalpurush
          ফন্ট এমবেড করা অবস্থায়।
        </p>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CARDS.map((c) => (
          <Link key={c.href} href={c.href} className="card block p-6 transition hover:-translate-y-1 hover:shadow-lg">
            <div className="text-3xl">{c.icon}</div>
            <h2 className="mt-3 text-lg font-bold text-slate-900">{c.title}</h2>
            <p className="mt-1 text-sm text-slate-600">{c.desc}</p>
          </Link>
        ))}
      </section>
    </main>
  );
}
