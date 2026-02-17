import Image from "next/image";
import Link from "next/link";
import { IconLocation, IconStar } from "@/components/icons";

type DoctorCardProps = {
	name: string;
	specialty: string;
	rating: number;
	distanceLabel: string;
	avatarUrl: string;
	href?: string;
	onClick?: () => void;
};

export function DoctorCard({ name, specialty, rating, distanceLabel, avatarUrl, href, onClick }: DoctorCardProps) {
	const cardContent = (
		<div className={`rounded-2xl border bg-white p-4 shadow-sm ${href || onClick ? 'hover:shadow-md transition-shadow cursor-pointer' : ''}`}>
			<div className="flex items-center gap-3">
				<div className="h-12 w-12 overflow-hidden rounded-full">
					<Image src={avatarUrl} alt={name} width={48} height={48} className="h-full w-full object-cover" />
				</div>
				<div className="min-w-0">
					<p className="truncate text-sm font-semibold text-slate-900">{name}</p>
					<p className="truncate text-xs text-slate-500">{specialty}</p>
				</div>
			</div>
			<div className="mt-3 flex items-center justify-between text-xs text-slate-600">
				<div className="flex items-center gap-1">
					<IconStar className="h-4 w-4 text-amber-500" />
					<span>{rating.toFixed(1)}</span>
				</div>
				<div className="flex items-center gap-1">
					<IconLocation className="h-4 w-4" />
					<span>{distanceLabel}</span>
				</div>
			</div>
		</div>
	);

	if (href) {
		return <Link href={href}>{cardContent}</Link>;
	}

	if (onClick) {
		return <div onClick={onClick}>{cardContent}</div>;
	}

	return cardContent;
}



