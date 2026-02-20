import Link from "next/link";
import Image from "next/image";

export const metadata = {
    title: "About Us — Novadoc",
    description:
        "Learn about Novadoc's mission to make quality healthcare accessible to everyone through technology.",
};

const values = [
    {
        icon: (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
        ),
        title: "Patient First",
        description:
            "Every decision we make starts with a simple question: does this make the patient's life better?",
    },
    {
        icon: (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
        ),
        title: "Trusted & Secure",
        description:
            "Your health data is private. We use end-to-end encryption and strict access controls on every record.",
    },
    {
        icon: (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
        ),
        title: "Accessible to All",
        description:
            "Quality healthcare shouldn't depend on location or income. We're building for every corner of the country.",
    },
    {
        icon: (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
        ),
        title: "Technology-Driven",
        description:
            "From AI-assisted search to instant video consults, we use modern technology to eliminate friction in healthcare.",
    },
];

const stats = [
    { label: "Doctors on platform", value: "500+" },
    { label: "Appointments booked", value: "12,000+" },
    { label: "Cities covered", value: "30+" },
    { label: "Patient satisfaction", value: "4.8 / 5" },
];

const team = [
    {
        name: "Dr. Priya Sharma",
        role: "Chief Medical Officer",
        bio: "15 years in internal medicine. Passionate about preventive care and digital health equity.",
        avatar: "PS",
    },
    {
        name: "Arjun Mehta",
        role: "Chief Executive Officer",
        bio: "Serial entrepreneur with a background in health-tech. Previously scaled two health startups across South Asia.",
        avatar: "AM",
    },
    {
        name: "Sneha Rao",
        role: "Head of Engineering",
        bio: "Full-stack engineer focused on reliability and privacy-first system design.",
        avatar: "SR",
    },
    {
        name: "Dr. Ravi Kumar",
        role: "Head of Doctor Partnerships",
        bio: "Practicing physician turned healthcare advocate, building trust between doctors and technology.",
        avatar: "RK",
    },
];

export default function AboutPage() {
    return (
        <main className="min-h-screen bg-slate-50">
            {/* ── Hero ─────────────────────────────────────────────────────── */}
            <section className="bg-white border-b border-slate-100">
                <div className="mx-auto max-w-5xl px-5 md:px-8 py-16 md:py-24 flex flex-col md:flex-row items-center gap-10 md:gap-16">
                    <div className="flex-1 text-center md:text-left">
                        <span className="inline-block mb-4 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600 uppercase tracking-widest">
                            Our Story
                        </span>
                        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 leading-tight">
                            Healthcare made <br className="hidden md:block" />
                            <span className="text-blue-600">simple and human</span>
                        </h1>
                        <p className="mt-5 text-lg text-slate-600 max-w-xl">
                            Novadoc was founded with one belief: finding the right doctor
                            should be as easy as ordering a meal. We connect patients with
                            verified doctors, enable instant video consults, and put your
                            complete health record in your pocket.
                        </p>
                        <div className="mt-8 flex flex-wrap gap-3 justify-center md:justify-start">
                            <Link
                                href="/doctors"
                                className="rounded-full bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
                            >
                                Find a Doctor
                            </Link>
                            <Link
                                href="/blog"
                                className="rounded-full border border-slate-200 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                            >
                                Read health articles
                            </Link>
                        </div>
                    </div>

                    {/* Illustration placeholder — colourful gradient card */}
                    <div className="shrink-0 w-64 h-64 md:w-80 md:h-80 rounded-3xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-xl">
                        <svg className="h-28 w-28 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                    </div>
                </div>
            </section>

            {/* ── Stats ────────────────────────────────────────────────────── */}
            <section className="border-b border-slate-100 bg-white">
                <div className="mx-auto max-w-5xl px-5 md:px-8 py-10">
                    <dl className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                        {stats.map((s) => (
                            <div key={s.label} className="rounded-2xl bg-slate-50 ring-1 ring-slate-100 p-6">
                                <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">{s.label}</dt>
                                <dd className="mt-2 text-3xl font-bold text-blue-600">{s.value}</dd>
                            </div>
                        ))}
                    </dl>
                </div>
            </section>

            {/* ── Mission ──────────────────────────────────────────────────── */}
            <section className="mx-auto max-w-5xl px-5 md:px-8 py-16">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-slate-900">Our Mission</h2>
                    <p className="mt-4 text-slate-600 max-w-2xl mx-auto">
                        We're on a mission to reduce the gap between patients and quality
                        healthcare — starting with frictionless doctor discovery, and
                        growing into a full health platform that serves every life stage.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {values.map((v) => (
                        <div
                            key={v.title}
                            className="rounded-2xl bg-white ring-1 ring-slate-100 p-6 flex gap-4 shadow-sm hover:shadow-md transition-shadow"
                        >
                            <div className="shrink-0 flex items-center justify-center w-11 h-11 rounded-xl bg-blue-50 text-blue-600">
                                {v.icon}
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-900">{v.title}</h3>
                                <p className="mt-1 text-sm text-slate-600 leading-relaxed">{v.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── Team ─────────────────────────────────────────────────────── */}
            <section className="bg-white border-t border-b border-slate-100">
                <div className="mx-auto max-w-5xl px-5 md:px-8 py-16">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-slate-900">Meet the Team</h2>
                        <p className="mt-3 text-slate-600">
                            Doctors, engineers, and operators united by a shared purpose.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {team.map((member) => (
                            <div
                                key={member.name}
                                className="rounded-2xl bg-slate-50 ring-1 ring-slate-100 p-6 text-center"
                            >
                                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-white text-xl font-bold">
                                    {member.avatar}
                                </div>
                                <h3 className="font-semibold text-slate-900">{member.name}</h3>
                                <p className="text-xs font-medium text-blue-600 mt-0.5">{member.role}</p>
                                <p className="mt-3 text-xs text-slate-500 leading-relaxed">{member.bio}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA ──────────────────────────────────────────────────────── */}
            <section className="mx-auto max-w-5xl px-5 md:px-8 py-16 text-center">
                <div className="rounded-3xl bg-gradient-to-br from-blue-600 to-cyan-500 p-10 md:p-14 shadow-lg">
                    <h2 className="text-3xl md:text-4xl font-bold text-white">
                        Ready to take charge of your health?
                    </h2>
                    <p className="mt-4 text-blue-100 max-w-lg mx-auto">
                        Join thousands of patients who use Novadoc to find doctors,
                        book appointments, and access healthcare from anywhere.
                    </p>
                    <div className="mt-8 flex flex-wrap gap-3 justify-center">
                        <Link
                            href="/doctors"
                            className="rounded-full bg-white px-7 py-3 text-sm font-semibold text-blue-600 hover:bg-blue-50 transition-colors shadow"
                        >
                            Find a Doctor Now
                        </Link>
                        <Link
                            href="/auth/sign-in"
                            className="rounded-full border border-white/40 bg-white/10 px-7 py-3 text-sm font-semibold text-white hover:bg-white/20 transition-colors"
                        >
                            Create an Account
                        </Link>
                    </div>
                </div>
            </section>
        </main>
    );
}
