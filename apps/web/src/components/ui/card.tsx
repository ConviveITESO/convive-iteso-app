import type * as React from "react";
import { cn } from "@/lib/utils";

type DivCardProps = {
	as?: "div";
} & React.HTMLAttributes<HTMLDivElement>;

type ButtonCardProps = {
	as: "button";
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

type CardProps = DivCardProps | ButtonCardProps;

function Card({ className, as = "div", ...props }: CardProps) {
	if (as === "button") {
		const buttonProps = props as React.ButtonHTMLAttributes<HTMLButtonElement>;
		return (
			<button
				data-slot="card"
				className={cn(
					"bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm",
					className,
				)}
				{...buttonProps}
			/>
		);
	}

	const divProps = props as React.HTMLAttributes<HTMLDivElement>;

	return (
		<div
			data-slot="card"
			className={cn(
				"bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm",
				className,
			)}
			{...divProps}
		/>
	);
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="card-header"
			className={cn(
				"@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
				className,
			)}
			{...props}
		/>
	);
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="card-title"
			className={cn("leading-none font-semibold", className)}
			{...props}
		/>
	);
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="card-description"
			className={cn("text-muted-foreground text-sm", className)}
			{...props}
		/>
	);
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="card-action"
			className={cn("col-start-2 row-span-2 row-start-1 self-start justify-self-end", className)}
			{...props}
		/>
	);
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
	return <div data-slot="card-content" className={cn("px-6", className)} {...props} />;
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="card-footer"
			className={cn("flex items-center px-6 [.border-t]:pt-6", className)}
			{...props}
		/>
	);
}

export { Card, CardHeader, CardFooter, CardTitle, CardAction, CardDescription, CardContent };
