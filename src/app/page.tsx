"use client";
import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { IconAmbulance, IconHospital, IconInsurance, IconPill, IconStethoscope } from "@/components/icons";
import { DoctorCard } from "@/components/doctor-card";
import { ArticleCard } from "@/components/blog/article-card";
import { getPublishedArticles } from "@/lib/blog/articles";
import type { BlogArticleWithAuthor } from "@/lib/blog/articles";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { SearchBar } from "@/components/search/search-bar";
import { useAuth } from "@/components/auth-provider";
import { reliableQuery } from "@/lib/supabase/reliable-client";

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

// ---------------------------------------------------------------------------
// Standalone fetch functions — defined outside the component so React Query
// can cache them across navigations (the QueryClient lives in AppProviders).
// ---------------------------------------------------------------------------

async function fetchArticles(): Promise<BlogArticleWithAuthor[]> {
	const { articles, error } = await getPublishedArticles({ limit: 4 });
	if (error) throw new Error(error);
	return articles || [];
}

async function fetchTopDoctors(): Promise<TopDoctor[]> {
	const supabase = getSupabaseBrowserClient();
	let topDoctorIds: string[] = [];

	// Try to rank doctors by accepted appointment count
	try {
		const { data: topDoctorsData, error: topDoctorsError } = await reliableQuery<{ doctor_id: string }[]>(
			(client) =>
				client
					.from("appointments")
					.select("doctor_id")
					.eq("status", "accepted")
					.not("doctor_id", "is", null)
					.limit(1000) as any,
			{ timeout: 15000 }
		);

		if (!topDoctorsError && topDoctorsData) {
			const doctorCounts: Record<string, number> = {};
			topDoctorsData.forEach((apt) => {
				if (apt.doctor_id) doctorCounts[apt.doctor_id] = (doctorCounts[apt.doctor_id] || 0) + 1;
			});
			if (Object.keys(doctorCounts).length > 0) {
				topDoctorIds = Object.entries(doctorCounts)
					.sort(([, a], [, b]) => b - a)
					.slice(0, 4)
					.map(([id]) => id);
			}
		}
	} catch (err) {
		console.warn("[HomePage] Could not rank doctors by appointments, using fallback:", err);
	}

	// Fallback: first 4 doctors alphabetically
	if (topDoctorIds.length === 0) {
		const { data: allDoctors, error: fallbackError } = await supabase
			.from("profiles")
			.select("id")
			.eq("role", "doctor")
			.not("doctor_slug", "is", null)
			.order("full_name", { ascending: true })
			.limit(4);

		if (fallbackError) throw fallbackError;
		topDoctorIds = (allDoctors || []).map((d) => d.id);
	}

	if (topDoctorIds.length === 0) return [];

	const { data: doctors, error: docError } = await reliableQuery<any[]>(
		(client) =>
			client
				.from("profiles")
				.select("id, full_name, speciality, doctor_slug")
				.eq("role", "doctor")
				.in("id", topDoctorIds) as any,
		{ timeout: 10000 }
	);

	if (docError) throw docError;

	const doctorMap = new Map(doctors?.map((d) => [d.id, d]) || []);
	return topDoctorIds
		.map((id) => {
			const doc = doctorMap.get(id);
			if (!doc) return null;
			const name = doc.full_name || doc.doctor_slug || "Doctor";
			return {
				name,
				specialty: doc.speciality || "General Practitioner",
				rating: 4.5,
				distanceLabel: "Available",
				avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=2563eb&color=fff&size=128`,
				doctorId: doc.id,
				doctorSlug: doc.doctor_slug,
			};
		})
		.filter((d): d is TopDoctor => d !== null);
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function HomePage() {
	const { loading: authLoading } = useAuth();

	// React Query caches results in the QueryClient (mounted at app level).
	// Navigating away and back instantly shows the cached data while a
	// background refetch runs — no more empty spinners on re-visits.
	const {
		data: articles = [],
		isLoading: articlesLoading,
	} = useQuery({
		queryKey: ["homepage-articles"],
		queryFn: fetchArticles,
		enabled: !authLoading,          // wait for auth to resolve first
		staleTime: 5 * 60 * 1000,      // treat data as fresh for 5 min
		gcTime: 10 * 60 * 1000,        // keep in cache for 10 min
	});

	const {
		data: topDoctors = [],
		isLoading: doctorsLoading,
	} = useQuery({
		queryKey: ["homepage-top-doctors"],
		queryFn: fetchTopDoctors,
		enabled: !authLoading,
		staleTime: 5 * 60 * 1000,
		gcTime: 10 * 60 * 1000,
	});

	return (
		<main className="min-h-screen bg-slate-50">
			<section className="mx-auto max-w-md md:max-w-2xl lg:max-w-5xl xl:max-w-6xl px-5 md:px-6 lg:px-8 pb-24 pt-6">
				{/* Headline */}
				<h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight text-slate-900">
					Find your desired
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
					<h2 className="text-base font-semibold text-slate-900">Top Doctors</h2>
					<Link href="/doctors" className="text-xs text-slate-500 hover:underline">See all</Link>
				</div>
				{doctorsLoading ? (
					<div className="mt-3 h-28 md:h-36 rounded-2xl bg-white ring-1 ring-slate-100 flex items-center justify-center">
						<p className="text-sm text-slate-500">Loading doctors...</p>
					</div>
				) : topDoctors.length === 0 ? (
					<div className="mt-3 h-28 md:h-36 rounded-2xl bg-white ring-1 ring-slate-100 flex items-center justify-center flex-col gap-2">
						<p className="text-sm text-slate-500">No doctors available yet</p>
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
					<h2 className="text-base font-semibold text-slate-900">Health articles</h2>
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
