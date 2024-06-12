import {
	Button,
	Checkbox,
	NumberInput,
	Select,
	TextInput,
	Textarea,
} from "@mantine/core"
import {Condition} from "@prisma/client"
import type {DataFunctionArgs} from "@remix-run/node"
import {json, redirect} from "@remix-run/node"
import {useFetcher, useLoaderData} from "@remix-run/react"
import {PageHeading} from "~/components/ui/PageHeading"
import {prisma} from "~/lib/db.server"
import {UserRole} from "~/utils/constants"

export async function loader({params}: DataFunctionArgs) {
	const productId = params.productId

	if (!productId) {
		return redirect("/employee")
	}

	try {
		const customers = await prisma.user.findMany({
			where: {
				Role: UserRole.CUSTOMER,
			},
		})

		const product = await prisma.product.findUnique({
			where: {
				Id: productId,
			},
			include: {
				Warehouse: true,
				User: true,
				CheckOutRequests: true,
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
			customers,
		})
	} catch (error) {
		return redirect("/")
	}
}

type ActionData = {
	success: boolean
	fieldErrors?: Record<string, string>
}

export async function action({request, params}: DataFunctionArgs) {
	const productId = params.productId

	if (!productId) {
		return redirect("/employee")
	}
	const formData = await request.formData()

	const name = formData.get("name")?.toString()
	const quantity = formData.get("quantity")?.toString()
	const memo = formData.get("memo")?.toString()
	const condition = formData.get("condition")?.toString()
	const isReturn = formData.get("return")?.toString()
	const upc = formData.get("upc")?.toString()
	const customerId = formData.get("customerId")?.toString()

	const warehouse = await prisma.warehouse.findFirst({})

	if (!warehouse) {
		return redirect("/employee")
	}

	if (!customerId) {
		return json<ActionData>({
			success: false,
			fieldErrors: {
				customerId: "Select a customer",
			},
		})
	}

	const customer = await prisma.user.findUnique({
		where: {
			Id: customerId,
		},
	})

	if (!customer) {
		return redirect("/employee")
	}

	if (!upc) {
		return json<ActionData>({
			success: false,
			fieldErrors: {
				upc: "UPC is required",
			},
		})
	}

	if (!name) {
		return json<ActionData>({
			success: false,
			fieldErrors: {
				name: "Name is required",
			},
		})
	}

	if (!condition) {
		return json<ActionData>({
			success: false,
			fieldErrors: {
				condition: "Condition is required",
			},
		})
	}

	if (!quantity) {
		return json<ActionData>({
			success: false,
			fieldErrors: {
				quantity: "Quantity is required",
			},
		})
	}

	const _return = isReturn === "on"

	// if (_return) {
	// 	await prisma.product.update({
	// 		where: {
	// 			Id: productId,
	// 		},
	// 		data: {
	// 			Status: ProductStatus.RETURNED,
	// 			Memo: memo,
	// 			Condition: condition as Condition,
	// 			Return: _return,
	// 		},
	// 	})

	// 	return redirect("/employee")
	// }

	await prisma.product.update({
		where: {
			Id: productId,
		},
		data: {
			Memo: memo,
			Condition: condition as Condition,
			Return: false,
			Name: name,
			Quantity: Number(quantity),
			UPC: upc,
			WarehouseId: warehouse.Id,
			UserId: customerId,
		},
	})

	return redirect("/employee")
}

export default function OwnerInventory() {
	const {product, customers} = useLoaderData<typeof loader>()

	const fetcher = useFetcher<ActionData>()
	const isSubmitting = fetcher.state !== "idle"

	return (
		<>
			<div className="flex h-full max-w-screen-xl flex-col gap-8 bg-white py-2">
				<fetcher.Form method="post" className="flex flex-col gap-12">
					<div className="mt-6 px-10">
						<PageHeading title="UPDATE PRODUCT" />
					</div>

					<div className="flex flex-1 flex-col gap-8 rounded-tl-3xl bg-blue-50 px-10 py-8">
						<div className="flex flex-col gap-4">
							<TextInput
								name="name"
								label="Product Name"
								placeholder="Enter product name"
								defaultValue={product.Name}
								error={fetcher.data?.fieldErrors?.name}
								required
							/>

							<TextInput
								name="upc"
								label="UPC"
								placeholder="Enter UPC"
								defaultValue={product.UPC}
								error={fetcher.data?.fieldErrors?.upc}
								required
							/>

							<NumberInput
								name="quantity"
								label="Quantity"
								placeholder="Enter quantity"
								defaultValue={product.Quantity}
								error={fetcher.data?.fieldErrors?.quantity}
								min={0}
								required
							/>

							<Select
								label="Customer"
								name="customerId"
								defaultValue={product.UserId}
								placeholder="Select customer"
								data={customers.map((customer) => ({
									value: customer.Id,
									label: customer.Name,
								}))}
								required
							/>

							<Select
								name="condition"
								label="Condition"
								data={Object.values(Condition).map((condition) => ({
									value: condition,
									label: condition,
								}))}
								error={fetcher.data?.fieldErrors?.condition}
								defaultValue={product.Condition ?? Condition.NEW}
							/>

							<Textarea
								name="memo"
								label="Memo"
								defaultValue={product.Memo || undefined}
								placeholder="Enter memo"
								minRows={6}
							/>

							<Checkbox
								name="return"
								label="Return"
								defaultChecked={product.Return}
							/>
						</div>

						<div className="flex items-center justify-end">
							<Button type="submit" loading={isSubmitting}>
								Update
							</Button>
						</div>
					</div>
				</fetcher.Form>
			</div>
		</>
	)
}
