import {Button, CloseButton, Divider, Modal, TextInput} from "@mantine/core"
import {useDisclosure} from "@mantine/hooks"
import {CheckOutStatus} from "@prisma/client"
import type {DataFunctionArgs, SerializeFrom} from "@remix-run/node"
import {json} from "@remix-run/node"
import {Link, useLoaderData} from "@remix-run/react"
import {ArrowRightIcon, ExternalLinkIcon} from "lucide-react"
import * as React from "react"
import {EmptyState} from "~/components/EmptyState"
import {PageHeading} from "~/components/ui/PageHeading"
import {prisma} from "~/lib/db.server"
import {requireUserId} from "~/session.server"
import {formatDateTime} from "~/utils/misc"

export async function loader({request}: DataFunctionArgs) {
	const userId = await requireUserId(request)

	const products = await prisma.product.findMany({
		where: {
			UserId: userId,
		},
		include: {
			Warehouse: true,
			CheckOutRequests: true,
			_count: {
				select: {
					CheckOutRequests: true,
				},
			},
		},
	})

	return json({
		products,
	})
}

export default function CustomerInventory() {
	const {products} = useLoaderData<typeof loader>()

	const [queryProduct, setQueryProduct] = React.useState("")
	const [queryUPC, setQueryUPC] = React.useState("")

	const filteredProducts = React.useMemo(() => {
		let _products = products
		const _queryProduct = queryProduct.trim()
		const _queryUPC = queryUPC.trim()

		if (_queryProduct) {
			_products = _products.filter((product) => {
				return product.Name.toLowerCase().includes(_queryProduct.toLowerCase())
			})
		}

		if (_queryUPC) {
			_products = _products.filter((product) => {
				return product.UPC.toLowerCase().includes(_queryUPC.toLowerCase())
			})
		}

		return _products
	}, [products, queryUPC, queryProduct])

	return (
		<>
			<div className="flex h-full max-w-screen-xl flex-col gap-8 bg-white py-2">
				<div className="mt-6 px-10">
					<PageHeading title="CUSTOMER INVENTORY" />
				</div>

				<div className="flex flex-1 flex-col gap-8 rounded-tl-3xl bg-blue-50 px-10 py-8">
					<div className="flex max-w-md items-center gap-4">
						<TextInput
							label="UPC"
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
					</div>

					{filteredProducts.length > 0 ? (
						<div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
							<table className="w-full">
								<thead>
									<tr>
										<th className="px-4 py-2">Warehouse</th>
										<th className="px-4 py-2">UPC</th>
										<th className="px-4 py-2">Product</th>
										<th className="px-4 py-2">Quantity</th>
										<th className="px-4 py-2">Status</th>
										<th className="px-4 py-2"></th>
									</tr>
								</thead>
								<tbody>
									{filteredProducts.map((product) => (
										<ProductRow key={product.Id} product={product} />
									))}
								</tbody>
							</table>
						</div>
					) : (
						<EmptyState message="No products found" />
					)}
				</div>
			</div>
		</>
	)
}

function ProductRow({
	product,
}: {
	product: SerializeFrom<typeof loader>["products"][0]
}) {
	const [isModalOpen, handleModal] = useDisclosure(false)

	return (
		<>
			<tr>
				<td className="border px-4 py-2">{product.Warehouse.Name}</td>
				<td className="border px-4 py-2">
					<Button
						variant="white"
						color="blue"
						size="compact-sm"
						component={Link}
						to={`upc/${product.UPC}`}
						rightSection={<ExternalLinkIcon size={18} />}
					>
						{product.UPC}
					</Button>
				</td>
				<td className="border px-4 py-2">{product.Name}</td>
				<td className="border px-4 py-2">{product.Quantity}</td>
				<td className="border px-4 py-2 text-center">
					<div>
						<Button
							variant="white"
							color="blue"
							size="compact-sm"
							onClick={handleModal.open}
							rightSection={<ExternalLinkIcon size={18} />}
						>
							Check
						</Button>
					</div>
				</td>
				<td className="border px-4 py-2">
					{product.Quantity > 0 && (
						<Button
							type="button"
							variant="white"
							component={Link}
							to={`/checkout/${product.Id}`}
							rightSection={<ArrowRightIcon size={18} />}
						>
							Check Out
						</Button>
					)}
				</td>
			</tr>

			<Modal
				title="Product Status"
				opened={isModalOpen}
				onClose={handleModal.close}
			>
				<Divider />

				<div className="mt-8">
					{product.CheckedInTime && (
						<p>Checked In At: {formatDateTime(product.CheckedInTime)}</p>
					)}

					<ul className="mt-4">
						{product.CheckOutRequests.map((request) => {
							const isApproved = request.Status === CheckOutStatus.CHECKED_OUT

							return (
								<li key={request.Id}>
									<p>
										<b>Quantity</b>: {request.Quantity}
									</p>
									<span>
										{isApproved ? "Checked Out At" : "Request sent at"}:{" "}
										{formatDateTime(request.CreatedAt)}
									</span>
								</li>
							)
						})}
					</ul>
				</div>
			</Modal>
		</>
	)
}
