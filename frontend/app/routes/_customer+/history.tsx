import {
	ActionIcon,
	Badge,
	Button,
	CloseButton,
	Group,
	Radio,
	TextInput,
	Tooltip,
} from "@mantine/core"
import {useDisclosure} from "@mantine/hooks"
import {CheckOutStatus} from "@prisma/client"
import type {
	ActionFunctionArgs,
	DataFunctionArgs,
	SerializeFrom,
} from "@remix-run/node"
import {json} from "@remix-run/node"
import {Link, useFetcher, useLoaderData} from "@remix-run/react"
import {DownloadIcon, ExternalLinkIcon} from "lucide-react"
import * as React from "react"
import {toast} from "sonner"
import {CustomDrawer} from "~/components/ui/CustomDrawer"
import {EmptyState} from "~/components/ui/EmptyState"
import {PageHeading} from "~/components/ui/PageHeading"
import {prisma} from "~/lib/db.server"
import {sendMail} from "~/lib/mail.server"
import {requireUser, requireUserId} from "~/session.server"
import {
	checkOutStatusColorLookup,
	checkOutStatusLabelLookup,
	formatDate,
} from "~/utils/misc"

export async function loader({request}: DataFunctionArgs) {
	const userId = await requireUserId(request)

	const requests = await prisma.checkOutRequest.findMany({
		orderBy: {
			CreatedAt: "asc",
		},

		where: {
			userId,
		},
		include: {
			Product: true,
			Files: true,
		},
	})

	return json({
		requests,
	})
}
type FilterStatus = "all" | CheckOutStatus

export async function action({request}: ActionFunctionArgs) {
	const formData = await request.formData()
	const customer = await requireUser(request)

	const requestId = formData.get("requestId")?.toString()

	if (!requestId) {
		return json({
			success: false,
			message: "Request ID is required",
		})
	}

	await prisma.$transaction(async (tx) => {
		const request = await tx.checkOutRequest.findUnique({
			where: {
				Id: requestId,
			},
			include: {
				Product: true,
			},
		})

		if (!request) {
			return json({
				success: false,
				message: "Request not found",
			})
		}

		if (request.Status === CheckOutStatus.CHECKED_OUT) {
			return json({
				success: false,
				message: "Request already processed",
			})
		}

		await tx.checkOutRequest.update({
			where: {
				Id: requestId,
			},
			data: {
				Status: CheckOutStatus.CANCELLED,
				Product: {
					update: {
						Quantity: {
							increment: request.Quantity,
						},
					},
				},
			},
		})

		await sendMail(
			customer.email,
			"Request Cancelled",
			`Your request for ${request.Product.Name} with UPC ${request.Product.UPC} has been cancelled.`
		)
	})

	return json({
		success: true,
		message: "Request cancelled",
	})
}

export default function ProductUPC() {
	const {requests} = useLoaderData<typeof loader>()

	const [queryProduct, setQueryProduct] = React.useState("")
	const [queryUPC, setQueryUPC] = React.useState("")
	const [filter, setFilter] = React.useState<FilterStatus>("all")

	const filteredRequests = React.useMemo(() => {
		let _requests = requests
		const _queryProduct = queryProduct.trim()
		const _queryUPC = queryUPC.trim()

		if (_queryProduct) {
			_requests = _requests.filter((r) => {
				return r.Product.Name.toLowerCase().includes(
					_queryProduct.toLowerCase()
				)
			})
		}

		if (_queryUPC) {
			_requests = _requests.filter((product) => {
				return product.Product.UPC.toLowerCase().includes(
					_queryUPC.toLowerCase()
				)
			})
		}

		if (filter !== "all") {
			_requests = _requests.filter((r) => r.Status === filter)
		}

		return _requests
	}, [requests, queryProduct, queryUPC, filter])

	return (
		<>
			<div className="flex h-full max-w-screen-xl flex-col gap-8 bg-white py-2">
				<div className="mt-6 px-10">
					<PageHeading title="CUSTOMER HISTORY" />
				</div>

				<div className="flex flex-1 flex-col gap-8 rounded-tl-3xl bg-blue-50 px-10 py-8">
					{requests.length > 0 ? (
						<>
							<div className="flex max-w-md items-center gap-4">
								<TextInput
									label="Product"
									value={queryProduct}
									onChange={(e) => setQueryProduct(e.currentTarget.value)}
									placeholder="Search by product"
									rightSectionPointerEvents="all"
									rightSection={
										<CloseButton
											aria-label="Clear input"
											onClick={() => setQueryProduct("")}
											style={{display: queryProduct ? undefined : "none"}}
										/>
									}
								/>

								<TextInput
									label="Search"
									value={queryUPC}
									onChange={(e) => setQueryUPC(e.currentTarget.value)}
									placeholder="Search by UPC"
									rightSectionPointerEvents="all"
									rightSection={
										<CloseButton
											aria-label="Clear input"
											onClick={() => setQueryUPC("")}
											style={{display: queryUPC ? undefined : "none"}}
										/>
									}
								/>
							</div>

							<Radio.Group
								defaultValue="all"
								value={filter}
								onChange={(val) => setFilter(val as FilterStatus)}
							>
								<Group mt="xs">
									<Radio value="all" label="All" />
									<Radio value={CheckOutStatus.PENDING} label="Pending" />
									<Radio value={CheckOutStatus.CHECKED_OUT} label="Processed" />
									<Radio value={CheckOutStatus.CANCELLED} label="Cancelled" />
								</Group>
							</Radio.Group>
						</>
					) : null}

					{filteredRequests.length > 0 ? (
						<div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
							<table className="w-full">
								<thead>
									<tr>
										<th className="px-4 py-2">Tracking ID</th>
										<th className="px-4 py-2">Product</th>
										<th className="px-4 py-2">UPC</th>
										<th className="px-4 py-2">Quantity</th>
										<th className="px-4 py-2">Status</th>
										<th className="px-4 py-2">Created At</th>
										<th className="px-4 py-2">
											<span className="sr-only">Actions</span>
										</th>
									</tr>
								</thead>
								<tbody>
									{filteredRequests.map((request) => (
										<HistoryRow key={request.Id} request={request} />
									))}
								</tbody>
							</table>
						</div>
					) : (
						<EmptyState
							label={
								queryProduct || queryUPC || filter !== "all"
									? "No products found. Try a different search."
									: "No products checked in"
							}
						/>
					)}
				</div>
			</div>
		</>
	)
}

function HistoryRow({
	request,
}: {
	request: SerializeFrom<typeof loader>["requests"][number]
}) {
	const fetcher = useFetcher<typeof action>()
	const isSubmitting = fetcher.state !== "idle"

	const [isDrawerOpen, handleDrawer] = useDisclosure(false)

	React.useEffect(() => {
		if (isSubmitting || !fetcher.data) return

		if (fetcher.data.success) {
			toast.success(fetcher.data.message)
		}
	}, [fetcher.data, isSubmitting])

	return (
		<>
			<tr key={request.Id}>
				<td className="flex items-center justify-between gap-4 border px-4 py-2">
					<Button
						variant="white"
						color="blue"
						size="compact-sm"
						onClick={() => handleDrawer.open()}
					>
						{request.TrackingId}
					</Button>
					<Tooltip
						label="Download shipping label"
						withArrow
						openDelay={300}
						disabled={request.Status === CheckOutStatus.CANCELLED}
					>
						<ActionIcon
							color="blue"
							variant="subtle"
							disabled={
								request.Status === CheckOutStatus.CANCELLED ||
								request.Files.length === 0
							}
							onClick={() => {
								const file = request.Files[0]
								const uint8Array = new Uint8Array(file.Blob.data)
								const fileURL = window.URL.createObjectURL(
									new Blob([uint8Array])
								)

								const link = document.createElement("a")
								link.href = fileURL
								link.download = file.Name
								document.body.appendChild(link)
								link.click()
								document.body.removeChild(link)
							}}
						>
							<DownloadIcon size={18} />
						</ActionIcon>
					</Tooltip>
				</td>
				<td className="border px-4 py-2">{request.Product.Name}</td>
				<td className="border px-4 py-2">
					<Button
						variant="white"
						color="blue"
						size="compact-sm"
						component={Link}
						to={`/upc/${request.Product.UPC}`}
						rightSection={<ExternalLinkIcon size={18} />}
					>
						{request.Product.UPC}
					</Button>
				</td>
				<td className="border px-4 py-2">{request.Quantity}</td>
				<td className="border px-4 py-2 text-center">
					<Badge
						variant="light"
						color={checkOutStatusColorLookup[request.Status]}
						radius="xs"
					>
						{checkOutStatusLabelLookup[request.Status]}
					</Badge>
				</td>
				<td className="border px-4 py-2">{formatDate(request.CreatedAt)}</td>

				<td className="border px-4 py-2">
					{request.Status === CheckOutStatus.PENDING ? (
						<fetcher.Form method="POST">
							<input hidden name="requestId" defaultValue={request.Id} />
							<Button
								variant="light"
								color="red"
								size="compact-sm"
								type="submit"
								loading={isSubmitting}
							>
								Cancel
							</Button>
						</fetcher.Form>
					) : null}
				</td>
			</tr>

			<CustomDrawer
				opened={isDrawerOpen}
				onClose={() => handleDrawer.close()}
				title="Tracking Details"
			>
				<main className="space-y-6 p-4">
					<div className="space-y-2">
						<h3 className="text-sm font-medium">Recent Updates</h3>
						<div className="grid gap-2">
							<div className="flex items-start space-x-2">
								<svg
									className=" h-5 w-5 text-green-500"
									fill="none"
									height="24"
									stroke="currentColor"
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth="2"
									viewBox="0 0 24 24"
									width="24"
									xmlns="http://www.w3.org/2000/svg"
								>
									<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
									<polyline points="22 4 12 14.01 9 11.01" />
								</svg>
								<div className="flex-1 space-y-0.5">
									<p className="text-sm">Delivered</p>
									<time className="text-xs text-zinc-500 dark:text-zinc-400">
										Nov 5, 2023
									</time>
								</div>
							</div>
						</div>
					</div>
					<div className="space-y-2">
						<h3 className="text-sm font-medium">Timeline</h3>
						<div className="grid gap-2">
							<div className="flex items-start space-x-2">
								<svg
									className=" h-5 w-5 text-green-500"
									fill="none"
									height="24"
									stroke="currentColor"
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth="2"
									viewBox="0 0 24 24"
									width="24"
									xmlns="http://www.w3.org/2000/svg"
								>
									<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
									<polyline points="22 4 12 14.01 9 11.01" />
								</svg>
								<div className="flex-1 space-y-0.5">
									<p className="text-sm">Delivered</p>
									<time className="text-xs text-zinc-500 dark:text-zinc-400">
										Nov 5, 2023
									</time>
								</div>
							</div>
							<div className="flex items-start space-x-2">
								<svg
									className=" h-5 w-5 text-blue-500"
									fill="none"
									height="24"
									stroke="currentColor"
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth="2"
									viewBox="0 0 24 24"
									width="24"
									xmlns="http://www.w3.org/2000/svg"
								>
									<path d="M5 18H3c-.6 0-1-.4-1-1V7c0-.6.4-1 1-1h10c.6 0 1 .4 1 1v11" />
									<path d="M14 9h4l4 4v4c0 .6-.4 1-1 1h-2" />
									<circle cx="7" cy="18" r="2" />
									<path d="M15 18H9" />
									<circle cx="17" cy="18" r="2" />
								</svg>
								<div className="flex-1 space-y-0.5">
									<p className="text-sm">Out for delivery</p>
									<time className="text-xs text-zinc-500 dark:text-zinc-400">
										Nov 5, 2023
									</time>
								</div>
							</div>
							<div className="flex items-start space-x-2">
								<svg
									className=" h-5 w-5 text-yellow-500"
									fill="none"
									height="24"
									stroke="currentColor"
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth="2"
									viewBox="0 0 24 24"
									width="24"
									xmlns="http://www.w3.org/2000/svg"
								>
									<path d="m7.5 4.27 9 5.15" />
									<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
									<path d="m3.3 7 8.7 5 8.7-5" />
									<path d="M12 22V12" />
								</svg>
								<div className="flex-1 space-y-0.5">
									<p className="text-sm">Arrived at local facility</p>
									<time className="text-xs text-zinc-500 dark:text-zinc-400">
										Nov 4, 2023
									</time>
								</div>
							</div>
							<div className="flex items-start space-x-2">
								<svg
									className=" h-5 w-5 text-blue-500"
									fill="none"
									height="24"
									stroke="currentColor"
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth="2"
									viewBox="0 0 24 24"
									width="24"
									xmlns="http://www.w3.org/2000/svg"
								>
									<path d="M5 18H3c-.6 0-1-.4-1-1V7c0-.6.4-1 1-1h10c.6 0 1 .4 1 1v11" />
									<path d="M14 9h4l4 4v4c0 .6-.4 1-1 1h-2" />
									<circle cx="7" cy="18" r="2" />
									<path d="M15 18H9" />
									<circle cx="17" cy="18" r="2" />
								</svg>
								<div className="flex-1 space-y-0.5">
									<p className="text-sm">Shipped from facility</p>
									<time className="text-xs text-zinc-500 dark:text-zinc-400">
										Nov 3, 2023
									</time>
								</div>
							</div>
						</div>
					</div>
				</main>
			</CustomDrawer>
		</>
	)
}
