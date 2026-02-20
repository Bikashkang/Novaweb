import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    title: "Privacy Policy — NOVAHDL",
    description:
        "Learn how NOVAHDL collects, uses, stores, and protects your personal and health data.",
};

const EFFECTIVE_DATE = "20 February 2025";
const CONTACT_EMAIL = "support@novahdl.com";

const sections = [
    {
        id: "intro",
        title: "1. Introduction",
        body: `NOVAHDL ("we", "us", or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your personal information when you use our platform, including our Health Information System (HIS) and Health Service System (HSS). By using NOVAHDL, you consent to the practices described in this Policy.`,
    },
    {
        id: "data-collected",
        title: "2. Information We Collect",
        body: `We collect the following categories of information:\n\n• Identity & Contact Data: name, email address, phone number, and date of birth provided during registration.\n\n• Health Data: information you voluntarily share, including symptoms, medical history, appointment details, and doctor interactions. This data is treated as sensitive and is handled with additional care.\n\n• Professional Data (Healthcare Professionals): qualifications, registration numbers, speciality, and practice details.\n\n• Usage Data: pages visited, features used, device type, browser, IP address, and timestamps — collected automatically to improve the platform.\n\n• Communications: messages sent through in-app chat or support channels.`,
    },
    {
        id: "use",
        title: "3. How We Use Your Information",
        body: `We use your information to:\n\n• Operate and deliver the Platform's services, including appointment booking and doctor discovery.\n\n• Verify the identity and credentials of healthcare professionals.\n\n• Personalise your experience and surface relevant health content.\n\n• Send transactional communications (appointment confirmations, reminders, and account notifications).\n\n• Improve the Platform through analytics and user feedback.\n\n• Comply with legal obligations and enforce our Terms and Conditions.\n\nWe will not use your health data for targeted advertising.`,
    },
    {
        id: "sharing",
        title: "4. Sharing Your Information",
        body: `We do not sell your personal data. We may share your information in the following circumstances:\n\n• With Healthcare Professionals: your name and appointment details are shared with the doctor or professional you engage through the Platform.\n\n• With Service Providers: trusted third-party vendors who assist in operating the Platform (e.g., cloud hosting, payment processing, SMS services) under strict data-processing agreements.\n\n• For Legal Compliance: when required by law, court order, or regulatory authority.\n\n• Business Transfers: in the event of a merger, acquisition, or sale of assets, your data may be transferred to the successor entity, which will be bound by this Policy.`,
    },
    {
        id: "storage",
        title: "5. Data Storage & Security",
        body: `Your data is stored on secure servers using industry-standard encryption (TLS in transit, AES-256 at rest). We implement access controls, regular security audits, and follow secure software development practices. While we take all reasonable precautions, no system is completely immune to security risks. You are responsible for keeping your account credentials confidential.`,
    },
    {
        id: "retention",
        title: "6. Data Retention",
        body: `We retain your personal data for as long as your account is active or as needed to provide services. You may request deletion of your account and associated data at any time by contacting us at ${CONTACT_EMAIL}. We may retain certain data for up to 7 years where required by applicable law (e.g., health records regulations in India), after which it will be securely deleted.`,
    },
    {
        id: "rights",
        title: "7. Your Rights",
        body: `Depending on your location, you may have the right to:\n\n• Access the personal data we hold about you.\n\n• Correct inaccurate or incomplete data.\n\n• Request deletion of your data ("right to be forgotten") subject to legal retention requirements.\n\n• Object to or restrict certain processing activities.\n\n• Receive a portable copy of your data.\n\nTo exercise any of these rights, please contact us at ${CONTACT_EMAIL}. We will respond within 30 days.`,
    },
    {
        id: "cookies",
        title: "8. Cookies & Tracking",
        body: `We use cookies and similar technologies to maintain your session, remember preferences, and analyse platform usage. Essential cookies are required for the Platform to function. You may disable non-essential cookies through your browser settings; however, doing so may affect Platform functionality. We do not use third-party advertising cookies.`,
    },
    {
        id: "children",
        title: "9. Children's Privacy",
        body: `NOVAHDL is not intended for users under the age of 18. We do not knowingly collect personal data from children. If we become aware that a child has provided personal information without parental consent, we will delete that information promptly. Parents or guardians who believe their child has submitted data should contact us immediately.`,
    },
    {
        id: "third-party",
        title: "10. Third-Party Links",
        body: `The Platform may contain links to third-party websites or services. NOVAHDL is not responsible for the privacy practices of those sites, and we encourage you to review their privacy policies before providing any personal information.`,
    },
    {
        id: "health-data",
        title: "11. Sensitive Health Information",
        body: `Health data is among the most sensitive categories of personal data. We process health information only to the extent necessary to provide the services you request, and we apply additional technical and organisational safeguards. Health data is never shared with third parties for marketing or commercial purposes. Where required, we obtain your explicit consent before processing sensitive health information.`,
    },
    {
        id: "changes",
        title: "12. Changes to This Policy",
        body: `We may update this Privacy Policy periodically. We will notify you of significant changes by updating the effective date and, where appropriate, by sending an in-app or email notification. Your continued use of the Platform after any changes signifies your acceptance of the revised Policy.`,
    },
    {
        id: "contact-p",
        title: "13. Contact Us",
        body: `If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us at:\n\nEmail: ${CONTACT_EMAIL}\nNOVAHDL, Assam, India.`,
    },
];

export default function PrivacyPage() {
    return (
        <main className="min-h-screen bg-white">
            {/* Header */}
            <div className="bg-slate-900 py-16 px-5">
                <div className="mx-auto max-w-3xl">
                    <p className="text-sm font-semibold uppercase tracking-widest text-blue-400 mb-3">
                        Legal
                    </p>
                    <h1 className="text-4xl font-bold text-white mb-4">
                        Privacy Policy
                    </h1>
                    <p className="text-slate-400 text-sm">
                        Effective date:{" "}
                        <span className="text-slate-300">{EFFECTIVE_DATE}</span>
                    </p>
                    <p className="mt-4 text-slate-300 text-sm leading-relaxed max-w-xl">
                        Your privacy matters to us. This Policy explains how we collect,
                        use, and protect your personal and health information when you use
                        NOVAHDL.
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
                        <div
                            key={s.id}
                            id={s.id}
                            className="pt-10 first:pt-0 scroll-mt-20"
                        >
                            <h2 className="text-lg font-semibold text-slate-900 mb-3">
                                {s.title}
                            </h2>
                            <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
                                {s.body}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Footer nav */}
                <div className="mt-16 pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <Link href="/terms" className="text-sm text-blue-600 hover:underline">
                        → Read our Terms &amp; Conditions
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
