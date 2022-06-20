import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
	const newLik = await prisma.link.create({
		data: {
			description: 'Fullstack prisma tutorial',
			url: 'https://fullstack.com',
		},
	});
	const allLinks = await prisma.link.findMany();

	console.log(allLinks);
}

main()
	.catch((e) => {
		throw e;
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
