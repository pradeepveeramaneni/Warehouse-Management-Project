import {
	Badge,
	Button,
	CloseButton,
	Divider,
	Group,
	Modal,
	Radio,
	Select,
	TextInput,
} from "@mantine/core"
import {useDisclosure} from "@mantine/hooks"
import {CheckOutStatus} from "@prisma/client"
import type {DataFunctionArgs, SerializeFrom} from "@remix-run/node"
import {json} from "@remix-run/node"
import {useFetcher, useLoaderData} from "@remix-run/react"
import * as React from "react"
import {EmptyState} from "~/components/EmptyState"
import {PageHeading} from "~/components/ui/PageHeading"
import {prisma} from "~/lib/db.server"
import {sendMail} from "~/lib/mail.server"
import {getAllCustomers} from "~/lib/user.server"
import {
	checkOutStatusColorLookup,
	checkOutStatusLabelLookup,
	cn,
} from "~/utils/misc"

export async function loader() {
	const customers = await getAllCustomers()
	const requests = await prisma.checkOutRequest.findMany({
		orderBy: {
			UpdatedAt: "desc",
		},
		include: {
			user: true,
			Product: true,
			Files: true,
		},
	})

	return json({
		customers,
		requests: requests.map((request) => ({
			...request,
			Files: request.Files.map((file) => ({
				...file,
				Blob: Buffer.from(file.Blob).toString("base64"),
			})),
		})),
	})
}

type ActionData = {
	success: boolean
	fieldErrors?: Record<string, string>
}

export async function action({request}: DataFunctionArgs) {
	const formData = await request.formData()

	const requestId = formData.get("requestId")?.toString()

	if (!requestId) {
		return json<ActionData>({
			success: false,
			fieldErrors: {
				productId: "Request ID is required",
			},
		})
	}

	const intent = formData.get("intent")?.toString()

	if (intent === "approve") {
		await prisma.$transaction(async (tx) => {
			const request = await tx.checkOutRequest.update({
				where: {
					Id: requestId,
				},
				data: {
					Status: CheckOutStatus.CHECKED_OUT,
				},
				include: {
					Product: true,
					user: true,
				},
			})

			await sendMail(
				request.user.Email,
				"Your order has been shipped",
				`Your order for ${request.Product.Name} has been shipped. Tracking ID: ${request.TrackingId}`
			)
		})

		return json<ActionData>({
			success: true,
		})
	}

	return json<ActionData>({
		success: true,
	})
}

type FilterStatus = "all" | CheckOutStatus

export default function OwnerRequest() {
	const {requests, customers} = useLoaderData<typeof loader>()

	const [filter, setFilter] = React.useState<FilterStatus>("all")
	const [queryProduct, setQueryProduct] = React.useState("")
	const [queryTrackingId, setQueryTrackingId] = React.useState("")
	const [customerId, setCustomerId] = React.useState<
		(typeof customers)[number]["Id"] | null
	>(null)

	const filteredRequests = React.useMemo(() => {
		let _products = requests
		const _queryProduct = queryProduct.trim()

		const _queryTrackingId = queryTrackingId.trim()
		if (_queryProduct) {
			_products = _products.filter((request) => {
				return request.Product.Name.toLowerCase().includes(
					_queryProduct.toLowerCase()
				)
			})
		}

		if (customerId) {
			_products = _products.filter((request) => {
				return request.userId === customerId
			})
		}

		if (_queryTrackingId) {
			_products = _products.filter((request) => {
				return request.TrackingId?.toLowerCase().includes(
					_queryTrackingId.toLowerCase()
				)
			})
		}

		_products = _products.filter((request) => {
			return filter === "all" ? true : request.Status === filter
		})

		return _products
	}, [requests, queryProduct, customerId, queryTrackingId, filter])

	return (
		<>
			<div className="flex h-full max-w-screen-xl flex-col gap-8 bg-white py-2">
				<div className="mt-6 px-10">
					<PageHeading title="REQUEST" />
				</div>

				<div className="flex flex-1 flex-col gap-8 rounded-tl-3xl bg-blue-50 px-10 py-8">
					<div className="flex max-w-lg items-center gap-4">
						<TextInput
							label="Tracking ID"
							value={queryTrackingId}
							onChange={(e) => setQueryTrackingId(e.currentTarget.value)}
							placeholder="Search by Tracking ID"
							rightSectionPointerEvents="all"
							rightSection={
								<CloseButton
									aria-label="Clear input"
									onClick={() => setQueryTrackingId("")}
									style={{display: queryTrackingId ? undefined : "none"}}
								/>
							}
						/>

						<TextInput
							label="Product"
							value={queryProduct}
							onChange={(e) => setQueryProduct(e.currentTarget.value)}
							placeholder="Search by Product"
							rightSectionPointerEvents="all"
							rightSection={
								<CloseButton
									aria-label="Clear input"
									onClick={() => setQueryProduct("")}
									style={{display: queryProduct ? undefined : "none"}}
								/>
							}
						/>

						<Select
							label="Customer"
							value={customerId}
							onChange={setCustomerId}
							placeholder="Select a customer"
							clearable
							data={customers.map((customer) => ({
								value: customer.Id,
								label: customer.Name,
							}))}
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
						</Group>
					</Radio.Group>

					{filteredRequests.length > 0 ? (
						<div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
							<table className="w-full">
								<thead>
									<tr>
										<th className="px-4 py-2">Customer Name</th>
										<th className="px-4 py-2">Product</th>
										<th className="px-4 py-2">Quantity</th>
										<th className="px-4 py-2">Status</th>
										<th className="px-4 py-2">Details</th>
										<th className="px-4 py-2">Created At</th>
										<th className="px-4 py-2"></th>
									</tr>
								</thead>
								<tbody>
									{filteredRequests.map((request) => (
										<RequestRow key={request.Id} request={request} />
									))}
								</tbody>
							</table>
						</div>
					) : (
						<EmptyState
							message={
								filter === "all"
									? "No requests found"
									: "No requests found with this filter"
							}
						/>
					)}
				</div>
			</div>
		</>
	)
}

function RequestRow({
	request,
}: {
	request: SerializeFrom<typeof loader>["requests"][0]
}) {
	const fetcher = useFetcher<ActionData>()
	const isSubmitting = fetcher.state !== "idle"

	const [isModalOpen, handleModal] = useDisclosure(false)

	let blobUrl: string | null = null
	if (request.Files.length > 0) {
		blobUrl = `data:${request.Files?.[0].ContentType};base64,${request.Files?.[0].Blob}`
	}

	return (
		<>
			<tr>
				<td className="border px-4 py-2">{request.user.Name}</td>
				<td className="border px-4 py-2">{request.Product.Name}</td>
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
				<td className="border px-4 py-2">
					<button
						className="focus:none text-sm text-blue-700 hover:underline"
						onClick={handleModal.open}
					>
						Check
					</button>
				</td>
				<td className="border px-4 py-2">
					{new Date(request.CreatedAt).toLocaleString()}
				</td>
				<td className="border px-4 py-2">
					{request.Status === CheckOutStatus.PENDING && (
						<>
							<fetcher.Form method="POST" className="flex items-center gap-4">
								<input hidden name="requestId" defaultValue={request.Id} />
								<input
									hidden
									name="productId"
									defaultValue={request.ProductId}
								/>
								<Button
									size="compact-sm"
									type="submit"
									variant="white"
									name="intent"
									value="approve"
									color="green"
									loading={isSubmitting}
								>
									Approve
								</Button>
							</fetcher.Form>
						</>
					)}
				</td>
			</tr>

			<Modal
				title="Shipping Details"
				opened={isModalOpen}
				fullScreen={Boolean(blobUrl)}
				classNames={{
					content: "!flex !flex-col",
					body: "flex-grow",
				}}
				onClose={handleModal.close}
			>
				<Divider />

				<div
					className={cn("grid h-[90%]", {
						"grid-cols-2 gap-8": blobUrl,
					})}
				>
					<div className="mt-8 flex flex-col gap-4">
						<p className="flex items-center gap-2">
							<strong>Name:</strong>
							<span>{request.CustomerName}</span>
						</p>
						<p className="flex items-center gap-2">
							<strong>Phone:</strong>
							<span>{request.CustomerPhone}</span>
						</p>
						<p className="flex items-center gap-2">
							<strong>Address 1:</strong>
							<span>{request.CustomerAddress1}</span>
						</p>
						{request.CustomerAddress2 && (
							<p className="flex items-center gap-2">
								<strong>Address 2:</strong>
								<span>{request.CustomerAddress2}</span>
							</p>
						)}
						<p className="flex items-center gap-2">
							<strong>City:</strong>
							<span>{request.CustomerCity}</span>
						</p>
						<p className="flex items-center gap-2">
							<strong>State:</strong>
							<span>{request.CustomerState}</span>
						</p>
						<p className="flex items-center gap-2">
							<strong>Zip:</strong>
							<span>{request.CustomerZip}</span>
						</p>

						{request.Status === CheckOutStatus.PENDING && (
							<>
								<fetcher.Form method="POST" className="flex items-center gap-4">
									<input hidden name="requestId" defaultValue={request.Id} />
									<input
										hidden
										name="productId"
										defaultValue={request.ProductId}
									/>
									<Button
										size="compact-sm"
										type="submit"
										variant="filled"
										name="intent"
										value="approve"
										color="green"
										loading={isSubmitting}
									>
										Approve
									</Button>
								</fetcher.Form>
							</>
						)}
					</div>

					{blobUrl && (
						<div className="mt-8 h-full">
							{request.Files[0].ContentType.startsWith("image") ? (
								<img
									src={blobUrl}
									alt="Shipping Label"
									className="h-full w-full object-contain"
								/>
							) : (
								<object
									data={blobUrl}
									type="application/pdf"
									width="100%"
									height="100%"
								>
									<embed src={blobUrl} type="application/pdf" />
								</object>
							)}
						</div>
					)}
				</div>
			</Modal>
		</>
	)
}
