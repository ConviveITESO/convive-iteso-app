"use client";

import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from "react";

type HeaderTitleContextValue = {
	title: string;
	setTitle: (title: string) => void;
	showBackButton: boolean;
	setShowBackButton: (show: boolean) => void;
	backHref?: string;
	setBackHref: (href?: string) => void;
};

type HeaderOptions = {
	showBackButton?: boolean;
	backHref?: string;
};

export const DEFAULT_HEADER_TITLE = "Convive ITESO";

const HeaderTitleContext = createContext<HeaderTitleContextValue | undefined>(undefined);

export function HeaderTitleProvider({ children }: { children: ReactNode }) {
	const [title, setTitle] = useState(DEFAULT_HEADER_TITLE);
	const [showBackButton, setShowBackButton] = useState(false);
	const [backHref, setBackHref] = useState<string | undefined>(undefined);
	const value = useMemo(
		() => ({ title, setTitle, showBackButton, setShowBackButton, backHref, setBackHref }),
		[title, showBackButton, backHref],
	);

	return <HeaderTitleContext.Provider value={value}>{children}</HeaderTitleContext.Provider>;
}

export function useHeaderTitleContext() {
	const context = useContext(HeaderTitleContext);
	if (!context) {
		throw new Error("useHeaderTitleContext must be used within a HeaderTitleProvider");
	}
	return context;
}

export function useHeaderTitle(title: string, options?: HeaderOptions) {
	const { setTitle, setShowBackButton, setBackHref } = useHeaderTitleContext();
	const showBack = options?.showBackButton ?? false;
	const backHref = options?.backHref;

	useEffect(() => {
		setTitle(title);
	}, [setTitle, title]);

	useEffect(() => {
		setShowBackButton(showBack);
		setBackHref(backHref);
		return () => {
			setShowBackButton(false);
			setBackHref(undefined);
		};
	}, [showBack, backHref, setShowBackButton, setBackHref]);
}

export function useHeaderTitleSetter() {
	return useHeaderTitleContext().setTitle;
}

export function HeaderTitle({
	title,
	showBackButton,
	backHref,
}: {
	title: string;
	showBackButton?: boolean;
	backHref?: string;
}) {
	useHeaderTitle(title, { showBackButton, backHref });
	return null;
}
