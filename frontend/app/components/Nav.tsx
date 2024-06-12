import {Avatar, Divider, ScrollArea, Tooltip} from "@mantine/core"
import {NavLink, useLocation} from "@remix-run/react"
import {Menu} from "lucide-react"
import * as React from "react"
import {useEffect, useState, type ReactNode} from "react"
import {LogoutButton} from "~/components/LogoutButton"
import {useUser} from "~/utils/hooks"
import {cn, getInitials} from "~/utils/misc"

export type NavMenuItem = {
	title?: string
	items: {
		name: string
		href: string
		icon: ReactNode
	}[]
}

export type NavMenuItems = NavMenuItem[]

type NavProps = {
	menuItems: NavMenuItems
}

export function Nav(props: NavProps) {
	const {menuItems} = props
	const [showSidebar, setShowSidebar] = useState(false)

	const user = useUser()
	const location = useLocation()

	useEffect(() => {
		setShowSidebar(false)
	}, [location.pathname])

	return (
		<>
			<button
				className={cn("fixed z-20 sm:hidden", showSidebar && "right-7 top-7")}
				onClick={() => setShowSidebar(!showSidebar)}
			>
				<Menu width={20} />
			</button>

			<div
				className={cn(
					"fixed z-10 flex h-full w-full transform flex-col gap-4 transition-all sm:w-56 sm:translate-x-0",
					showSidebar ? "translate-x-0" : "-translate-x-full"
				)}
			>
				<div className="relative flex h-full flex-col gap-8 bg-white p-4">
					<img src="/logo.png" alt="" className="mx-auto h-12 w-12" />

					<div className="flex w-full items-center justify-between">
						<div className="flex w-full flex-1 flex-col rounded-lg px-2 py-1">
							<div className="flex justify-between">
								<Avatar
									src={undefined}
									alt={`${user.name}'s avatar`}
									radius="xl"
									color="blue"
									size="lg"
								>
									{getInitials(user.name)}
								</Avatar>

								<Tooltip label="Logout" withArrow>
									<div>
										<LogoutButton />
									</div>
								</Tooltip>
							</div>
							<p className="mt-4 truncate text-sm font-medium">{user.name}</p>
							<p className="truncate text-xs text-gray-500">{user.email}</p>
						</div>
					</div>

					<ScrollArea classNames={{root: "flex-1"}}>
						<div className="flex flex-col gap-4">
							{menuItems.map(({title, items}, idx) => {
								const showDivider = idx !== menuItems.length - 1

								return (
									<React.Fragment key={idx}>
										<div className="flex flex-col gap-1">
											{title && (
												<p className="text-xss font-semibold uppercase text-black">
													{title}
												</p>
											)}

											<div className="flex flex-col gap-1">
												{items.map(({name, href, icon}) => (
													<NavLink
														key={name}
														to={href}
														end
														prefetch="intent"
														className={({isActive}) =>
															cn(
																"relative flex items-center space-x-3 rounded-lg  py-1.5 pl-3 pr-2 text-gray-400 transition-all duration-150 ease-in-out  hover:text-black",
																isActive && "font-bold text-black"
															)
														}
													>
														{({isActive}) => (
															<>
																<div
																	className={cn(
																		"absolute h-1 w-4 bg-orange-500",
																		"left-0 top-1/2 -translate-y-1/2 transform",
																		isActive || "hidden"
																	)}
																></div>
																{icon}
																<span
																	className={cn(
																		"text-sm font-medium",
																		isActive && "font-bold"
																	)}
																>
																	{name}
																</span>
															</>
														)}
													</NavLink>
												))}
											</div>
										</div>

										{showDivider && <Divider />}
									</React.Fragment>
								)
							})}
						</div>
					</ScrollArea>

					<div></div>
				</div>
			</div>
		</>
	)
}
