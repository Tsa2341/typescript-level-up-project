import {
	extendType,
	objectType,
	nonNull,
	intArg,
	stringArg,
	inputObjectType,
	enumType,
	arg,
	list,
} from 'nexus';
import { NexusGenObjects } from '../../nexus-typegen';
import { Prisma } from '@prisma/client';

export const Link = objectType({
	name: 'Link',
	definition(t) {
		t.nonNull.int('id');
		t.nonNull.string('description');
		t.nonNull.string('url');
		t.nonNull.dateTime('createdAt');
		t.field('postedBy', {
			type: 'User',
			resolve(parent, args, context) {
				return context.prisma.link.findUnique({ where: { id: parent.id } }).postedBy();
			},
		});
		t.nonNull.list.nonNull.field('voters', {
			type: 'User',
			resolve(parent, args, context) {
				return context.prisma.link.findUnique({ where: { id: parent.id } }).voters();
			},
		});
	},
});
export const LinkOrderByInput = inputObjectType({
	name: 'LinkOrderByInput',
	definition(t) {
		t.field('description', { type: Sort });
		t.field('url', { type: Sort });
		t.field('createdAt', { type: Sort });
		t.field('id', { type: Sort });
	},
});
export const Sort = enumType({
	name: 'Sort',
	members: ['asc', 'desc'],
});
export const Feed = objectType({
	name: 'Feed',
	definition(t) {
		t.nonNull.list.nonNull.field('links', { type: Link });
		t.nonNull.int('count');
		t.id('id');
	},
});

export const LinkQuery = extendType({
	type: 'Query',
	definition(t) {
		t.nonNull.field('feed', {
			type: 'Feed',
			args: {
				filter: stringArg(),
				take: intArg(),
				skip: intArg(),
				orderBy: arg({ type: list(nonNull(LinkOrderByInput)) }),
			},
			async resolve(parent, args, context, info) {
				const { prisma } = context;
				const { take, skip, orderBy } = args;

				const where = args?.filter
					? {
							OR: [
								{ description: { contains: args?.filter } },
								{ url: { contains: args?.filter } },
							],
					  }
					: {};

				const links = await prisma.link.findMany({
					where,
					take: take as number | undefined,
					skip: skip as number | undefined,
					orderBy: orderBy as Prisma.Enumerable<Prisma.LinkOrderByWithRelationInput> | undefined,
				});

				const count = await context.prisma.link.count({ where });
				const id = `main-feed:${JSON.stringify(args)}`;

				return {
					count,
					id,
					links,
				};
			},
		});

		t.nonNull.list.nonNull.field('getLinks', {
			type: 'Link',
			args: {
				id: nonNull(intArg()),
			},
			async resolve(parent, args, context, info) {
				const { id } = args;
				const { prisma } = context;

				const links: NexusGenObjects['Link'][] = await prisma.link.findMany();

				return links.filter((link) => link.id === id);
			},
		});
	},
});

export const linkMutation = extendType({
	type: 'Mutation',
	definition(t) {
		t.nonNull.list.nonNull.field('postLink', {
			type: 'Link',
			args: {
				description: nonNull(stringArg()),
				url: nonNull(stringArg()),
			},
			async resolve(parent, args, context, info) {
				const { description, url } = args;
				const { prisma } = context;
				const { userId } = context;

				if (!userId) {
					// 1
					throw new Error('Cannot post without logging in.');
				}

				const link = {
					description,
					url,
					postedBy: { connect: { id: userId } },
				};
				await prisma.link.create({ data: link });

				return await prisma.link.findMany();
			},
		});

		t.nonNull.list.nonNull.field('deleteLink', {
			type: 'Link',
			args: {
				id: nonNull(intArg()),
			},
			async resolve(parent, args, context, info) {
				const { id } = args;
				const { prisma } = context;

				await prisma.link.delete({ where: { id } }).catch((e) => {
					console.log(e);
				});

				return await prisma.link.findMany();
			},
		});
	},
});
