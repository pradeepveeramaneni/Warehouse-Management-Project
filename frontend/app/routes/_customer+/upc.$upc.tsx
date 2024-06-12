import {Badge} from "@mantine/core"
import type {DataFunctionArgs} from "@remix-run/node"
import {json, redirect} from "@remix-run/node"
import {useLoaderData} from "@remix-run/react"
import {PageHeading} from "~/components/ui/PageHeading"
import {prisma} from "~/lib/db.server"
import {
	checkOutStatusColorLookup,
	checkOutStatusLabelLookup,
	formatDateTime,
	productStatusColorLookup,
	productStatusLookup,
} from "~/utils/misc"

export async function loader({params}: DataFunctionArgs) {
	const upc = params.upc

	if (!upc) {
		return redirect("/employee")
	}

	try {
		const product = await prisma.product.findUnique({
			where: {
				UPC: upc,
			},
			include: {
				Warehouse: true,
				CheckOutRequests: {
					orderBy: {
						UpdatedAt: "asc",
					},
					select: {
						Id: true,
						Quantity: true,
						Status: true,
						CustomerName: true,
						UpdatedAt: true,
					},
				},
				_count: {
					select: {
						CheckOutRequests: true,
					},
				},
			},
		})

		if (!product) {
			return redirect("/", 404)
		}

		return json({
			product,
		})
	} catch (error) {
		return redirect("/")
	}
}

export default function ProductUPC() {
	const {product} = useLoaderData<typeof loader>()

	const totalProductQuantity =
		product.CheckOutRequests.reduce(
			(total, request) => total + request.Quantity,
			0
		) + product.Quantity

	return (
		<>
			<div className="flex h-full max-w-screen-xl flex-col gap-8 bg-white py-2">
				<div className="mt-6 px-10">
					<PageHeading title="PRODUCT UPC HISTORY" />
				</div>

				<div className="flex flex-1 flex-col gap-8 rounded-tl-3xl bg-blue-50 px-10 py-8">
					<div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
						<table className="w-full">
							<thead>
								<tr>
									<th className="px-4 py-2">Warehouse</th>
									<th className="px-4 py-2">UPC</th>
									<th className="px-4 py-2">Product</th>
									<th className="px-4 py-2">Quantity</th>
									<th className="px-4 py-2">Status</th>
									<th className="px-4 py-2">Updated At</th>
								</tr>
							</thead>
							<tbody>
								<tr>
									<td className="border px-4 py-2">{product.Warehouse.Name}</td>
									<td className="border px-4 py-2">{product.UPC}</td>
									<td className="border px-4 py-2">{product.Name}</td>
									<td className="border px-4 py-2">{totalProductQuantity}</td>
									<td className="border px-4 py-2 text-center">
										<Badge
											variant="light"
											color={productStatusColorLookup(product.Status)}
											radius="xs"
										>
											{productStatusLookup(product.Status)}
										</Badge>
									</td>

									<td className="border px-4 py-2">
										{formatDateTime(product.CheckedInTime)}
									</td>
								</tr>

								{product.CheckOutRequests.map((request) => (
									<tr key={request.Id}>
										<td className="border px-4 py-2">
											{product.Warehouse.Name}
										</td>
										<td className="border px-4 py-2">{product.UPC}</td>
										<td className="border px-4 py-2">{product.Name}</td>
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
											{formatDateTime(request.UpdatedAt)}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			</div>
		</>
	)
}
