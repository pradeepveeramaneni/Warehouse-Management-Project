import type {LoaderFunction} from "@remix-run/node"
import {redirect} from "@remix-run/node"
import {Outlet} from "@remix-run/react"
import {getUser} from "~/session.server"

export const loader: LoaderFunction = async ({request}) => {
	const user = await getUser(request)
	if (user) return redirect("/")

	return null
}

export default function AuthLayout() {
	return (
		<>
			<main className="relative flex h-screen items-center justify-center bg-white">
				<div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600">
					<img
						src="https://images.unsplash.com/photo-1587293852726-70cdb56c2866?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2944&q=80"
						alt=""
						className="blur-sm"
					/>
				</div>

				<div className="relative flex w-full max-w-3xl flex-col gap-4 bg-gradient-to-b from-slate-300 via-red-100 to-sky-900 p-6">
					<div className="flex w-full flex-col space-y-2 text-center">
						<h1 className="text-2xl font-semibold tracking-tight">
							Warehouse Wizard
						</h1>
						<p className="text-muted-foreground text-sm">
							Warehousing Solutions
						</p>
					</div>

					<div className="flex items-center">
						<div className="h-full w-1/2">
							<img
								src="https://images.unsplash.com/photo-1587293852726-70cdb56c2866?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2944&q=80"
								alt=""
								className="h-full rounded-lg object-cover shadow-xl"
							/>
						</div>
						<div className="relative w-1/2 p-8">
							<Outlet />
						</div>
					</div>
				</div>
			</main>
		</>
	)
}
