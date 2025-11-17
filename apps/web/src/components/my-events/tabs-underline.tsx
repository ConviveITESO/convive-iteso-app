"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TabsUnderlineProps {
	tabs: {
		id: string;
		label: string;
		icon?: React.ReactNode;
		count?: number;
	}[];
	active: string;
	onChange: (value: string) => void;
}

export function TabsUnderline({ tabs, active, onChange }: TabsUnderlineProps) {
	return (
		<div className="relative w-full">
			<div className="flex border-b">
				{tabs.map((tab) => {
					const isActive = tab.id === active;

					return (
						<button
							type="button"
							key={tab.id}
							onClick={() => onChange(tab.id)}
							className={cn(
								"relative flex-1 flex items-center justify-center gap-2 px-4 py-3 text-md transition-colors",
								isActive
									? "text-foreground font-semibold"
									: "text-muted-foreground hover:text-foreground",
							)}
						>
							{/* Icono */}
							{tab.icon && (
								<span className={cn(isActive ? "text-primary" : "text-muted-foreground")}>
									{tab.icon}
								</span>
							)}

							{/* Texto */}
							<span>{tab.label}</span>

							{/* Contador */}
							{tab.count !== undefined && tab.count > 0 && (
								<span
									className={cn(
										"px-2.5 py-0.5 rounded-sm text-xs font-bold",
										isActive
											? "bg-primary text-primary-foreground"
											: "bg-muted text-muted-foreground",
									)}
								>
									{tab.count}
								</span>
							)}

							{/* Underline animado */}
							{isActive && (
								<motion.div
									layoutId="underline"
									transition={{
										type: "spring",
										stiffness: 350,
										damping: 26,
									}}
									className="absolute bottom-0 left-0 right-0 h-[3px] bg-primary rounded-full"
								/>
							)}
						</button>
					);
				})}
			</div>
		</div>
	);
}
