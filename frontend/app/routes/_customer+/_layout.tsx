import type {DataFunctionArgs, SerializeFrom} from "@remix-run/node"
import {json, redirect} from "@remix-run/node"
import {Outlet} from "@remix-run/react"
import {ListIcon, SettingsIcon} from "lucide-react"
import {Nav, type NavMenuItems} from "~/components/Nav"
import {isEmployee, requireUserId} from "~/session.server"

export type CustomerLoaderData = SerializeFrom<typeof loader>
export const loader = async ({request}: DataFunctionArgs) => {
	await requireUserId(request)

	if (await isEmployee(request)) {
		return redirect("/employee")
	}

	return json({})
}

const navMenu: NavMenuItems = [
	{
		items: [
			{
				name: "Inventory",
				href: `/`,
				icon: <SettingsIcon width={18} />,
			},
			{
				name: "History",
				href: `/history`,
				icon: <ListIcon width={18} />,
			},
			{
				name: "Profile",
				href: `/profile`,
				icon: <SettingsIcon width={18} />,
			},
		],
	},
]

export default function AppLayout() {
	return (
		<>
			<Nav menuItems={navMenu} />

			<div className="h-full sm:pl-56">
				<Outlet />
			</div>
		</>
	)
}
