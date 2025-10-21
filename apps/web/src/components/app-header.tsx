"use client";

import {
	ArrowLeft,
	Bell,
	Calendar,
	CalendarCheck,
	Home,
	LogOut,
	Menu,
	SettingsIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useHeaderTitleContext } from "@/hooks/use-header-title";

export default function AppHeader() {
	const router = useRouter();
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const { title, showBackButton, backHref } = useHeaderTitleContext();

	useEffect(() => {
		if (showBackButton) {
			setIsMenuOpen(false);
		}
	}, [showBackButton]);

	const toggleMenu = () => {
		setIsMenuOpen(!isMenuOpen);
	};

	const handleBack = () => {
		if (backHref) {
			router.push(backHref);
		} else {
			router.back();
		}
	};

	const navigateTo = (route: string) => {
		router.push(route);
		setIsMenuOpen(false);
	};

	const Routes = [
		{ href: "/feed", label: "Feed", icon: Home },
		{ href: "/my-events", label: "My Events", icon: CalendarCheck },
		{ href: "/manage-events", label: "Manage Events", icon: Calendar },
		{ href: "/settings", label: "Settings", icon: SettingsIcon },
	];

	return (
		<>
			<div className="px-2">
				<div
					className="bg-primary rounded-b-4xl"
					style={{ boxShadow: "0px 2px 8px 0px rgba(99, 99, 99, 0.2)" }}
				>
					<div className="flex items-center justify-between">
						{/* menu button/back */}
						{showBackButton ? (
							<Button
								variant="ghost"
								size="icon"
								onClick={handleBack}
								className="hover:bg-white/20 text-white h-14 w-14 rounded-full text-4xl cursor-pointer hover:text-white"
							>
								<ArrowLeft className="h-12 w-12" />
							</Button>
						) : (
							<div className="h-14 w-14" />
						)}

						<h1 className="flex-1 text-white text-xl font-bold text-center truncate px-2">
							{title}
						</h1>

						<div className="flex items-center -space-x-2">
							<Button
								variant="ghost"
								size="icon"
								onClick={() => router.push("/notifications")}
								className="hover:bg-white/20 text-white h-12 w-12 rounded-full cursor-pointer hover:text-white"
							>
								<Bell className="h-5 w-5" />
							</Button>

							<Button
								variant="ghost"
								size="icon"
								onClick={toggleMenu}
								className="hover:bg-white/20 text-white h-12 w-12 rounded-full cursor-pointer hover:text-white"
							>
								<Menu className="h-5 w-5" />
							</Button>
						</div>
					</div>
				</div>
			</div>
			{isMenuOpen && (
				<button
					type="button"
					aria-label="Close menu"
					className="fixed inset-0 z-40 bg-black/50 transition-opacity
               p-0 m-0 border-0 appearance-none cursor-pointer
               focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
					onClick={toggleMenu}
					onKeyDown={(e) => {
						if (e.key === "Escape") {
							e.preventDefault();
							toggleMenu();
						}
					}}
				/>
			)}
			<div
				className={`fixed top-0 right-0 h-full bg-background shadow-2xl z-50 transition-transform duration-300 ease-in-out rounded-bl-4xl ${
					isMenuOpen ? "translate-x-0" : "translate-x-full"
				}`}
				style={{ width: "80%", maxWidth: "320px" }}
			>
				<div className="px-12 py-6">
					<h1 className="text-black text-xl font-bold">Menu</h1>
				</div>
				<div className="px-4">
					{Routes.map(({ href, label, icon: Icon }) => (
						<button
							key={href}
							type="button"
							onClick={() => navigateTo(href)}
							className="flex w-full items-center py-2 px-4 my-2 rounded-2xl transition duration-200 ease-in-out hover:scale-110 hover:bg-primary hover:text-primary-foreground cursor-pointer"
							style={{ boxShadow: "0px 2px 8px 0px rgba(99, 99, 99, 0.2)" }}
						>
							<Icon className="mr-2" />
							{label}
						</button>
					))}
				</div>

				{/* MENU FOOTER */}
				<div className="absolute bottom-0 left-0 right-0 px-4 py-6 border-t">
					<Button variant="secondary" size="sm" className="rounded-2xl font-medium">
						<LogOut /> Logout
					</Button>
				</div>
			</div>
		</>
	);
}
