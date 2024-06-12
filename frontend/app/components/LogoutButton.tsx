import {Form} from "@remix-run/react"
import {LogOutIcon} from "lucide-react"

export function LogoutButton() {
	return (
		<Form method="post" action="/api/auth/logout">
			<button
				type="submit"
				className="rounded-lg p-1.5 text-black transition-all duration-150 ease-in-out hover:bg-stone-200 active:bg-stone-300"
			>
				<LogOutIcon width={18} />
			</button>
		</Form>
	)
}
