import {Condition, PrismaClient, ProductStatus} from "@prisma/client"
import {UserRole} from "~/utils/constants"
import {generateUPC} from "~/utils/misc"

const prisma = new PrismaClient()

async function seed() {
	console.log(`Database has been seeded. 🌱`)

	const user = await prisma.user.findFirst({
		where: {
			Role: UserRole.CUSTOMER,
		},
	})

	if (!user) {
		throw new Error("No customer found")
	}

	await prisma.checkOutRequest.deleteMany()
	await prisma.product.deleteMany()
	await prisma.warehouse.deleteMany()

	const warehouse = await prisma.warehouse.create({
		data: {
			Name: "Marina Bay Sands",
			Address: "10 Bayfront Ave, Singapore 018956",
		},
	})

	await prisma.product.createMany({
		data: [
			{
				Name: "iPhone 15",
				Quantity: 10,
				UPC: generateUPC(),
				UserId: user.Id,
				Status: ProductStatus.CHECKED_IN,
				Condition: Condition.NEW,
				CheckedInTime: new Date(),
				WarehouseId: warehouse.Id,
			},
			{
				Name: "iPhone 15 Pro",
				Quantity: 10,
				UPC: generateUPC(),
				UserId: user.Id,
				Status: ProductStatus.CHECKED_IN,
				CheckedInTime: new Date(),
				Condition: Condition.USED,
				WarehouseId: warehouse.Id,
			},
			{
				Name: "iPhone 15 Pro Max",
				Quantity: 10,
				UPC: generateUPC(),
				UserId: user.Id,
				Status: ProductStatus.CHECKED_IN,
				Condition: Condition.NEW,
				CheckedInTime: new Date(),
				WarehouseId: warehouse.Id,
			},
		],
	})
}

seed()
	.catch((e) => {
		console.error(e)
		process.exit(1)
	})
	.finally(async () => {
		await prisma.$disconnect()
	})
