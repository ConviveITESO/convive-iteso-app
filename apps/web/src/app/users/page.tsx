"use client";

import { useCallback, useEffect, useState } from "react";
import AddUserDialog from "@/app/users/_add-user-dialog";
import UserCard from "@/app/users/_user-card";
import { getApiUrl } from "@/lib/api";

interface User {
	id: string;
	name: string;
	email: string;
	age: number;
	birthDate: string;
	createdAt?: string;
	redirectTo?: string;
}

export default function UsersPage() {
	const [users, setUsers] = useState<User[]>([]);
	const [loading, setLoading] = useState(true);

	const fetchUsers = useCallback(async () => {
		try {
			setLoading(true);
			const response = await fetch(`${getApiUrl()}/user`, {
				credentials: "include",
			});
			const data = await response.json();
			if (data.redirectTo) {
				window.location.href = data.redirectTo;
			} else {
				setUsers(data as User[]);
			}
		} catch {
			// Handle error appropriately in production
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchUsers();
	}, [fetchUsers]);

	return (
		<div className="flex flex-col h-screen">
			<header className="p-3 bg-black text-white flex justify-between items-center">
				<h1 className="text-lg font-bold">USERS MANAGEMENT</h1>
				<AddUserDialog onUserAdded={fetchUsers} />
			</header>
			<main className="grow py-4 px-5 mt-10">
				<div className="mx-auto block w-full max-w-100 space-y-10">
					{loading ? (
						<div className="text-center">Loading users...</div>
					) : users.length === 0 ? (
						<div className="text-center text-muted-foreground">
							No users found. Create your first user!
						</div>
					) : (
						users.map((user) => <UserCard key={user.id} {...user} onUserDeleted={fetchUsers} />)
					)}
				</div>
			</main>
			<footer className="mx-4 p-3 border-t border-gray-200 flex items-center justify-center">
				<span className="block">&copy; Prueba para convive ITESO</span>
			</footer>
		</div>
	);
}
