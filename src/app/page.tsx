import Image from "next/image";
import Link from "next/link";
import { IconAmbulance, IconBell, IconHospital, IconPill, IconSearch, IconStethoscope } from "@/components/icons";
import { DoctorCard } from "@/components/doctor-card";

const categories = [
	{ icon: IconStethoscope, label: "Doctor" },
	{ icon: IconPill, label: "Pharmacy" },
	{ icon: IconHospital, label: "Hospital" },
	{ icon: IconAmbulance, label: "Ambulance" }
];

const doctors = [
	{
		name: "Dr. Marcus Horizon",
		specialty: "Cardiologist",
		rating: 4.7,
		distanceLabel: "800m away",
		avatarUrl: "https://images.unsplash.com/photo-1550831107-1553da8c8464?q=80&w=256&auto=format&fit=crop"
	},
	{
		name: "Dr. Maria Elena",
		specialty: "Psychologist",
		rating: 4.9,
		distanceLabel: "1.5km away",
		avatarUrl: "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?q=80&w=256&auto=format&fit=crop"
	},
	{
		name: "Dr. Stevi Jessica",
		specialty: "Orthopedist",
		rating: 4.8,
		distanceLabel: "2km away",
		avatarUrl: "https://images.unsplash.com/photo-1544006659-f0b21884ce1d?q=80&w=256&auto=format&fit=crop"
	}
];

export default function HomePage() {
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
				<div className="mt-4 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-100 md:max-w-xl">
					<div className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2">
						<IconSearch className="h-5 w-5 text-slate-500" />
						<input placeholder="Search doctor, drugs, articles..." className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400" />
					</div>
				</div>

				{/* Categories */}
				<div className="mt-5 grid grid-cols-4 gap-3 md:gap-4 lg:gap-6 md:max-w-2xl">
					{categories.map(({ icon: Icon, label }) => (
						<button key={label} className="flex flex-col items-center gap-2 rounded-2xl bg-white p-4 lg:p-5 text-slate-700 shadow-sm ring-1 ring-slate-100">
							<Icon className="h-6 w-6" />
							<span className="text-xs">{label}</span>
						</button>
					))}
				</div>

				{/* Banner */}
				<div className="mt-5 grid grid-cols-[1fr_auto] items-center gap-4 rounded-2xl bg-white p-4 md:p-6 ring-1 ring-slate-100 md:max-w-3xl lg:max-w-none">
					<div className="flex-1">
						<p className="text-base md:text-lg lg:text-xl font-semibold text-slate-900">Early protection for your family health</p>
						<Link href="#" className="mt-3 inline-flex rounded-full bg-slate-900 px-4 py-2 text-xs md:text-sm font-medium text-white">Learn more</Link>
					</div>
					<div className="relative h-24 w-24 md:h-28 md:w-28 lg:h-32 lg:w-32 overflow-hidden rounded-full bg-slate-100">
						<Image src="https://images.unsplash.com/photo-1537368910025-700350fe46c7?q=80&w=256&auto=format&fit=crop" alt="doctor" fill className="object-cover" />
					</div>
				</div>

				{/* Top Doctor */}
				<div className="mt-6 flex items-center justify-between">
					<h2 className="text-base font-semibold text-slate-900">Top Doctor</h2>
					<Link href="#" className="text-xs text-slate-500 hover:underline">See all</Link>
				</div>
				{/* Mobile: horizontal scroll */}
				<div className="mt-3 grid grid-flow-col auto-cols-[72%] gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none] md:hidden">
					{doctors.map((d) => (
						<DoctorCard key={d.name} {...d} />
					))}
				</div>
				{/* Desktop: grid */}
				<div className="mt-3 hidden md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
					{doctors.map((d) => (
						<DoctorCard key={d.name} {...d} />
					))}
				</div>

				{/* Health article stub */}
				<div className="mt-6 flex items-center justify-between">
					<h2 className="text-base font-semibold text-slate-900">Health article</h2>
					<Link href="#" className="text-xs text-slate-500 hover:underline">See all</Link>
				</div>
				<div className="mt-3 h-28 md:h-36 rounded-2xl bg-white ring-1 ring-slate-100" />
			</section>
		</main>
	);
}


