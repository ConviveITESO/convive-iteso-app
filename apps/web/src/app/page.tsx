"use client";

import type { SelectTodoSchema } from "@repo/schemas";
import { useCallback, useEffect, useState } from "react";
import AddTodoDialog from "@/components/add-todo-dialog";
import TodoCard from "@/components/todo-card";
import { getApiUrl } from "@/lib/api";
import AppHeader from "@/components/app-header";

export default function Home() {
	const [todos, setTodos] = useState<SelectTodoSchema[]>([]);
	const [loading, setLoading] = useState(true);

	const fetchTodos = useCallback(async () => {
		try {
			setLoading(true);
			const response = await fetch(`${getApiUrl()}/todos`);
			const data = (await response.json()) as SelectTodoSchema[];
			setTodos(data);
		} catch (error) {
			console.error("Error fetching todos:", error);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchTodos();
	}, [fetchTodos]);

	return (
		<div className="flex flex-col h-screen">
			<AppHeader />
			<main className="grow py-4 px-5 mt-10">
				<div className="mx-auto block w-full max-w-100 space-y-10">
					{loading ? (
						<div className="text-center">Loading todos...</div>
					) : todos.length === 0 ? (
						<div className="text-center text-muted-foreground">
							No todos found. Create your first todo!
						</div>
					) : (
						todos.map((todo) => <TodoCard key={todo.id} {...todo} onTodoUpdated={fetchTodos} />)
					)}
				</div>
			</main>
			<footer className="mx-4 p-3 border-t border-gray-200 flex items-center justify-center">
				<span className="block">&copy; Prueba para convive ITESO</span>
			</footer>
		</div>
	);
}
