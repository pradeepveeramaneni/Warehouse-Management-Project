import {Button, PasswordInput, TextInput} from "@mantine/core"
import {json, redirect, type DataFunctionArgs} from "@remix-run/node"
import {useFetcher} from "@remix-run/react"
import * as React from "react"
import {prisma} from "~/lib/db.server"
import {sendMail} from "~/lib/mail.server"
import {generateOtp} from "~/utils/misc"
import {badRequest, createPasswordHash} from "~/utils/misc.server"

interface ActionData {
	success: boolean
	fieldErrors?: {
		email?: string
		password?: string
		otp?: string
	}
}

export const action = async ({request}: DataFunctionArgs) => {
	const formData = await request.formData()

	const intent = formData.get("intent")?.toString()

	if (intent === "sendOTP") {
		const email = formData.get("email")?.toString()

		if (!email) {
			return badRequest("Email is required")
		}

		const _otp = generateOtp()
		const user = await prisma.user.findFirst({
			where: {
				Email: {
					equals: email,
					mode: "insensitive",
				},
			},
		})

		if (!user) {
			return badRequest<ActionData>({
				success: false,
				fieldErrors: {
					email: "Email is not registered",
				},
			})
		}

		await prisma.user.update({
			where: {
				Id: user.Id,
			},
			data: {
				otp: _otp,
			},
		})

		await sendMail(email, "OTP Code", `Your OTP Code is ${_otp}`)
		return json<ActionData>({success: true})
	}

	if (intent === "reset-password") {
		const email = formData.get("email")?.toString()
		const otp = formData.get("otp")?.toString()
		const password = formData.get("password")?.toString()

		if (!email) {
			return badRequest<ActionData>({
				success: false,
				fieldErrors: {
					email: "Email is required",
				},
			})
		}

		if (!password) {
			return badRequest<ActionData>({
				success: false,
				fieldErrors: {
					password: "Password is required",
				},
			})
		}

		if (!otp) {
			return badRequest<ActionData>({
				success: false,
				fieldErrors: {
					otp: "OTP Code is required",
				},
			})
		}

		const user = await prisma.user.findUnique({
			where: {
				Email: email,
			},
		})

		if (!user) {
			return badRequest<ActionData>({
				success: false,
				fieldErrors: {
					email: "Email is not registered",
				},
			})
		}

		if (user.otp !== otp) {
			return badRequest<ActionData>({
				success: false,
				fieldErrors: {
					otp: "OTP Code is invalid",
				},
			})
		}

		await prisma.user.update({
			where: {
				Email: email,
			},
			data: {
				Password: await createPasswordHash(password),
				otp: null,
			},
		})

		return redirect("/login")
	}
}

export default function ForgotPassword() {
	const fetcher = useFetcher<ActionData>()
	const isSubmitting = fetcher.state !== "idle"

	const [isOTPSent, setIsOTPSent] = React.useState(false)

	React.useEffect(() => {
		if (isSubmitting) return

		if (!fetcher.data) return
		if (fetcher.data?.success) {
			setIsOTPSent(true)
		}
	}, [fetcher.data, isSubmitting])
	return (
		<>
			<div className="mx-auto flex w-full flex-col justify-center space-y-6 border border-gray-900">
				<fetcher.Form
					method="post"
					className="w-full rounded px-6 pb-8 pt-6 text-black"
				>
					<h3 className="font-semibold">Forgot Password</h3>
					<hr className="my-2" />

					<div className="flex flex-col gap-4">
						<TextInput
							type="email"
							name="email"
							label="Email"
							readOnly={isOTPSent}
							autoFocus={!isOTPSent}
							placeholder="Enter your email"
							error={fetcher.data?.fieldErrors?.email}
							withAsterisk={false}
							required
						/>

						{isOTPSent ? (
							<>
								<TextInput
									name="otp"
									label="OTP Code"
									autoFocus={true}
									placeholder="Enter your OTP"
									error={fetcher.data?.fieldErrors?.otp}
									withAsterisk={false}
									required
								/>

								<PasswordInput
									name="password"
									label="New Password"
									placeholder="Enter your new password"
									error={fetcher.data?.fieldErrors?.password}
									withAsterisk={false}
									required
								/>
							</>
						) : null}
					</div>

					<div className="mt-8 flex w-full justify-between gap-4">
						{isOTPSent ? (
							<Button
								fullWidth
								type="submit"
								loading={isSubmitting}
								name="intent"
								value="reset-password"
							>
								Reset Password
							</Button>
						) : (
							<Button
								fullWidth
								type="submit"
								loading={isSubmitting}
								name="intent"
								value="sendOTP"
							>
								Send OTP Code
							</Button>
						)}
					</div>
				</fetcher.Form>
			</div>
		</>
	)
}
