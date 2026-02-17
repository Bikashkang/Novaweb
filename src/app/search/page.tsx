"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getPublishedArticles } from "@/lib/blog/articles";
import type { BlogArticleWithAuthor } from "@/lib/blog/articles";
import { DoctorCard } from "@/components/doctor-card";
import { ArticleCard } from "@/components/blog/article-card";
import { SearchBar } from "@/components/search/search-bar";
import Link from "next/link";

type TopDoctor = {
	name: string;
	specialty: string;
	rating: number;
	distanceLabel: string;
	avatarUrl: string;
	doctorId: string;
};

function SearchResults() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const supabase = getSupabaseBrowserClient();
	const query = searchParams.get("q") || "";

	const [doctors, setDoctors] = useState<TopDoctor[]>([]);
	const [articles, setArticles] = useState<BlogArticleWithAuthor[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (!query.trim()) {
			setDoctors([]);
			setArticles([]);
			setLoading(false);
			return;
		}

		async function performSearch() {
			setLoading(true);
			const searchTerm = query.toLowerCase().trim();

			// Search doctors
			const { data: doctorProfiles, error: docError } = await supabase
				.from("profiles")
				.select("id, full_name, speciality, doctor_slug")
				.eq("role", "doctor")
				.not("doctor_slug", "is", null)
				.or(`full_name.ilike.%${searchTerm}%,speciality.ilike.%${searchTerm}%`);

			const doctorResults: TopDoctor[] = (doctorProfiles || []).map((doc) => {
				const name = doc.full_name || doc.doctor_slug || "Doctor";
				return {
					name,
					specialty: doc.speciality || "General Practitioner",
					rating: 4.5,
					distanceLabel: "Available",
					avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=2563eb&color=fff&size=128`,
					doctorId: doc.id,
				};
			});

			// Search articles
			const { articles: articleResults } = await getPublishedArticles({ limit: 20 });
			const filteredArticles = articleResults.filter(
				(article) =>
					article.title.toLowerCase().includes(searchTerm) ||
					article.excerpt?.toLowerCase().includes(searchTerm) ||
					article.category?.toLowerCase().includes(searchTerm) ||
					article.tags.some((tag) => tag.toLowerCase().includes(searchTerm))
			);

			setDoctors(doctorResults);
			setArticles(filteredArticles);
			setLoading(false);
		}

		performSearch();
	}, [query, supabase]);

	return (
		<main className="min-h-screen bg-slate-50">
			<section className="mx-auto max-w-md md:max-w-2xl lg:max-w-5xl xl:max-w-6xl px-5 md:px-6 lg:px-8 pb-24 pt-6">
				{/* Search Bar */}
				<div className="mb-6">
					<SearchBar
						initialValue={query}
						showRecommendations={true}
					/>
				</div>

				{loading ? (
					<div className="flex items-center justify-center py-12">
						<p className="text-slate-500">Searching...</p>
					</div>
				) : !query.trim() ? (
					<div className="flex items-center justify-center py-12">
						<p className="text-slate-500">Enter a search term to find doctors, articles, and more</p>
					</div>
				) : (
					<>
						{/* Doctors Results */}
						{doctors.length > 0 && (
							<div className="mb-8">
								<div className="mb-4 flex items-center justify-between">
									<h2 className="text-lg font-semibold text-slate-900">
										Doctors ({doctors.length})
									</h2>
									<Link href={`/doctors?q=${encodeURIComponent(query)}`} className="text-xs text-slate-500 hover:underline">
										See all
									</Link>
								</div>
								<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
									{doctors.slice(0, 4).map((doctor) => (
										<DoctorCard key={doctor.doctorId} {...doctor} />
									))}
								</div>
							</div>
						)}

						{/* Articles Results */}
						{articles.length > 0 && (
							<div>
								<div className="mb-4 flex items-center justify-between">
									<h2 className="text-lg font-semibold text-slate-900">
										Articles ({articles.length})
									</h2>
									<Link href={`/blog?q=${encodeURIComponent(query)}`} className="text-xs text-slate-500 hover:underline">
										See all
									</Link>
								</div>
								<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
									{articles.slice(0, 4).map((article) => (
										<ArticleCard key={article.id} article={article} />
									))}
								</div>
							</div>
						)}

						{/* No Results */}
						{doctors.length === 0 && articles.length === 0 && (
							<div className="flex flex-col items-center justify-center py-12">
								<p className="text-slate-600 mb-2">No results found for &quot;{query}&quot;</p>
								<p className="text-sm text-slate-500">Try searching with different keywords</p>
							</div>
						)}
					</>
				)}
			</section>
		</main>
	);
}

export default function SearchPage() {
	return (
		<Suspense fallback={
			<main className="min-h-screen bg-slate-50">
				<section className="mx-auto max-w-md md:max-w-2xl lg:max-w-5xl xl:max-w-6xl px-5 md:px-6 lg:px-8 pb-24 pt-6">
					<div className="flex items-center justify-center py-12">
						<p className="text-slate-500">Loading...</p>
					</div>
				</section>
			</main>
		}>
			<SearchResults />
		</Suspense>
	);
}
