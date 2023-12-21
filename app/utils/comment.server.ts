import { type Prisma } from "@prisma/client";
import { type DefaultArgs } from "@prisma/client/runtime/library";
import { type z } from "zod";

import { REPORTED_QUERY } from "~/consts/only-reported.const";
import { LIMIT_FALLBACK, PAGE_FALLBACK } from "~/consts/pagination.const";
import { type PaginationSchema } from "~/schemas/pagination.schema";
import { isPageGreaterThanPageCount } from "~/utils/helpers/set-pagination.server";
import { prisma } from "~/utils/prisma.server";

interface RecipeDetailCommentProps {
	recipeId: string;
}

const jumbleUpComment = (string: string) => {
	const words = string.toLowerCase().split(" ");

	const mappedWords = words.map((word) =>
		word
			.split("")
			.sort(() => Math.random() - 0.5)
			.join("")
	);

	const randomizedWords = mappedWords.sort(() => Math.random() - 0.5);

	const jumbledComment = randomizedWords.join(" ");

	const capitalizedJumbledComment =
		jumbledComment.charAt(0).toUpperCase() + jumbledComment.slice(1);

	return capitalizedJumbledComment;
};

export const RecipeCommentUser = {
	select: {
		id: true,
		email: true,
		firstName: true,
		lastName: true,
		username: true,
		photo: true,
		prefersDisplayName: true,
	},
};

export const RecipeCommentInclude = {
	Children: {
		include: {
			Children: {
				include: {
					commentReports: { select: { id: true } },
					user: RecipeCommentUser,
				},
			},
			commentReports: { select: { id: true } },
			user: RecipeCommentUser,
		},
		orderBy: {
			createdAt: "asc",
		},
	},
	user: RecipeCommentUser,
	commentReports: true,
} satisfies Prisma.CommentInclude<DefaultArgs> | null | undefined;

export const recipeDetailComments = async ({
	recipeId,
}: RecipeDetailCommentProps) => {
	const foundComments = await prisma.comment.findMany({
		where: {
			recipeId,
			parentId: null,
		},
		include: RecipeCommentInclude,
		orderBy: {
			createdAt: "desc",
		},
	});

	const mappedComments = foundComments.map((comment) => {
		if (comment.Children.length) {
			comment.Children.map((childComment) => {
				if (childComment.isHidden) {
					childComment.content = jumbleUpComment(childComment.content);
				}

				return childComment;
			});
		}

		if (comment.isHidden) {
			comment.content = jumbleUpComment(comment.content);
		}

		return comment;
	});

	return mappedComments;
};

interface AdminDashboardCommentsProps {
	request: Request;
	pagination?: z.infer<typeof PaginationSchema>;
}

export const AdminDashboardCommentsInclude = {
	_count: { select: { Children: true } },
	user: RecipeCommentUser,
	recipe: {
		select: {
			id: true,
			name: true,
			slug: true,
		},
	},
	commentReports: { include: { user: RecipeCommentUser } },
} satisfies Prisma.CommentInclude<DefaultArgs> | null | undefined;

export const adminDashboardComments = async ({
	pagination = { page: PAGE_FALLBACK, limit: LIMIT_FALLBACK },
	request,
}: AdminDashboardCommentsProps) => {
	const { searchParams } = new URL(request.clone().url);

	const count = await prisma.comment.count({
		where: {
			...(searchParams.has(REPORTED_QUERY) &&
				searchParams.get(REPORTED_QUERY) === "true" && {
					commentReports: { some: {} },
				}),
		},
	});

	if (count <= 0) {
		return {
			items: [],
			pagination: { page: PAGE_FALLBACK, limit: LIMIT_FALLBACK, count: 0 },
		};
	}

	const { page, limit } = await isPageGreaterThanPageCount(
		pagination,
		count,
		request
	);

	const foundComments = await prisma.comment.findMany({
		where: {
			...(searchParams.has(REPORTED_QUERY) &&
				searchParams.get(REPORTED_QUERY) === "true" && {
					commentReports: { some: {} },
				}),
		},
		include: AdminDashboardCommentsInclude,
		skip: (page - 1) * limit,
		take: limit,
	});

	return {
		items: foundComments,
		pagination: {
			page,
			limit,
			count,
		},
	};
};
