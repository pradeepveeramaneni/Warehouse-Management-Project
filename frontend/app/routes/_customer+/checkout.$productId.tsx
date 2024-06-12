import {
	Button,
	Divider,
	Group,
	Modal,
	NumberInput,
	Text,
	TextInput,
	rem,
} from "@mantine/core"
import type {FileWithPath} from "@mantine/dropzone"
import {Dropzone} from "@mantine/dropzone"
import {useDisclosure} from "@mantine/hooks"
import {CheckOutStatus} from "@prisma/client"
import type {DataFunctionArgs} from "@remix-run/node"
import {
	json,
	redirect,
	unstable_createMemoryUploadHandler,
	unstable_parseMultipartFormData,
} from "@remix-run/node"
import {useFetcher, useLoaderData} from "@remix-run/react"
import {ArrowRightIcon, FileIcon, UploadIcon, XIcon} from "lucide-react"
import * as React from "react"
import {toast} from "sonner"
import {PageHeading} from "~/components/ui/PageHeading"
import {prisma} from "~/lib/db.server"
import {sendMail} from "~/lib/mail.server"
import {requireUser, requireUserId} from "~/session.server"
import {UserRole} from "~/utils/constants"
import type {NestedText} from "~/utils/misc"
import {
	findReferenceNumber,
	formatDateTime,
	generateMockUPSTrackingId,
} from "~/utils/misc"

export async function loader({request, params}: DataFunctionArgs) {
	const productId = params.productId
	const userId = await requireUserId(request)

	const user = await prisma.user.findUnique({
		where: {
			Id: userId,
		},
	})

	if (!user) {
		return redirect("/")
	}

	if (!productId) {
		return redirect("/")
	}

	try {
		const product = await prisma.product.findUnique({
			where: {
				Id: productId,
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

		if (!product) {
			return redirect("/", 404)
		}

		return json({
			product,
			user,
		})
	} catch (error) {
		return redirect("/")
	}
}

type ActionData = {
	success: boolean
	fieldErrors?: {
		customerName?: string
		productId?: string
		quantity?: string
		customerPhone?: string
		customerAddress1?: string
		customerAddress2?: string
		customerCity?: string
		customerState?: string
		customerZip?: string
		file?: string
	}
}

const MAX_SIZE = 1024 * 1024 * 10 // 10MB

export async function action({request}: DataFunctionArgs) {
	const customer = await requireUser(request)
	const formData = await unstable_parseMultipartFormData(
		request,
		unstable_createMemoryUploadHandler({maxPartSize: MAX_SIZE})
	)

	const contentLength = Number(request.headers.get("Content-Length"))
	if (
		contentLength &&
		Number.isFinite(contentLength) &&
		contentLength > MAX_SIZE
	) {
		return json<ActionData>({
			success: false,
			fieldErrors: {
				file: "File size is too large",
			},
		})
	}

	const userId = await requireUserId(request)
	const productId = formData.get("productId")?.toString()
	const customerName = formData.get("customerName")?.toString()
	const quantity = formData.get("quantity")?.toString()
	const customerPhone = formData.get("customerPhone")?.toString()
	const customerAddress1 = formData.get("customerAddress1")?.toString()
	const customerAddress2 = formData.get("customerAddress2")?.toString()
	const customerCity = formData.get("customerCity")?.toString()
	const customerState = formData.get("customerState")?.toString()
	const customerZip = formData.get("customerZip")?.toString()
	const file = formData.get("file")
	const fieldErrors: ActionData["fieldErrors"] = {}

	if (!(file instanceof File)) {
		return json<ActionData>(
			{
				success: false,
				fieldErrors: {
					file: "File is required",
				},
			},
			400
		)
	}
	if (!productId) {
		fieldErrors.productId = "Product Id is required"
	}

	if (!quantity) {
		fieldErrors.quantity = "Quantity is required"
	}

	if (Object.keys(fieldErrors).length > 0) {
		return json<ActionData>({
			success: false,
			fieldErrors,
		})
	}

	const ocrFormData = new FormData()
	ocrFormData.append("apikey", process.env.OCR_SPACE_API_KEY!)
	ocrFormData.append("file", file)
	ocrFormData.append("language", "eng")
	ocrFormData.append("isTable", "true")
	ocrFormData.append("OCREngine", "2")

	console.log(file)

	let trackingId: string | null = null
	try {
		const response = await fetch("https://api.ocr.space/parse/image", {
			method: "POST",
			body: ocrFormData,
		})

		const ocrResponse = await response.json()
		const nestedOcrResult: NestedText = ocrResponse?.["ParsedResults"][0]

		trackingId = findReferenceNumber(nestedOcrResult)
		if (!trackingId) {
			trackingId = generateMockUPSTrackingId()
		}
	} catch (error) {
		console.error("OCR API request failed:", error)
	}
	const fields = {
		ProductId: productId!,
		CustomerName: customerName,
		CustomerPhone: customerPhone,
		CustomerAddress1: customerAddress1,
		CustomerAddress2: customerAddress2,
		CustomerCity: customerCity,
		CustomerState: customerState,
		CustomerZip: customerZip,
		Quantity: Number(quantity!),
	}

	await prisma.$transaction(async (tx) => {
		await tx.checkOutRequest.create({
			data: {
				userId,
				TrackingId: trackingId || generateMockUPSTrackingId(),
				Status: CheckOutStatus.PENDING,
				Files: {
					create: {
						ContentType: file.type,
						Name: file.name,
						Blob: Buffer.from(await file.arrayBuffer()),
					},
				},
				...fields,
			},
		})

		const product = await tx.product.update({
			where: {
				Id: fields.ProductId,
			},
			data: {
				Quantity: {
					decrement: fields.Quantity,
				},
			},
		})

		const employee = await prisma.user.findFirst({
			where: {
				Role: UserRole.EMPLOYEE,
			},
		})

		if (!employee) {
			return json({
				success: false,
				fieldErrors: {
					productId: "No employee found",
				},
			})
		}

		await sendMail(
			employee.Email,
			"New Check Out Request",
			`A new check out request has been made by ${customerName} for ${quantity} units of product ${product.UPC}`
		)

		await sendMail(
			customer.email,
			"Check Out Request",
			`Your check out request for ${quantity} units of product ${product.UPC} has been received. You will be notified once it is approved.`
		)
	})

	return redirect("/")
}

export default function CustomerCheckout() {
	const {product, user} = useLoaderData<typeof loader>()

	const fetcher = useFetcher<ActionData>()
	const isSubmitting = fetcher.state !== "idle"

	const [isModalOpen, handleModal] = useDisclosure(false)

	const [file, setFile] = React.useState<File | null>(null)

	const fileInput = React.useRef<HTMLInputElement>(null)
	const _onDrop = (files: FileWithPath[]) => {
		if (!fileInput.current) {
			throw new Error("Dropzone input ref is not set yet")
		}
		const dataTransfer = new DataTransfer()

		files.forEach((f) => dataTransfer.items.add(f))
		fileInput.current.files = dataTransfer.files

		setFile(files[0])
	}

	return (
		<>
			<div className="flex h-full max-w-screen-xl flex-col gap-8 bg-white py-2">
				<fetcher.Form
					method="post"
					className="flex flex-col gap-12"
					encType="multipart/form-data"
				>
					<div className="mt-6 px-10">
						<PageHeading title="CUSTOMER CHECKOUT" />
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
									</tr>
								</thead>
								<tbody>
									<tr>
										<td className="border px-4 py-2">
											{product.Warehouse.Name}
										</td>
										<td className="border px-4 py-2">{product.UPC}</td>
										<td className="border px-4 py-2">{product.Name}</td>
										<td className="border px-4 py-2">
											<NumberInput
												defaultValue={1}
												name="quantity"
												description={`Max quantity ${product.Quantity}`}
												min={1}
												max={product.Quantity}
												required
												error={fetcher.data?.fieldErrors?.quantity}
											/>
										</td>
										<td
											className="border px-4 py-2 text-center"
											onClick={handleModal.open}
										>
											<Button
												variant="white"
												color="blue"
												size="compact-sm"
												onClick={handleModal.open}
											>
												Check
											</Button>
										</td>
									</tr>
								</tbody>
							</table>
						</div>

						<div className="flex flex-col gap-8">
							<input type="hidden" name="productId" defaultValue={product.Id} />

							<h2 className="text-xl font-semibold">Shipping Information</h2>

							<fieldset
								className="grid grid-cols-2 gap-4"
								disabled={isSubmitting}
							>
								<div className="flex flex-col gap-4">
									<TextInput
										name="customerName"
										label="Customer Name"
										placeholder="Enter customer name"
										defaultValue={user.Name}
										className="w-full"
										autoComplete="off"
										error={fetcher.data?.fieldErrors?.customerName}
									/>

									<NumberInput
										name="customerPhone"
										label="Customer Phone"
										placeholder="Enter customer phone"
										className="w-full"
										min={0}
										autoComplete="off"
										pattern="[0-9]{10}"
										title="Please enter a valid 10 digit phone number"
										error={fetcher.data?.fieldErrors?.customerPhone}
										withAsterisk={false}
									/>

									{/* <FileInput
										name="file"
										label="Shipping Label"
										value={file}
										onChange={(file) => setFile(file)}
										accept="image/*,application/pdf"
										description="Upload the shipping label"
										placeholder="Upload shipping label"
									/> */}

									{file ? (
										<div className="flex items-center gap-4 rounded border bg-white p-4">
											<FileIcon
												style={{
													width: rem(52),
													height: rem(52),
													color: "var(--mantine-color-dimmed)",
												}}
											/>

											<div className="flex flex-col truncate">
												<Text truncate>{file.name}</Text>
												<Text size="xs" c="dimmed">
													{file.type}
												</Text>

												<Button
													variant="outline"
													color="red"
													onClick={() => {
														setFile(null)
														if (fileInput.current) {
															fileInput.current.value = ""
														}
													}}
												>
													Remove
												</Button>
											</div>
										</div>
									) : null}
									<input type="file" hidden ref={fileInput} name="file" />
									<Dropzone
										classNames={{
											root: file ? "sr-only" : "",
										}}
										onDrop={_onDrop}
										onReject={() => toast.error("Please upload a valid file")}
										maxSize={3 * 1024 ** 10}
										className="rounded-lg border border-dashed border-gray-600"
										accept={["image/*", "application/pdf"]}
										multiple={false}
									>
										<Group
											justify="center"
											gap="xl"
											mih={220}
											style={{pointerEvents: "none"}}
										>
											<Dropzone.Accept>
												<UploadIcon
													style={{
														width: rem(52),
														height: rem(52),
														color: "var(--mantine-color-blue-6)",
													}}
												/>
											</Dropzone.Accept>

											<Dropzone.Reject>
												<XIcon
													style={{
														width: rem(52),
														height: rem(52),
														color: "var(--mantine-color-red-6)",
													}}
												/>
											</Dropzone.Reject>

											<Dropzone.Idle>
												<FileIcon
													style={{
														width: rem(52),
														height: rem(52),
														color: "var(--mantine-color-dimmed)",
													}}
												/>
											</Dropzone.Idle>

											<div>
												<Text size="xl" inline truncate>
													Drag your shipping label here
												</Text>
												<Text size="sm" c="dimmed" inline mt={7}>
													Attach one file
												</Text>
											</div>
										</Group>
									</Dropzone>
								</div>

								<div className="flex flex-col gap-4">
									<TextInput
										name="customerAddress1"
										label="Street Address 1"
										placeholder="Enter street address"
										autoComplete="off"
										error={fetcher.data?.fieldErrors?.customerAddress1}
										withAsterisk={false}
									/>
									<TextInput
										name="customerAddress2"
										label="Street Address 2"
										placeholder="Enter apartment details (optional)"
										autoComplete="off"
										error={fetcher.data?.fieldErrors?.customerAddress2}
										withAsterisk={false}
									/>
									<TextInput
										name="customerCity"
										label="City"
										placeholder="Enter city"
										autoComplete="off"
										error={fetcher.data?.fieldErrors?.customerCity}
										withAsterisk={false}
									/>
									<TextInput
										name="customerState"
										label="State"
										placeholder="Enter state"
										autoComplete="off"
										error={fetcher.data?.fieldErrors?.customerState}
										withAsterisk={false}
									/>
									<TextInput
										name="customerZip"
										label="Zip Code"
										placeholder="Enter zip code"
										autoComplete="off"
										pattern="[0-9]*"
										error={fetcher.data?.fieldErrors?.customerZip}
										withAsterisk={false}
									/>
								</div>
							</fieldset>

							<Divider />

							<div className="flex items-center justify-end">
								<Button
									type="submit"
									loading={isSubmitting}
									rightSection={<ArrowRightIcon size={18} />}
								>
									Check Out
								</Button>
							</div>
						</div>
					</div>
				</fetcher.Form>
			</div>

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
