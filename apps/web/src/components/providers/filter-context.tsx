"use client";

import type React from "react";
import { createContext, useContext, useState } from "react";

// 🧩 Estado base del filtro
export interface FiltersState {
	searchQuery: string;
	selectedCategories: string[];
	singleCategory: string | null;
	locationId: string | null;
	dateRange: { from?: Date; to?: Date };
}

// 🧠 Tipo del contexto
interface FiltersContextType {
	filters: FiltersState;
	setFilters: React.Dispatch<React.SetStateAction<FiltersState>>;
	clearFilters: () => void;
	updateFilter: <K extends keyof FiltersState>(key: K, value: FiltersState[K]) => void;
}

// 🏗️ Creación del contexto
const FiltersContext = createContext<FiltersContextType | undefined>(undefined);

// 🌍 Provider global
export function FiltersProvider({ children }: { children: React.ReactNode }) {
	const [filters, setFilters] = useState<FiltersState>({
		searchQuery: "",
		selectedCategories: [],
		singleCategory: null,
		locationId: null,
		dateRange: {},
	});

	const clearFilters = () =>
		setFilters({
			searchQuery: "",
			selectedCategories: [],
			singleCategory: null,
			locationId: null,
			dateRange: {},
		});

	const updateFilter = <K extends keyof FiltersState>(key: K, value: FiltersState[K]) =>
		setFilters((prev) => ({ ...prev, [key]: value }));

	return (
		<FiltersContext.Provider value={{ filters, setFilters, clearFilters, updateFilter }}>
			{children}
		</FiltersContext.Provider>
	);
}

// 🧩 Hook para usar el contexto
export function useFilters() {
	const context = useContext(FiltersContext);
	if (!context) {
		throw new Error("useFilters must be used within a FiltersProvider");
	}
	return context;
}
