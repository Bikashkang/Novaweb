"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { IconSearch } from "@/components/icons";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getCategories } from "@/lib/blog/articles";

type SearchBarProps = {
	initialValue?: string;
	onSubmit?: (query: string) => void;
	showRecommendations?: boolean;
};

const POPULAR_SEARCHES = [
	"Cardiologist",
	"Pediatrician",
	"Dermatologist",
	"General Practitioner",
	"Diabetes",
	"Hypertension",
	"Heart Health",
	"Mental Health",
	"Nutrition",
	"Exercise",
];

export function SearchBar({ initialValue = "", onSubmit, showRecommendations = true }: SearchBarProps) {
	const router = useRouter();
	const supabase = getSupabaseBrowserClient();
	const [query, setQuery] = useState(initialValue);
	const [suggestions, setSuggestions] = useState<string[]>([]);
	const [showSuggestions, setShowSuggestions] = useState(false);
	const [categories, setCategories] = useState<string[]>([]);
	const [specialties, setSpecialties] = useState<string[]>([]);
	const [recentSearches, setRecentSearches] = useState<string[]>([]);
	const searchRef = useRef<HTMLDivElement>(null);

	// Load categories and specialties
	useEffect(() => {
		async function loadData() {
			// Load article categories
			const { categories: cats } = await getCategories();
			setCategories(cats || []);

			// Load doctor specialties
			const { data: doctors } = await supabase
				.from("profiles")
				.select("speciality")
				.eq("role", "doctor")
				.not("speciality", "is", null);

			const uniqueSpecialties = Array.from(
				new Set((doctors || []).map((d) => d.speciality).filter(Boolean))
			) as string[];
			setSpecialties(uniqueSpecialties);
		}
		loadData();
	}, [supabase]);

	// Load recent searches from localStorage
	useEffect(() => {
		const stored = localStorage.getItem("recentSearches");
		if (stored) {
			try {
				setRecentSearches(JSON.parse(stored));
			} catch (e) {
				// Ignore parse errors
			}
		}
	}, []);

	// Generate suggestions based on query
	useEffect(() => {
		if (!query.trim() || !showRecommendations) {
			setSuggestions([]);
			return;
		}

		const lowerQuery = query.toLowerCase().trim();
		const allSuggestions: string[] = [];

		// Match specialties
		specialties.forEach((spec) => {
			if (spec.toLowerCase().includes(lowerQuery)) {
				allSuggestions.push(spec);
			}
		});

		// Match categories
		categories.forEach((cat) => {
			if (cat.toLowerCase().includes(lowerQuery) && !allSuggestions.includes(cat)) {
				allSuggestions.push(cat);
			}
		});

		// Match popular searches
		POPULAR_SEARCHES.forEach((pop) => {
			if (pop.toLowerCase().includes(lowerQuery) && !allSuggestions.includes(pop)) {
				allSuggestions.push(pop);
			}
		});

		setSuggestions(allSuggestions.slice(0, 8));
	}, [query, specialties, categories, showRecommendations]);

	// Close suggestions when clicking outside
	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
				setShowSuggestions(false);
			}
		}

		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const saveRecentSearch = (searchTerm: string) => {
		if (!searchTerm.trim()) return;
		const updated = [searchTerm, ...recentSearches.filter((s) => s !== searchTerm)].slice(0, 5);
		setRecentSearches(updated);
		localStorage.setItem("recentSearches", JSON.stringify(updated));
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const searchTerm = query.trim();
		if (!searchTerm) return;

		saveRecentSearch(searchTerm);
		setShowSuggestions(false);

		if (onSubmit) {
			onSubmit(searchTerm);
		} else {
			router.push(`/search?q=${encodeURIComponent(searchTerm)}`);
		}
	};

	const handleSuggestionClick = (suggestion: string) => {
		setQuery(suggestion);
		saveRecentSearch(suggestion);
		setShowSuggestions(false);
		if (onSubmit) {
			onSubmit(suggestion);
		} else {
			router.push(`/search?q=${encodeURIComponent(suggestion)}`);
		}
	};

	const handleInputFocus = () => {
		if (query.trim() || recentSearches.length > 0 || suggestions.length > 0) {
			setShowSuggestions(true);
		}
	};

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setQuery(e.target.value);
		setShowSuggestions(true);
	};

	return (
		<div ref={searchRef} className="relative">
			<form onSubmit={handleSubmit} className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-100 md:max-w-xl">
				<div className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2">
					<IconSearch className="h-5 w-5 text-slate-500" />
					<input
						type="text"
						value={query}
						onChange={handleInputChange}
						onFocus={handleInputFocus}
						placeholder="Search doctor, drugs, articles..."
						className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
					/>
				</div>
			</form>

			{/* Recommendations Dropdown */}
			{showRecommendations && showSuggestions && (
				<div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden md:max-w-xl">
					{/* Suggestions */}
					{suggestions.length > 0 && (
						<div className="p-2">
							<p className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase">Suggestions</p>
							{suggestions.map((suggestion, index) => (
								<button
									key={index}
									onClick={() => handleSuggestionClick(suggestion)}
									className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
								>
									<IconSearch className="inline h-4 w-4 mr-2 text-slate-400" />
									{suggestion}
								</button>
							))}
						</div>
					)}

					{/* Recent Searches */}
					{recentSearches.length > 0 && !query.trim() && (
						<div className="p-2 border-t border-slate-100">
							<p className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase">Recent Searches</p>
							{recentSearches.map((search, index) => (
								<button
									key={index}
									onClick={() => handleSuggestionClick(search)}
									className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
								>
									<IconSearch className="inline h-4 w-4 mr-2 text-slate-400" />
									{search}
								</button>
							))}
						</div>
					)}

					{/* Popular Searches */}
					{!query.trim() && (
						<div className="p-2 border-t border-slate-100">
							<p className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase">Popular Searches</p>
							<div className="flex flex-wrap gap-2 px-3 py-2">
								{POPULAR_SEARCHES.slice(0, 6).map((search, index) => (
									<button
										key={index}
										onClick={() => handleSuggestionClick(search)}
										className="px-3 py-1 text-xs bg-slate-100 text-slate-700 rounded-full hover:bg-slate-200 transition-colors"
									>
										{search}
									</button>
								))}
							</div>
						</div>
					)}

					{/* No suggestions message */}
					{query.trim() && suggestions.length === 0 && (
						<div className="p-4 text-center text-sm text-slate-500">
							No suggestions found for &quot;{query}&quot;
						</div>
					)}
				</div>
			)}
		</div>
	);
}
