import { zodResolver } from "@hookform/resolvers/zod";
import { Role } from "@prisma/client";
import {
	json,
	type ActionFunctionArgs,
	type LoaderFunctionArgs,
} from "@remix-run/node";
import { Form, NavLink, useFetcher } from "@remix-run/react";
import clsx from "clsx";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
	RemixFormProvider,
	parseFormData,
	useRemixForm,
} from "remix-hook-form";
import { type z } from "zod";

import { Button } from "~/components/common/UI/Button";
import { FormError } from "~/components/common/UI/FormError";
import { Textarea } from "~/components/common/UI/Textarea";
import {
	Comment,
	type HandleSubmitCommentProps,
} from "~/components/recipes/detail/Comment";
import { Rating } from "~/components/recipes/detail/Rating";
import { useFilteredValues } from "~/hooks/useFilteredValues";
import { useHydrated } from "~/hooks/useHydrated";
import { RecipeReviewsParamsSchema } from "~/schemas/params.schema";
import {
	RecipeCommentIdSchema,
	RecipeCommentSchema,
	RecipeRatingSchema,
	RecipeReportCommentSchema,
	RecipeReviewsIntentSchema,
	type RecipeReviewsSchema,
} from "~/schemas/recipe-reviews.schema";
import { type RemixHookFormSubmit } from "~/types/remix-hook-form-submit.type";
import { auth } from "~/utils/auth.server";
import { recipeDetailComments } from "~/utils/comment.server";
import { prisma } from "~/utils/prisma.server";

interface RecipeReviewsProps {
	recipeId: string;
}

export const sitemap = () => ({
	exclude: true,
});

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
	const authData = await auth.isAuthenticated(request);
	const { recipeId } = RecipeReviewsParamsSchema.parse(params);

	const foundRatings = await prisma.rating.findMany({ where: { recipeId } });
	const foundComments = await recipeDetailComments({ recipeId });
	const foundCommentsCount = await prisma.comment.count({
		where: { recipeId },
	});

	return json({
		authData,
		foundRatings,
		foundComments,
		foundCommentsCount,
		success: true,
		intent: "",
	});
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
	const authData = await auth.isAuthenticated(request);

	if (!authData) {
		throw new Response(null, { status: 401 });
	}

	const { recipeId } = RecipeReviewsParamsSchema.parse(params);

	const { intent, data } =
		await parseFormData<z.infer<typeof RecipeReviewsSchema>>(request);

	let success = true;

	switch (intent) {
		case "rating":
			{
				const { value, ratingId } = RecipeRatingSchema.parse(data);

				switch (request.method) {
					case "POST":
						{
							const ratedPreviously = await prisma.rating.findFirst({
								where: { recipeId, userId: authData.id },
							});

							if (ratedPreviously) {
								throw new Response(null, { status: 409 });
							}

							await prisma.rating
								.create({
									data: { value, recipeId, userId: authData.id },
								})
								.catch(() => (success = false));
						}

						break;
					case "PATCH":
						{
							const foundRating = await prisma.rating.findFirst({
								where: { id: ratingId },
							});

							if (authData.id !== foundRating?.userId) {
								throw new Response(null, { status: 403 });
							}

							await prisma.rating
								.update({ data: { value }, where: { id: ratingId } })
								.catch(() => (success = false));
						}

						break;
					default:
						success = false;

						break;
				}
			}

			break;
		case "new_comment":
		case "reply_comment":
		case "edit_comment":
			{
				const { content, commentId, parentId } =
					RecipeCommentSchema.parse(data);

				switch (intent) {
					case "new_comment":
						await prisma.comment
							.create({
								data: { content, recipeId, userId: authData.id },
							})
							.catch(() => (success = false));

						break;
					case "reply_comment":
						const parentComment = await prisma.comment.findUnique({
							where: { id: parentId },
						});

						if (!parentComment) {
							throw new Response(null, { status: 404 });
						}

						await prisma.comment
							.create({
								data: { content, parentId, recipeId, userId: authData.id },
							})
							.catch(() => (success = false));

						break;
					case "edit_comment":
						const foundComment = await prisma.comment.findUnique({
							where: { id: commentId },
						});

						if (
							foundComment?.userId !== authData.id &&
							authData.role !== Role.ADMIN
						) {
							throw new Response(null, { status: 403 });
						}

						if (!foundComment) {
							throw new Response(null, { status: 404 });
						}

						await prisma.comment
							.update({ data: { content }, where: { id: commentId } })
							.catch(() => {
								success = false;
							});

						break;
					default:
						success = false;

						break;
				}
			}

			break;
		case "hide_comment":
			{
				const { commentId } = RecipeCommentIdSchema.parse(data);

				const commentToHide = await prisma.comment.findUnique({
					where: { id: commentId },
				});

				if (!commentToHide || commentToHide.id !== commentId) {
					throw new Response(null, { status: 404 });
				}

				if (
					authData.id !== commentToHide.userId &&
					authData.role !== Role.ADMIN
				) {
					throw new Response(null, { status: 403 });
				}

				await prisma.comment
					.update({
						data: { isHidden: !commentToHide.isHidden },
						where: { id: commentId },
					})
					.catch(() => {
						success = false;
					});
			}

			break;
		case "delete_comment":
			{
				const { commentId } = RecipeCommentIdSchema.parse(data);

				const foundComment = await prisma.comment.findUnique({
					where: { id: commentId },
				});

				if (!foundComment) {
					throw new Response(null, { status: 404 });
				}

				if (
					authData.id !== foundComment.userId &&
					authData.role !== Role.ADMIN
				) {
					throw new Response(null, { status: 403 });
				}

				await prisma.comment
					.delete({
						where: { id: commentId },
					})
					.catch(() => {
						success = false;
					});
			}

			break;
		case "report_comment":
			{
				const { commentId, userId, reportId } =
					RecipeReportCommentSchema.parse(data);

				const foundComment = await prisma.comment.findUnique({
					where: { id: commentId },
				});

				if (!foundComment) {
					throw new Response(null, { status: 404 });
				}

				switch (request.method) {
					case "POST":
						await prisma.commentReport
							.create({ data: { commentId, recipeId, userId } })
							.catch(() => {
								success = false;
							});

						break;
					case "DELETE":
						await prisma.commentReport
							.delete({ where: { id: reportId } })
							.catch(() => {
								success = false;
							});

						break;
					default:
						success = false;
						break;
				}
			}

			break;
		default:
			success = false;

			break;
	}

	const foundRatings = await prisma.rating.findMany({ where: { recipeId } });
	const foundComments = await recipeDetailComments({ recipeId });
	const foundCommentsCount = await prisma.comment.count({
		where: { recipeId },
	});

	return json({
		authData,
		foundComments,
		foundCommentsCount,
		foundRatings,
		success,
		intent,
	});
};

type FormData = z.infer<typeof RecipeCommentSchema>;
const resolver = zodResolver(RecipeCommentSchema);

export const RecipeReviews = ({ recipeId }: RecipeReviewsProps) => {
	const [isReplyingTo, setIsReplyingTo] = useState<string | null>(null);

	const reviewFetcher = useFetcher<typeof loader>();
	const reviewFetcherRef = useRef(reviewFetcher);

	const isHydrated = useHydrated();

	const authData = useMemo(
		() => reviewFetcher.data?.authData,
		[reviewFetcher.data?.authData]
	);

	const ratings = useMemo(
		() => reviewFetcher.data?.foundRatings,
		[reviewFetcher.data?.foundRatings]
	);
	const avgRating = useMemo(
		() =>
			Number(
				(ratings && ratings.length > 0
					? ratings?.reduce((prev, curr) => prev + curr.value, 0) /
						ratings?.length
					: 0
				).toFixed(2)
			),
		[ratings]
	);
	const userRating = useMemo(
		() =>
			ratings &&
			ratings.length > 0 &&
			authData &&
			ratings.find((rating) => rating.userId === authData.id),
		[authData, ratings]
	);

	const comments = useMemo(
		() => reviewFetcher.data?.foundComments,
		[reviewFetcher.data?.foundComments]
	);
	const commentsCount = useMemo(
		() => reviewFetcher.data?.foundCommentsCount,
		[reviewFetcher.data?.foundCommentsCount]
	);

	const success = useMemo(
		() => reviewFetcher.data?.success,
		[reviewFetcher.data?.success]
	);

	const intent = useMemo(
		() =>
			RecipeReviewsIntentSchema.optional().parse(reviewFetcher.data?.intent),
		[reviewFetcher.data?.intent]
	);

	const isLoading = useMemo(
		() =>
			!isHydrated ||
			((typeof intent === "undefined" || intent === "") &&
				reviewFetcher.state === "loading"),
		[intent, isHydrated, reviewFetcher.state]
	);

	const { t } = useTranslation();

	const { filterUndefined } = useFilteredValues<FormData>();
	const form = useRemixForm<FormData>({
		resolver,
		submitHandlers: {
			onValid: (data) => {
				handleSubmitComment(RecipeCommentSchema.parse(filterUndefined(data)));
				reset();
			},
		},
	});
	const {
		formState: { dirtyFields },
		reset,
		handleSubmit,
	} = form;

	const handleRating = (value: number) => {
		reviewFetcherRef.current.submit(
			{
				intent: "rating",
				data: JSON.stringify({
					value,
					...(userRating && { ratingId: userRating.id }),
				}),
			},
			{
				method: userRating ? "PATCH" : "POST",
				action: `/resources/recipes/${recipeId}/reviews`,
			}
		);
	};

	const handleSubmitComment = ({
		content,
		commentId,
		parentId,
		intent = "new_comment",
	}: HandleSubmitCommentProps) => {
		reviewFetcherRef.current.submit(
			{
				intent,
				data: JSON.stringify({
					...(commentId && { commentId }),
					content,
					...(parentId && { parentId }),
				}),
			},
			{
				method: commentId ? "PATCH" : "POST",
				action: `/resources/recipes/${recipeId}/reviews`,
			}
		);
	};

	const handleToggleHideComment = ({ commentId }: { commentId: string }) => {
		reviewFetcherRef.current.submit(
			{
				intent: "hide_comment",
				data: JSON.stringify({
					commentId,
				}),
			},
			{
				method: "PATCH",
				action: `/resources/recipes/${recipeId}/reviews`,
			}
		);
	};

	const handleDeleteComment = ({ commentId }: { commentId: string }) => {
		reviewFetcherRef.current.submit(
			{
				intent: "delete_comment",
				data: JSON.stringify({
					commentId,
				}),
			},
			{
				method: "DELETE",
				action: `/resources/recipes/${recipeId}/reviews`,
			}
		);
	};

	const handleReportComment = ({
		commentId,
		userId,
		reportId,
	}: z.infer<typeof RecipeReportCommentSchema>) => {
		reviewFetcherRef.current.submit(
			{
				intent: "report_comment",
				data: JSON.stringify({
					commentId,
					userId,
					reportId,
				}),
			},
			{
				method: reportId ? "DELETE" : "POST",
				action: `/resources/recipes/${recipeId}/reviews`,
			}
		);
	};

	useEffect(() => {
		reviewFetcherRef.current = reviewFetcher;
	}, [reviewFetcher]);

	useEffect(() => {
		if (reviewFetcherRef.current.state === "idle") {
			reviewFetcherRef.current.load(`/resources/recipes/${recipeId}/reviews`);
		}
	}, [recipeId]);

	return (
		<section className="col-span-2 flex flex-col gap-3">
			<h2 className="text-xl typography-medium">
				{t("recipe.section.reviews.title")}
			</h2>
			<div className="flex flex-col gap-1.5 p-3 bg-secondary dark:bg-primary rounded-2xl shadow-lg transition-colors">
				<div className="flex flex-col gap-3">
					{authData && (
						<RemixFormProvider {...form}>
							<Form preventScrollReset autoComplete="off" id="review-hook-form">
								<Textarea
									aria-label={t("recipe.section.reviews.comments.comment")}
									className="rounded-xl"
									label=""
									name="content"
									placeholder={t(
										"recipe.section.reviews.comments.commentTextareaPlaceholder"
									)}
								/>
								<FormError
									error={
										typeof success === "boolean" && !success
											? t("error.somethingWentWrong")
											: undefined
									}
								/>
							</Form>
						</RemixFormProvider>
					)}
					<div className="flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center gap-3">
						<Rating
							avgRating={avgRating}
							handleRating={handleRating}
							isAuthenticated={!!authData}
						/>
						{isLoading ? (
							<Button isLoading rounded="large" variant="normal">
								<div className="opacity-0">{t("common.submit")}</div>
							</Button>
						) : authData ? (
							<Button
								isDisabled={
									!Object.keys(dirtyFields).length ||
									reviewFetcherRef.current.state !== "idle"
								}
								rounded="large"
								variant="normal"
								onClick={handleSubmit as RemixHookFormSubmit}
							>
								{t("common.submit")}
							</Button>
						) : (
							<Button rounded="large" tabIndex={-1} variant="normal">
								<NavLink to="/login">
									{t("recipe.section.reviews.loginCTA")}
								</NavLink>
							</Button>
						)}
					</div>
					<div>
						<span
							className={clsx(
								isLoading && "bg-dark dark:bg-light rounded animate-pulse"
							)}
						>
							{t("recipe.section.reviews.rating.count", {
								count: ratings?.length ?? 0,
							})}
						</span>
						<span> | </span>
						<span
							className={clsx(
								isLoading && "bg-dark dark:bg-light rounded animate-pulse"
							)}
						>
							{t("recipe.section.reviews.comments.count", {
								count: commentsCount ?? 0,
							})}
						</span>
					</div>
					{comments?.map((comment) => (
						<Comment
							key={`Comment__${comment.id}`}
							authData={authData}
							comment={comment}
							formData={reviewFetcherRef.current.formData}
							handleDeleteComment={handleDeleteComment}
							handleReportComment={handleReportComment}
							handleSubmitComment={handleSubmitComment}
							handleToggleHideComment={handleToggleHideComment}
							intent={intent ?? ""}
							isReplyingTo={isReplyingTo}
							ratings={ratings}
							setIsReplyingTo={setIsReplyingTo}
							success={success}
						/>
					))}
				</div>
			</div>
		</section>
	);
};
