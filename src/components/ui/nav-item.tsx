"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

interface NavItemProps {
	href: string;
	icon: React.ReactNode;
	label: string;
	isOpen?: boolean;
	active?: boolean;
	onClick?: () => void;
}

export function NavItem({ href, icon, label, isOpen = true, active = false, onClick }: NavItemProps) {
	const content = (
		<Link
			href={href}
			className={cn(
				"flex items-center py-3 px-4 rounded-lg transition-colors duration-200",
				"hover:bg-[#1f1f6f] focus:outline-none focus:ring-2 focus:ring-white/50",
				active ? "bg-[#1f1f6f]" : "transparent"
			)}
			onClick={onClick}>
			<span className="text-white">{icon}</span>
			{isOpen && <span className="ml-3 text-white transition-opacity duration-200">{label}</span>}
		</Link>
	);

	return <li className="mb-1">{content}</li>;
}
