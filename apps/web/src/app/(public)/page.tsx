"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { getApiUrl } from "@/lib/api";

export default function LoginPage() {
	const [showSplash, setShowSplash] = useState(true);

	useEffect(() => {
		const timer = setTimeout(() => setShowSplash(false), 2000); // ⏱ duración splash
		return () => clearTimeout(timer);
	}, []);

	const handleLogin = () => {
		window.location.href = `${getApiUrl()}/auth/login`;
	};

	return (
		<div className="relative flex flex-col h-screen overflow-hidden bg-background">
			<AnimatePresence mode="wait">
				{showSplash ? (
					// 🌀 Splash con Lottie grande de fondo
					<motion.div
						key="splash"
						initial={{ opacity: 0, scale: 0.96 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 1.05 }}
						transition={{
							duration: 0.8,
							ease: [0.4, 0, 0.2, 1],
						}}
						className="relative flex flex-col items-center justify-center h-full bg-[#1A2B7A] overflow-hidden"
					>
						{/* 🌊 Lottie enorme detrás del texto */}
						<motion.div
							initial={{ opacity: 0, scale: 0.9 }}
							animate={{ opacity: 0.3, scale: 1 }}
							exit={{ opacity: 0 }}
							transition={{ delay: 0.2, duration: 1.2, ease: "easeOut" }}
							className="absolute inset-0 flex items-center justify-center z-0"
						>
							<div className="relative w-[130vw] h-[130vw] md:w-[100vw] md:h-[100vw] lg:w-[80vw] lg:h-[80vw] max-w-[1400px] max-h-[1400px] opacity-80 scale-[1.2]">
								<iframe
									title="Animated background waves"
									src="https://lottie.host/embed/0ac1cdd8-7838-48e6-8221-372ad52c563c/y02ppYtT2j.lottie"
									className="absolute inset-0 w-full h-full border-none pointer-events-none"
								></iframe>
							</div>
						</motion.div>

						{/* 🔤 Texto principal arriba del Lottie */}
						<motion.h1
							initial={{ opacity: 0, y: 8 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -8 }}
							transition={{ duration: 0.7, ease: "easeInOut" }}
							className="text-white text-5xl md:text-6xl font-bold tracking-tight z-10"
						>
							Convive <span className="text-blue-200 font-light">ITESO</span>
						</motion.h1>
					</motion.div>
				) : (
					// 💻 Pantalla principal
					<motion.main
						key="login"
						initial={{ opacity: 0, y: 30 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{
							delay: 0.2,
							duration: 0.8,
							ease: [0.25, 0.1, 0.25, 1],
						}}
						className="relative flex flex-col justify-between grow py-10 px-6"
					>
						{/* 🎨 Ilustraciones */}
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ delay: 0.4, duration: 0.8 }}
						>
							<Image
								src="/illustrations/illustration4.png"
								alt="People illustration left"
								width={360}
								height={360}
								className="absolute bottom-24 left-2 md:left-12 w-[clamp(22rem,35vw,48rem)] opacity-90 select-none pointer-events-none"
							/>
							<Image
								src="/illustrations/illustration5.png"
								alt="People illustration right"
								width={260}
								height={260}
								className="absolute top-10 right-4 md:right-10 w-[clamp(16rem,35vw,47rem)] opacity-90 select-none pointer-events-none"
							/>
						</motion.div>

						{/* 🌟 Contenido principal */}
						<div className="text-center space-y-10 mt-16 relative z-10">
							<motion.h1
								className="text-6xl font-bold leading-tight text-primary"
								initial={{ opacity: 0, y: 8 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{
									delay: 0.4,
									duration: 0.6,
									ease: "easeOut",
								}}
							>
								Convive <br /> ITESO
							</motion.h1>

							<motion.div
								initial={{ opacity: 0, y: 8 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{
									delay: 0.6,
									duration: 0.6,
									ease: [0.25, 0.1, 0.25, 1],
								}}
							>
								<Button
									size="lg"
									className="px-12 py-6 text-lg rounded-full shadow-lg bg-primary hover:bg-primary/90 transition"
									onClick={handleLogin}
								>
									Sign in with ITESO
								</Button>
							</motion.div>
						</div>

						<footer className="mx-4 p-4 border-t border-gray-200 text-center text-sm text-muted-foreground relative z-10">
							&copy; Convive ITESO — Connecting our campus community
						</footer>
					</motion.main>
				)}
			</AnimatePresence>
		</div>
	);
}
