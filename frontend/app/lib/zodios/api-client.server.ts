import {Zodios} from "@zodios/core"
import invariant from "tiny-invariant"
import {authApi} from "~/lib/zodios/auth-api"
import {userApi} from "~/lib/zodios/user-api"

const BASE_URL = process.env.BACKEND_API_URL
invariant(BASE_URL, "BACKEND_API_URL env var is required")

export const apiClient = new Zodios(BASE_URL, [...userApi, ...authApi])
