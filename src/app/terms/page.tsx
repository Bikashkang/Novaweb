import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    title: "Terms & Conditions — NOVAHDL",
    description:
        "Read the Terms and Conditions governing your use of the NOVAHDL platform and its healthcare services.",
};

const EFFECTIVE_DATE = "20 February 2025";
const CONTACT_EMAIL = "support@novahdl.com";

const sections = [
    {
        id: "acceptance",
        title: "1. Acceptance of Terms",
        body: `By accessing or using NOVAHDL ("the Platform", "we", "us", or "our"), you agree to be bound by these Terms and Conditions. If you do not agree to any part of these terms, you must not use the Platform. These terms apply to all users including patients, healthcare professionals, and visitors.`,
    },
    {
        id: "services",
        title: "2. Description of Services",
        body: `NOVAHDL provides a digital healthcare platform that connects patients with healthcare professionals, facilitates appointment booking, offers health information, and delivers related services through its Health Information System (HIS) and Health Service System (HSS). NOVAHDL does not directly provide medical services; it acts as a technology intermediary. Any diagnosis, prescription, or treatment decision remains the sole responsibility of the licensed healthcare professional involved.`,
    },
    {
        id: "eligibility",
        title: "3. Eligibility",
        body: `You must be at least 18 years of age to register an account. By creating an account, you represent that the information you provide is accurate, current, and complete. Healthcare professionals registering on the Platform confirm that they hold valid, current licences to practise in the applicable jurisdiction and that all credentials submitted are authentic.`,
    },
    {
        id: "accounts",
        title: "4. User Accounts",
        body: `You are responsible for maintaining the confidentiality of your account credentials. You must notify us immediately at ${CONTACT_EMAIL} if you suspect any unauthorised access to your account. NOVAHDL shall not be liable for any loss arising from your failure to safeguard your login information. We reserve the right to suspend or terminate accounts that violate these Terms.`,
    },
    {
        id: "medical-disclaimer",
        title: "5. Medical Disclaimer",
        body: `Content on NOVAHDL — including articles, doctor profiles, and service descriptions — is provided for informational purposes only and does not constitute professional medical advice, diagnosis, or treatment. Always seek the guidance of a qualified healthcare professional with any questions you may have regarding a medical condition. In an emergency, call your local emergency services immediately; do not rely solely on the Platform.`,
    },
    {
        id: "conduct",
        title: "6. Acceptable Use",
        body: `You agree not to: (a) use the Platform for any unlawful purpose; (b) submit false, misleading, or fraudulent information; (c) impersonate any person or entity; (d) upload malicious code or interfere with the Platform's operation; (e) attempt to gain unauthorised access to any part of the Platform; or (f) use the Platform to solicit patients or professionals outside of the Platform's intended purpose.`,
    },
    {
        id: "ip",
        title: "7. Intellectual Property",
        body: `All content, branding, software, and materials on the Platform are the intellectual property of NOVAHDL or its licensors and are protected by applicable intellectual property laws. You may not copy, reproduce, distribute, or create derivative works from any Platform content without our prior written consent.`,
    },
    {
        id: "privacy",
        title: "8. Privacy",
        body: `Your use of the Platform is also governed by our Privacy Policy, which is incorporated into these Terms by reference. By using the Platform, you consent to the collection and use of your information as described in our Privacy Policy.`,
    },
    {
        id: "liability",
        title: "9. Limitation of Liability",
        body: `To the maximum extent permitted by applicable law, NOVAHDL shall not be liable for any indirect, incidental, special, consequential, or punitive damages — including loss of data, revenue, or goodwill — arising out of or in connection with your use of the Platform, even if NOVAHDL has been advised of the possibility of such damages. Our total aggregate liability to you shall not exceed the amount you paid us, if any, in the twelve (12) months preceding the claim.`,
    },
    {
        id: "termination",
        title: "10. Termination",
        body: `We reserve the right to suspend or permanently terminate your access to the Platform at our sole discretion, without prior notice, for conduct that we determine violates these Terms or is harmful to other users, us, or third parties. Upon termination, all licences granted to you under these Terms will immediately cease.`,
    },
    {
        id: "changes",
        title: "11. Changes to These Terms",
        body: `We may update these Terms from time to time. We will notify you of material changes by updating the effective date at the top of this page and, where appropriate, by sending an in-app or email notification. Your continued use of the Platform after changes are posted constitutes your acceptance of the updated Terms.`,
    },
    {
        id: "governing-law",
        title: "12. Governing Law",
        body: `These Terms shall be governed by and construed in accordance with the laws of India. Any disputes arising from or relating to these Terms shall be subject to the exclusive jurisdiction of the courts located in Assam, India.`,
    },
    {
        id: "contact-t",
        title: "13. Contact Us",
        body: `If you have questions about these Terms, please contact us at ${CONTACT_EMAIL}.`,
    },
];

export default function TermsPage() {
    return (
        <main className="min-h-screen bg-white">
            {/* Header */}
            <div className="bg-slate-900 py-16 px-5">
                <div className="mx-auto max-w-3xl">
                    <p className="text-sm font-semibold uppercase tracking-widest text-blue-400 mb-3">
                        Legal
                    </p>
                    <h1 className="text-4xl font-bold text-white mb-4">
                        Terms &amp; Conditions
                    </h1>
                    <p className="text-slate-400 text-sm">
                        Effective date: <span className="text-slate-300">{EFFECTIVE_DATE}</span>
                    </p>
                    <p className="mt-4 text-slate-300 text-sm leading-relaxed max-w-xl">
                        Please read these Terms and Conditions carefully before using
                        NOVAHDL. They set out the rules for using our platform and the
                        services we provide.
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="mx-auto max-w-3xl px-5 py-14">
                {/* Quick-nav */}
                <div className="mb-12 rounded-2xl border border-slate-100 bg-slate-50 p-6">
                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-4">
                        Contents
                    </p>
                    <ol className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5">
                        {sections.map((s) => (
                            <li key={s.id}>
                                <a
                                    href={`#${s.id}`}
                                    className="text-sm text-blue-600 hover:underline"
                                >
                                    {s.title}
                                </a>
                            </li>
                        ))}
                    </ol>
                </div>

                {/* Sections */}
                <div className="space-y-10 divide-y divide-slate-100">
                    {sections.map((s) => (
                        <div key={s.id} id={s.id} className="pt-10 first:pt-0 scroll-mt-20">
                            <h2 className="text-lg font-semibold text-slate-900 mb-3">
                                {s.title}
                            </h2>
                            <p className="text-slate-600 text-sm leading-relaxed">{s.body}</p>
                        </div>
                    ))}
                </div>

                {/* Footer nav */}
                <div className="mt-16 pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <Link
                        href="/privacy"
                        className="text-sm text-blue-600 hover:underline"
                    >
                        → Read our Privacy Policy
                    </Link>
                    <Link
                        href="/"
                        className="text-sm text-slate-500 hover:text-slate-700"
                    >
                        ← Back to Home
                    </Link>
                </div>
            </div>
        </main>
    );
}
