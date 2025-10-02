"use client";

import { ArrowLeft, Home, LogOut, Menu, SettingsIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function AppHeader() {
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [showBackButton, setShowBackButton] = useState(false);
	const [pageTitle, setPageTitle] = useState("Event Name");

	const toggleMenu = () => {
		setIsMenuOpen(!isMenuOpen);
	};

	const handleBack = () => {
		setShowBackButton(false);
		setPageTitle("Event Name");
	};

	/* const navigateTo = (title: string) => {
        setPageTitle(title);
        setShowBackButton(true);
        setIsMenuOpen(false);
    }; */

	return (
		<>
			<div className="px-2">
				<div
					className="bg-primary rounded-b-4xl"
					style={{ boxShadow: "0px 2px 8px 0px rgba(99, 99, 99, 0.2)" }}
				>
					<div className="flex items-center justify-between">
						{/* Botón de menú/back */}
						<Button
							variant="ghost"
							size="icon"
							onClick={showBackButton ? handleBack : toggleMenu}
							className="hover:bg-white/20 text-white h-14 w-14 rounded-full text-4xl"
						>
							{showBackButton ? (
								<ArrowLeft className="h-12 w-12" />
							) : (
								<Menu className="h-12 w-12 " />
							)}
						</Button>

						<h1 className="text-white text-xl font-bold">{pageTitle}</h1>

						<div className="w-10"></div>
					</div>
				</div>
			</div>
			{isMenuOpen && (
				<button
					type="button"
					aria-label="Cerrar menú"
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
				className={`fixed top-0 left-0 h-full bg-background shadow-2xl z-50 transition-transform duration-300 ease-in-out rounded-br-4xl ${
					isMenuOpen ? "translate-x-0" : "-translate-x-full"
				}`}
				style={{ width: "80%", maxWidth: "320px" }}
			>
				<div className="px-12 py-6">
					<h1 className="text-black text-xl font-bold">Menu</h1>
				</div>
				<div className="px-4">
					<div
						className="flex py-2 px-4 my-2 rounded-2xl transition duration-200 ease-in-out hover:scale-110 hover:bg-primary"
						style={{ boxShadow: "0px 2px 8px 0px rgba(99, 99, 99, 0.2)" }}
					>
						<Home className="mr-2" /> Home
					</div>
					<div
						className="flex py-2 px-4 my-2 rounded-2xl transition duration-200 ease-in-out hover:scale-110 hover:bg-primary"
						style={{ boxShadow: "0px 2px 8px 0px rgba(99, 99, 99, 0.2)" }}
					>
						<SettingsIcon className="mr-2" /> Settings
					</div>
				</div>

				{/* MENU FOOTER */}
				<div className="absolute bottom-0 left-0 right-0 px-4 py-6 border-t">
					<Button variant="secondary" size="sm" className="rounded-2xl font-medium">
						<LogOut /> Cerrar Sesion
					</Button>
				</div>
			</div>
		</>
	);
}
