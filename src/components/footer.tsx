import Link from "next/link";
import Image from "next/image";

export function Footer() {
    return (
        <footer className="bg-slate-900 text-slate-400 mt-auto">
            <div className="mx-auto max-w-6xl px-5 py-12">
                <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8 pb-10 border-b border-slate-800">
                    {/* Brand */}
                    <div className="col-span-full md:col-span-1">
                        <Link href="/" className="inline-block mb-4">
                            <Image
                                src="/assets/novahdl_logo-removebg-preview.png"
                                alt="NOVAHDL"
                                width={140}
                                height={46}
                                className="h-10 w-auto"
                            />
                        </Link>
                        <p className="text-xs leading-relaxed text-slate-500 max-w-[220px]">
                            A new, technology-driven ecosystem connecting patients,
                            professionals, and emergency services seamlessly.
                        </p>
                    </div>

                    {/* Platform */}
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-4">
                            Platform
                        </p>
                        <ul className="space-y-2.5">
                            <li><Link href="/doctors" className="text-sm hover:text-white transition-colors">Find Doctors</Link></li>
                            <li><Link href="/diagnostics" className="text-sm hover:text-white transition-colors">Diagnostics</Link></li>
                            <li><Link href="/blog" className="text-sm hover:text-white transition-colors">Health Articles</Link></li>
                            <li><Link href="/coming-soon" className="text-sm hover:text-white transition-colors">Emergency Services</Link></li>
                        </ul>
                    </div>

                    {/* Company */}
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-4">
                            Company
                        </p>
                        <ul className="space-y-2.5">
                            <li><Link href="/about" className="text-sm hover:text-white transition-colors">About Us</Link></li>
                            <li><Link href="/coming-soon" className="text-sm hover:text-white transition-colors">Careers</Link></li>
                            <li><Link href="/coming-soon" className="text-sm hover:text-white transition-colors">Contact</Link></li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-4">
                            Legal
                        </p>
                        <ul className="space-y-2.5">
                            <li><Link href="/terms" className="text-sm hover:text-white transition-colors">Terms &amp; Conditions</Link></li>
                            <li><Link href="/privacy" className="text-sm hover:text-white transition-colors">Privacy Policy</Link></li>
                        </ul>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-600">
                    <p>© {new Date().getFullYear()} NOVAHDL. All rights reserved.</p>
                    <div className="flex items-center gap-4">
                        <Link href="/terms" className="hover:text-slate-400 transition-colors">Terms</Link>
                        <Link href="/privacy" className="hover:text-slate-400 transition-colors">Privacy</Link>
                        <Link href="/about" className="hover:text-slate-400 transition-colors">About</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
