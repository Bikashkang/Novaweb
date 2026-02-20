import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    title: "About Us — NOVAHDL",
    description:
        "NOVAHDL is a next-generation digital healthcare platform built to bridge the gap between patients, healthcare professionals, and medical infrastructure through technology-driven solutions.",
};

const commitments = [
    { icon: "⚖️", text: "Ethical and transparent healthcare delivery" },
    { icon: "⚡", text: "Technology-enabled efficiency" },
    { icon: "🏅", text: "Professional integrity" },
    { icon: "🏗️", text: "Scalable infrastructure" },
    { icon: "🌱", text: "Sustainable growth" },
];

const whyItems = [
    {
        problem: "Patients struggle to find trusted medical professionals.",
        solution: "Patients find quality care on time.",
        icon: "🧑‍⚕️",
    },
    {
        problem: "Medical professionals lack unified digital visibility.",
        solution: "Healthcare professionals find opportunity.",
        icon: "💼",
    },
    {
        problem: "Hospitals struggle with equipment downtime.",
        solution: "Hospitals find technical support.",
        icon: "🏥",
    },
    {
        problem: "Emergency response is inconsistent, especially in rural areas.",
        solution: "Emergencies find response.",
        icon: "🚑",
    },
];

const founders = [
    {
        name: "Dr. Debashish Saikia",
        role: "Founder & Conceptual Architect",
        tag: "Physician",
        initials: "DS",
        color: "from-blue-600 to-indigo-700",
        bio: "The pioneer behind NOVAHDL's vision. After extensive experience across multiple healthcare organisations and diverse medical settings, Dr. Saikia identified the systemic gaps in India's healthcare delivery — from clinical practice to patient care — and conceived the foundational idea of a unified, technology-enabled platform for everyone.",
    },
    {
        name: "Mr. Bikash Kangaban",
        role: "Co-Founder & Tech Lead",
        tag: "Software Engineer",
        initials: "BK",
        color: "from-cyan-500 to-blue-600",
        bio: "Responsible for translating NOVAHDL's conceptual vision into practical, scalable execution. Also the founder of the Nongin App, bringing firsthand experience in building and operating live digital products. His background bridges engineering, entrepreneurship, and execution — making him a vital force in bringing NOVAHDL to life.",
    },
];

export default function AboutPage() {
    return (
        <main className="min-h-screen bg-white">
            {/* ── Hero ─────────────────────────────────────────────── */}
            <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 py-24 px-5">
                {/* decorative glow */}
                <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />

                <div className="relative mx-auto max-w-4xl text-center">
                    <span className="inline-block rounded-full border border-blue-400/30 bg-blue-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-blue-300 mb-6">
                        About NOVAHDL
                    </span>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
                        Redefining{" "}
                        <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                            Healthcare Access
                        </span>
                    </h1>
                    <p className="mt-6 text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
                        Born from a medical idea. Powered by technology. Built to unite
                        patients, professionals, hospitals, and emergency services on one
                        seamless platform.
                    </p>
                </div>
            </section>

            {/* ── The Name ─────────────────────────────────────────── */}
            <section className="py-20 px-5 bg-slate-50">
                <div className="mx-auto max-w-5xl">
                    <div className="grid md:grid-cols-2 gap-10 items-center">
                        {/* HDL card */}
                        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-8">
                            <div className="flex items-center gap-3 mb-5">
                                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 font-bold text-lg">
                                    HDL
                                </span>
                                <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                                    The Science Behind the Name
                                </span>
                            </div>
                            <p className="text-slate-700 leading-relaxed">
                                <strong className="text-slate-900">HDL</strong> in medicine stands for{" "}
                                <em>High-Density Lipoprotein</em> — the &ldquo;good cholesterol&rdquo; that
                                protects and strengthens the human heart. NOVAHDL reinterprets
                                this as <strong className="text-blue-700">Healthy Digital Life</strong>:
                                a system built to protect and strengthen the healthcare
                                ecosystem itself.
                            </p>
                        </div>

                        {/* Nova card */}
                        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-8">
                            <div className="flex items-center gap-3 mb-5">
                                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 font-bold text-lg">
                                    ✦
                                </span>
                                <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                                    The Vision Behind Nova
                                </span>
                            </div>
                            <p className="text-slate-700 leading-relaxed">
                                <strong className="text-slate-900">Nova</strong> derives from the
                                Latin <em>novus</em> — &ldquo;new.&rdquo; In astronomy, a nova is a sudden
                                burst of light; a powerful ignition.{" "}
                                <strong className="text-indigo-700">NOVAHDL represents that ignition</strong>{" "}
                                in healthcare: a new, technology-driven ecosystem that lights
                                the way for patients and professionals alike.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── What We Are ──────────────────────────────────────── */}
            <section className="py-20 px-5 bg-white">
                <div className="mx-auto max-w-4xl text-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
                        What We Are Building
                    </h2>
                    <p className="text-lg text-slate-600 leading-relaxed mb-10 max-w-3xl mx-auto">
                        NOVAHDL is a <strong>next-generation digital healthcare platform</strong> built to
                        bridge the gap between patients, healthcare professionals, and medical
                        infrastructure. We are creating a comprehensive ecosystem where medical
                        care, health information, biomedical services, and emergency response
                        converge into one unified platform.
                    </p>

                    {/* Systems */}
                    <div className="grid sm:grid-cols-2 gap-6 text-left">
                        <div className="group rounded-2xl border border-blue-100 bg-blue-50 p-7 hover:border-blue-300 hover:bg-blue-50/80 transition-colors">
                            <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white font-bold text-sm">
                                HIS
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900 mb-2">
                                Health Information System
                            </h3>
                            <p className="text-sm text-slate-600 leading-relaxed">
                                A centralised hub for health knowledge, professional visibility,
                                and patient-facing medical information — making quality
                                healthcare information accessible to all.
                            </p>
                        </div>
                        <div className="group rounded-2xl border border-cyan-100 bg-cyan-50 p-7 hover:border-cyan-300 hover:bg-cyan-50/80 transition-colors">
                            <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-600 text-white font-bold text-sm">
                                HSS
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900 mb-2">
                                Health Service System
                            </h3>
                            <p className="text-sm text-slate-600 leading-relaxed">
                                On-demand connections to doctors, hospitals, biomedical support,
                                and emergency response — structured, reliable, and available
                                anytime on the go.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Vision ───────────────────────────────────────────── */}
            <section className="py-20 px-5 bg-gradient-to-br from-blue-600 to-indigo-700">
                <div className="mx-auto max-w-3xl text-center">
                    <span className="inline-block rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-blue-100 mb-6">
                        Our Vision
                    </span>
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 leading-snug">
                        Quality medical services —{" "}
                        <span className="text-blue-200">accessible anytime, anywhere, on the go.</span>
                    </h2>
                    <p className="text-blue-100 text-lg leading-relaxed">
                        We are the healthcare equivalent of a smart mobility and hospitality
                        system — combining on-demand accessibility with structured network
                        efficiency across every medical service and healthcare need, delivered
                        digitally.
                    </p>
                </div>
            </section>

            {/* ── Why NOVAHDL ──────────────────────────────────────── */}
            <section className="py-20 px-5 bg-slate-50">
                <div className="mx-auto max-w-5xl">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                            Why NOVAHDL?
                        </h2>
                        <p className="text-slate-500 text-lg max-w-xl mx-auto">
                            Healthcare today is fragmented. We address each fracture point
                            with a single integrated solution.
                        </p>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-5">
                        {whyItems.map((item) => (
                            <div
                                key={item.icon}
                                className="rounded-2xl bg-white border border-slate-100 shadow-sm p-7"
                            >
                                <span className="text-3xl mb-4 block">{item.icon}</span>
                                <p className="text-sm text-slate-400 mb-2 line-through decoration-red-300">
                                    {item.problem}
                                </p>
                                <p className="text-base font-semibold text-slate-900">
                                    ✓ {item.solution}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Commitment ───────────────────────────────────────── */}
            <section className="py-20 px-5 bg-white">
                <div className="mx-auto max-w-4xl">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                            Our Commitment
                        </h2>
                        <p className="text-slate-500 max-w-xl mx-auto">
                            Designed to evolve — starting with information and core services,
                            expanding into emergency systems, logistics, and advanced
                            healthcare connectivity.
                        </p>
                    </div>
                    <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {commitments.map((c) => (
                            <li
                                key={c.text}
                                className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 px-5 py-4"
                            >
                                <span className="text-xl shrink-0">{c.icon}</span>
                                <span className="text-sm font-medium text-slate-700">{c.text}</span>
                            </li>
                        ))}
                    </ul>

                    <p className="mt-12 text-center text-lg font-medium text-slate-700 max-w-2xl mx-auto leading-relaxed">
                        Healthcare should not be complicated. It should be{" "}
                        <span className="text-blue-600 font-semibold">responsive</span>,{" "}
                        <span className="text-blue-600 font-semibold">reliable</span>, and{" "}
                        <span className="text-blue-600 font-semibold">reachable</span>.
                        <br />
                        <span className="text-slate-500 text-base mt-2 block">
                            We are building the next future of the medical and health sector —
                            step by step.
                        </span>
                    </p>
                </div>
            </section>

            {/* ── Founders ─────────────────────────────────────────── */}
            <section className="py-20 px-5 bg-slate-50">
                <div className="mx-auto max-w-5xl">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                            The People Behind NOVAHDL
                        </h2>
                        <p className="text-slate-500 max-w-xl mx-auto">
                            Built not from theory, but from frontline experience — by
                            professionals who understand the real gaps in India&apos;s
                            healthcare delivery system.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        {founders.map((f) => (
                            <div
                                key={f.name}
                                className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden"
                            >
                                {/* coloured header */}
                                <div className={`bg-gradient-to-br ${f.color} px-8 pt-8 pb-10 flex items-center gap-5`}>
                                    <div className="h-16 w-16 shrink-0 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-xl">
                                        {f.initials}
                                    </div>
                                    <div>
                                        <p className="text-white font-bold text-lg leading-tight">{f.name}</p>
                                        <p className="text-white/80 text-sm">{f.role}</p>
                                        <span className="mt-1 inline-block rounded-full bg-white/20 px-2.5 py-0.5 text-xs text-white/90">
                                            {f.tag}
                                        </span>
                                    </div>
                                </div>
                                {/* bio */}
                                <div className="px-8 py-6">
                                    <p className="text-slate-600 text-sm leading-relaxed">{f.bio}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA ──────────────────────────────────────────────── */}
            <section className="py-16 px-5 bg-white border-t border-slate-100">
                <div className="mx-auto max-w-2xl text-center">
                    <h2 className="text-2xl font-bold text-slate-900 mb-3">
                        Ready to experience the future of healthcare?
                    </h2>
                    <p className="text-slate-500 mb-8">
                        Find doctors, read health articles, and access services — all in one
                        place.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Link
                            href="/doctors"
                            className="rounded-full bg-blue-600 px-7 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
                        >
                            Find a Doctor
                        </Link>
                        <Link
                            href="/blog"
                            className="rounded-full border border-slate-200 px-7 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                            Read Health Articles
                        </Link>
                    </div>
                </div>
            </section>
        </main>
    );
}
