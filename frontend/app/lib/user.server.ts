import {isErrorFromAlias} from "@zodios/core"
import {prisma} from "~/lib/db.server"
import {apiClient} from "~/lib/zodios/api-client.server"
import {authApi} from "~/lib/zodios/auth-api"
import {userApi} from "~/lib/zodios/user-api"
import {UserRole} from "~/utils/constants"

export const BACKEND_API_URL = process.env.BACKEND_API_URL!

export async function getAllUsers() {
	try {
		const response = await apiClient.getAllUsers()

		return response
	} catch (error) {
		if (isErrorFromAlias(userApi, "getAllUsers", error)) {
			console.log("error", error.response.data)
			return error.response.data
		}

		throw error
	}
}

export async function getUserById(id: string) {
	try {
		const response = await apiClient.getUserById({
			params: {id},
		})

		return response.data
	} catch (error) {
		if (isErrorFromAlias(userApi, "getUserById", error)) {
			console.log("error", error.response.data)
			return null
		}

		throw error
	}
}

export async function verifyLogin({
	email,
	password,
	role,
}: {
	email: string
	password: string
	role: UserRole
}) {
	try {
		const response = await apiClient.verifyLogin({
			email,
			password,
			role,
		})

		return response
	} catch (error) {
		if (isErrorFromAlias(authApi, "verifyLogin", error)) {
			console.log("error", error.response.data)
			return error.response.data
		}

		throw error
	}
}

export async function createUser({
	email,
	password,
	name,
	role,
}: {
	email: string
	password: string
	name: string
	role: number
}) {
	try {
		const response = await apiClient.createUser({
			name,
			email,
			password,
			role,
		})

		return response
	} catch (error) {
		if (isErrorFromAlias(userApi, "createUser", error)) {
			console.log("error", error.response.data)
			return error.response.data
		}

		throw error
	}
}

export async function getAllCustomers() {
	return prisma.user.findMany({
		where: {
			Role: UserRole.CUSTOMER,
		},
	})
}
