"use client";

import { Button } from "@/components/ui/button";
import { getApiUrl } from "@/lib/api";

export default function LoginPage() {
	const handleLogin = async () => {
		try {
			window.location.href = `${getApiUrl()}/auth/login`;
		} catch {}
	};

	return (
		<div className="flex flex-col h-screen">
			<main className="grow py-4 px-5 mt-10 space-y-10">
				<h1 className="text-6xl font-bold">
					Convive <br></br>ITESO
				</h1>
				<Button className="px-19" onClick={handleLogin}>
					Sign In with ITESO
				</Button>
			</main>
			<footer className="mx-4 p-3 border-t border-gray-200 flex items-center justify-center">
				<span className="block">&copy; Prueba para convive ITESO</span>
			</footer>
		</div>
	);
}
