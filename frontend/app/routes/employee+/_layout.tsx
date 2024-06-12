import type {DataFunctionArgs, SerializeFrom} from "@remix-run/node"
import {json, redirect} from "@remix-run/node"
import {Outlet} from "@remix-run/react"
import {
	CheckSquareIcon,
	FilesIcon,
	ReceiptIcon,
	SettingsIcon,
} from "lucide-react"
import {Nav, type NavMenuItems} from "~/components/Nav"
import {isCustomer, requireUserId} from "~/session.server"

export type OwnerLoaderData = SerializeFrom<typeof loader>
export const loader = async ({request}: DataFunctionArgs) => {
	await requireUserId(request)

	if (await isCustomer(request)) {
		return redirect("/")
	}

	return json({})
}

const navMenu: NavMenuItems = [
	{
		items: [
			{
				name: "Inventory",
				href: `/employee`,
				icon: <FilesIcon width={18} />,
			},
			{
				name: "Check In",
				href: `/employee/check-in`,
				icon: <CheckSquareIcon width={18} />,
			},
			{
				name: "Request",
				href: `/employee/request`,
				icon: <ReceiptIcon width={18} />,
			},
			{
				name: "Profile",
				href: `/employee/profile`,
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
