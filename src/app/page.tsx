"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { IconAmbulance, IconBell, IconHospital, IconInsurance, IconPill, IconStethoscope } from "@/components/icons";
import { DoctorCard } from "@/components/doctor-card";
import { ArticleCard } from "@/components/blog/article-card";
import { getPublishedArticles } from "@/lib/blog/articles";
import type { BlogArticleWithAuthor } from "@/lib/blog/articles";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { SearchBar } from "@/components/search/search-bar";

const categories = [
	{ icon: IconStethoscope, label: "Doctor", href: "/doctors" },
	{ icon: IconPill, label: "Pharmacy", href: "/coming-soon" },
	{ icon: IconHospital, label: "Hospital", href: "/coming-soon" },
	{ icon: IconAmbulance, label: "Ambulance", href: "/coming-soon" },
	{ icon: IconInsurance, label: "Insurance", href: "/coming-soon" }
];

type TopDoctor = {
	name: string;
	specialty: string;
	rating: number;
	distanceLabel: string;
	avatarUrl: string;
	doctorId: string;
	doctorSlug: string | null;
};

export default function HomePage() {
	const router = useRouter();
	const supabase = getSupabaseBrowserClient();
	const [articles, setArticles] = useState<BlogArticleWithAuthor[]>([]);
	const [articlesLoading, setArticlesLoading] = useState(true);
	const [topDoctors, setTopDoctors] = useState<TopDoctor[]>([]);
	const [doctorsLoading, setDoctorsLoading] = useState(true);
	const [topDoctorsErrorDetails, setTopDoctorsErrorDetails] = useState<any>(null);

	useEffect(() => {
		console.log("[HomePage] Effect MOUNT");
		let active = true;
		const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
			console.log("[HomePage] Auth Event:", event);
			if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'SIGNED_OUT' || event === 'INITIAL_SESSION') {
				loadArticles();
				loadTopDoctors();
			}
		});

		async function loadArticles() {
			console.log("[HomePage] loadArticles called");
			if (!active) {
				console.log("[HomePage] loadArticles aborted (inactive)");
				return;
			}
			setArticlesLoading(true);
			console.log("[HomePage] Loading articles...");
			try {
				const { data: { session }, error: sessionError } = await supabase.auth.getSession();
				console.log("[HomePage] Articles load - Session check:", { hasSession: !!session, error: sessionError });

				const { articles: arts, error } = await getPublishedArticles({ limit: 4 });
				if (!active) return;
				if (error) {
					console.error("[HomePage] Error loading articles:", error);

					// If auth error, try to refresh session and retry
					if (typeof error === 'string' && (error.includes('JWT') || error.includes('token'))) {
						console.log('[HomePage] Auth error detected, refreshing session...');
						const { error: refreshError } = await supabase.auth.refreshSession();
						if (!refreshError && active) {
							// Retry after refresh
							const { articles: retryArts, error: retryError } = await getPublishedArticles({ limit: 4 });
							if (!retryError && active) {
								console.log("[HomePage] Loaded articles after refresh:", retryArts?.length);
								setArticles(retryArts || []);
								setArticlesLoading(false);
								return;
							}
						}
					}

					setArticles([]);
				} else {
					console.log("[HomePage] Loaded articles:", arts?.length);
					setArticles(arts || []);
				}
			} catch (err) {
				console.error("[HomePage] Exception loading articles:", err);
				setArticles([]);
			} finally {
				if (active) setArticlesLoading(false);
			}
		}

		async function loadTopDoctors() {
			if (!active) return;
			setDoctorsLoading(true);
			setTopDoctorsErrorDetails(null);

			try {
				// Try to get top doctors by appointment count first
				// If this fails (e.g., RLS blocking), fall back to just getting doctors
				let topDoctorIds: string[] = [];

				try {
					const { data: topDoctorsData, error: topDoctorsError } = await supabase
						.from("appointments")
						.select("doctor_id")
						.eq("status", "accepted")
						.not("doctor_id", "is", null)
						.limit(1000);

					if (!active) return;

					if (!topDoctorsError && topDoctorsData) {
						// Count appointments per doctor
						const doctorCounts: Record<string, number> = {};
						topDoctorsData.forEach((apt) => {
							if (apt.doctor_id) {
								doctorCounts[apt.doctor_id] = (doctorCounts[apt.doctor_id] || 0) + 1;
							}
						});

						// Get top 4 doctor IDs by appointment count
						if (Object.keys(doctorCounts).length > 0) {
							topDoctorIds = Object.entries(doctorCounts)
								.sort(([, a], [, b]) => b - a)
								.slice(0, 4)
								.map(([id]) => id);
						}
					}
				} catch (err) {
					console.warn("Could not load appointments for top doctors, using fallback:", err);
				}

				// Fallback: get first 4 doctors alphabetically if no appointment data
				if (topDoctorIds.length === 0) {
					const { data: allDoctors, error: fallbackError } = await supabase
						.from("profiles")
						.select("id")
						.eq("role", "doctor")
						.not("doctor_slug", "is", null)
						.order("full_name", { ascending: true })
						.limit(4);

					if (fallbackError) {
						console.error("Error loading doctors (fallback):", fallbackError);
						if (active) setDoctorsLoading(false);
						return;
					}

					topDoctorIds = (allDoctors || []).map((d) => d.id);
				}

				if (topDoctorIds.length === 0) {
					console.warn("No doctors found");
					if (active) {
						setTopDoctors([]);
						setDoctorsLoading(false);
					}
					return;
				}

				if (!active) return;

				// Fetch doctor profiles in a single query
				console.log("[HomePage] Fetching doctor profiles for IDs:", topDoctorIds);
				const { data: doctors, error: docError } = await supabase
					.from("profiles")
					.select("id, full_name, speciality, doctor_slug")
					.eq("role", "doctor")
					.in("id", topDoctorIds);

				if (docError) console.error("[HomePage] Error fetching profiles:", docError);
				else console.log("[HomePage] Fetched profiles:", doctors?.length);

				if (!active) return;

				if (docError) {
					console.error("Error loading doctor profiles:", docError);
					if (active) {
						setTopDoctors([]);
						setDoctorsLoading(false);
					}
					return;
				}

				// Map to DoctorCard format with defaults, preserving order
				const doctorMap = new Map(doctors?.map(d => [d.id, d]) || []);
				const mapped = topDoctorIds
					.map((id) => {
						const doc = doctorMap.get(id);
						if (!doc) return null;
						const name = doc.full_name || doc.doctor_slug || "Doctor";
						return {
							name,
							specialty: doc.speciality || "General Practitioner",
							rating: 4.5, // Default rating
							distanceLabel: "Available", // Default
							avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=2563eb&color=fff&size=128`,
							doctorId: doc.id,
							doctorSlug: doc.doctor_slug,
						};
					})
					.filter((d): d is TopDoctor => d !== null);

				if (active) setTopDoctors(mapped);
			} catch (err) {
				console.error("Exception loading top doctors:", err);
				if (active) {
					setTopDoctorsErrorDetails(err);
					setTopDoctors([]);
				}
			} finally {
				if (active) setDoctorsLoading(false);
			}
		}

		loadArticles();
		loadTopDoctors();
		return () => {
			console.log("[HomePage] Effect UNMOUNT / Cleanup");
			active = false;
			subscription.unsubscribe();
		};
	}, [supabase]);

	return (
		<main className="min-h-screen bg-slate-50">
			<section className="mx-auto max-w-md md:max-w-2xl lg:max-w-5xl xl:max-w-6xl px-5 md:px-6 lg:px-8 pb-24 pt-6">
				{/* Top bar */}
				<div className="mb-5 flex items-center justify-between">
					<div />
					<button className="rounded-full p-2 text-slate-700 hover:bg-white/80">
						<IconBell className="h-6 w-6" />
					</button>
				</div>

				{/* Headline */}
				<h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight text-slate-900">
					Find your desire
					<br />
					health solution
				</h1>

				{/* Search */}
				<div className="mt-4">
					<SearchBar showRecommendations={true} />
				</div>

				{/* Categories */}
				<div className="mt-5 grid grid-cols-5 gap-3 md:gap-4 lg:gap-6 md:max-w-2xl">
					{categories.map(({ icon: Icon, label, href }) => (
						<Link
							key={label}
							href={href}
							className="flex flex-col items-center gap-2 rounded-2xl bg-white p-4 lg:p-5 text-slate-700 shadow-sm ring-1 ring-slate-100 hover:bg-slate-50 transition-colors"
						>
							<Icon className="h-6 w-6" />
							<span className="text-xs">{label}</span>
						</Link>
					))}
				</div>

				{/* Banner */}
				<div className="mt-5 grid grid-cols-[1fr_auto] items-center gap-4 rounded-2xl bg-white p-4 md:p-6 ring-1 ring-slate-100 md:max-w-3xl lg:max-w-none">
					<div className="flex-1">
						<p className="text-base md:text-lg lg:text-xl font-semibold text-slate-900">Early protection for your family health</p>
						<Link href="/coming-soon" className="mt-3 inline-flex rounded-full bg-slate-900 px-4 py-2 text-xs md:text-sm font-medium text-white hover:bg-slate-800 transition-colors">Learn more</Link>
					</div>
					<div className="relative h-24 w-24 md:h-28 md:w-28 lg:h-32 lg:w-32 overflow-hidden rounded-full bg-slate-100">
						<Image src="https://images.unsplash.com/photo-1537368910025-700350fe46c7?q=80&w=256&auto=format&fit=crop" alt="doctor" fill className="object-cover" />
					</div>
				</div>

				{/* Top Doctor */}
				<div className="mt-6 flex items-center justify-between">
					<h2 className="text-base font-semibold text-slate-900">Top Doctor</h2>
					<Link href="/doctors" className="text-xs text-slate-500 hover:underline">See all</Link>
				</div>
				{doctorsLoading ? (
					<div className="mt-3 h-28 md:h-36 rounded-2xl bg-white ring-1 ring-slate-100 flex items-center justify-center">
						<p className="text-sm text-slate-500">Loading doctors...</p>
					</div>
				) : topDoctors.length === 0 ? (
					<div className="mt-3 h-28 md:h-36 rounded-2xl bg-white ring-1 ring-slate-100 flex items-center justify-center flex-col gap-2">
						<p className="text-sm text-slate-500">No doctors available yet</p>
						{!!topDoctorsErrorDetails && <p className="text-xs text-red-500 px-4 text-center">{String(topDoctorsErrorDetails)}</p>}
					</div>
				) : (
					<>
						{/* Mobile: horizontal scroll */}
						<div className="mt-3 grid grid-flow-col auto-cols-[72%] gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none] md:hidden">
							{topDoctors.map((d) => (
								<DoctorCard
									key={d.doctorId}
									{...d}
									href={`/doctors${d.doctorSlug ? `?doctor=${d.doctorSlug}` : `?doctorId=${d.doctorId}`}`}
								/>
							))}
						</div>
						{/* Desktop: grid */}
						<div className="mt-3 hidden md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
							{topDoctors.map((d) => (
								<DoctorCard
									key={d.doctorId}
									{...d}
									href={`/doctors${d.doctorSlug ? `?doctor=${d.doctorSlug}` : `?doctorId=${d.doctorId}`}`}
								/>
							))}
						</div>
					</>
				)}

				{/* Health article */}
				<div className="mt-6 flex items-center justify-between">
					<h2 className="text-base font-semibold text-slate-900">Health article</h2>
					<Link href="/blog" className="text-xs text-slate-500 hover:underline">See all</Link>
				</div>
				{articlesLoading ? (
					<div className="mt-3 h-28 md:h-36 rounded-2xl bg-white ring-1 ring-slate-100 flex items-center justify-center">
						<p className="text-sm text-slate-500">Loading articles...</p>
					</div>
				) : articles.length === 0 ? (
					<div className="mt-3 h-28 md:h-36 rounded-2xl bg-white ring-1 ring-slate-100 flex items-center justify-center">
						<p className="text-sm text-slate-500">No articles available yet</p>
					</div>
				) : (
					<>
						{/* Mobile: horizontal scroll */}
						<div className="mt-3 grid grid-flow-col auto-cols-[72%] gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none] md:hidden">
							{articles.map((article) => (
								<ArticleCard key={article.id} article={article} />
							))}
						</div>
						{/* Desktop: grid */}
						<div className="mt-3 hidden md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
							{articles.map((article) => (
								<ArticleCard key={article.id} article={article} />
							))}
						</div>
					</>
				)}
			</section>
		</main>
	);
}


