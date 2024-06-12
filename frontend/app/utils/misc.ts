import type {MantineColor} from "@mantine/core"
import {CheckOutStatus, ProductStatus} from "@prisma/client"
import type {ClassValue} from "clsx"
import clsx from "clsx"
import {capitalize} from "lodash"
import {twMerge} from "tailwind-merge"
import {createZodFetcher} from "zod-fetch"
import {UserRole} from "~/utils/constants"

export function round(number: number, precision: number) {
	const d = Math.pow(10, precision)
	return Math.round((number + Number.EPSILON) * d) / d
}

export function titleCase(string: string) {
	string = string.toLowerCase()
	const wordsArray = string.split(" ")

	for (let i = 0; i < wordsArray.length; i++) {
		wordsArray[i] = capitalize(wordsArray[i])
	}

	return wordsArray.join(" ")
}

export function formatDate(date: Date | string) {
	return new Intl.DateTimeFormat("en", {
		year: "numeric",
		month: "2-digit",
		day: "numeric",
	}).format(new Date(date))
}

export function formatDateTime(date: Date | string) {
	return new Intl.DateTimeFormat("en", {
		year: "numeric",
		month: "2-digit",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	}).format(new Date(date))
}

export function formatTime(date: Date | string) {
	return new Intl.DateTimeFormat("en", {
		hour: "2-digit",
		minute: "2-digit",
	}).format(new Date(date))
}

export function formatList(list: Array<string>) {
	return new Intl.ListFormat("en").format(list)
}

export function formatCurrency(amount: number) {
	return new Intl.NumberFormat("en", {
		style: "currency",
		currency: "USD",
	}).format(amount)
}

export const dbWithZod = createZodFetcher()

export const userRoleLookup = (role: UserRole) => {
	switch (role) {
		case UserRole.EMPLOYEE:
			return "Employee"
		case UserRole.CUSTOMER:
			return "Customer"
		default:
			return "Unknown"
	}
}

export const productStatusLookup = (status: ProductStatus) => {
	switch (status) {
		case ProductStatus.CHECKED_IN:
			return "Checked In"
		case ProductStatus.NOT_CHECKED_IN:
			return "Not Checked In"
		case ProductStatus.PENDING:
			return "Pending"
		case ProductStatus.CHECKED_OUT:
			return "Checked Out"
		default:
			return "Unknown"
	}
}

export const productStatusColorLookup = (
	status: ProductStatus
): MantineColor => {
	switch (status) {
		case ProductStatus.CHECKED_IN:
			return "blue"
		case ProductStatus.NOT_CHECKED_IN:
			return "red"
		case ProductStatus.PENDING:
			return "yellow"
		case ProductStatus.CHECKED_OUT:
			return "green"
		default:
			return "Unknown"
	}
}

export const checkOutStatusLabelLookup = {
	[CheckOutStatus.CHECKED_OUT]: "Checked Out",
	[CheckOutStatus.PENDING]: "Pending",
	[CheckOutStatus.CANCELLED]: "Cancelled",
} satisfies Record<CheckOutStatus, string>

export const checkOutStatusColorLookup = {
	[CheckOutStatus.CHECKED_OUT]: "green",
	[CheckOutStatus.PENDING]: "yellow",
	[CheckOutStatus.CANCELLED]: "red",
} satisfies Record<CheckOutStatus, MantineColor>

export function combineDateAndTime(date: string, time: string) {
	const dateTimeString = date + " " + time + ":00"
	return new Date(dateTimeString)
}

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

export function getInitials(name: string): string {
	const nameParts = name.split(/[^a-zA-Z]+/)
	let initials = ""

	for (const part of nameParts) {
		if (part.length > 0) {
			initials += part[0]
		}

		if (initials.length >= 2) {
			break
		}
	}

	return initials.toUpperCase()
}

export function generateUPC(): string {
	let first11Digits = ""
	for (let i = 0; i < 11; i++) {
		first11Digits += Math.floor(Math.random() * 10).toString()
	}

	return first11Digits + getUPCCheckDigit(first11Digits)
}

function getUPCCheckDigit(upc: string): number {
	let oddSum = 0,
		evenSum = 0

	// Calculate oddSum and evenSum
	for (let i = 0; i < upc.length; i++) {
		i % 2 === 0 ? (oddSum += parseInt(upc[i])) : (evenSum += parseInt(upc[i]))
	}

	let totalSum = oddSum * 3 + evenSum
	let modulo = totalSum % 10

	return modulo !== 0 ? 10 - modulo : modulo
}

export function generateMockUPSTrackingId(): string {
	const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	let result = "1Z"

	for (let i = 0; i < 16; i++) {
		result += characters.charAt(Math.floor(Math.random() * characters.length))
	}

	return result
}

export function generateOtp(length: number = 6): string {
	const digits = "0123456789"
	let otp = ""

	for (let i = 0; i < length; i++) {
		otp += digits[Math.floor(Math.random() * 10)]
	}

	return otp
}

export function generateToken(length: number = 25): string {
	const characters =
		"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
	let token = ""

	for (let i = 0; i < length; i++) {
		token += characters.charAt(Math.floor(Math.random() * characters.length))
	}

	return token
}

export type NestedText = string | NestedTextArray | NestedTextObject
interface NestedTextArray extends Array<NestedText> {}
interface NestedTextObject {
	[key: string]: NestedText
}

function flattenOcrText(ocrText: NestedText): string {
	if (typeof ocrText === "string") {
		return ocrText
	} else if (Array.isArray(ocrText)) {
		return ocrText.map(flattenOcrText).join(" ")
	} else {
		return Object.values(ocrText).map(flattenOcrText).join(" ")
	}
}
export function findReferenceNumber(ocrText: NestedText): string | null {
	const flatText = flattenOcrText(ocrText)

	const regex = /[A-Za-z]+[0-9]+/g
	const matches = flatText.match(regex)

	if (matches) {
		const reference = matches.filter((m) => m.length === 8)
		return reference.length > 0 ? reference[0] : null
	} else {
		return null
	}
}
