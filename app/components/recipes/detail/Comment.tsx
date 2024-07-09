import { zodResolver } from "@hookform/resolvers/zod";
import {
	DisplayName,
	Role,
	type Prisma,
	type Rating,
	type User,
} from "@prisma/client";
import { type SerializeFrom } from "@remix-run/node";
import { Form, Link, useLocation } from "@remix-run/react";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import {
	useEffect,
	useMemo,
	useRef,
	useState,
	type Dispatch,
	type FormEvent,
	type SetStateAction,
} from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { RemixFormProvider, useRemixForm } from "remix-hook-form";
import { type z } from "zod";

import { Avatar } from "~/components/common/Avatar";
import { MenuWrapper, useMenu } from "~/components/common/Menu/Menu";
import { Pill } from "~/components/common/Pill";
import { TooltipWrapper } from "~/components/common/Tooltip";
import { Button } from "~/components/common/UI/Button";
import { Icon } from "~/components/common/UI/Icon";
import { Textarea } from "~/components/common/UI/Textarea";
import { Star } from "~/components/recipes/detail/Star";
import { RATING_ARR } from "~/consts/rating.const";
import { useFilteredValues } from "~/hooks/useFilteredValues";
import { useHydrated } from "~/hooks/useHydrated";
import { LanguageSchema } from "~/schemas/common";
import {
	RecipeCommentSchema,
	RecipeReviewsSchema,
	type RecipeReportCommentSchema,
	type RecipeReviewsIntentSchema,
} from "~/schemas/recipe-reviews.schema";
import { type RemixHookFormSubmit } from "~/types/remix-hook-form-submit.type";
import { type RecipeCommentInclude } from "~/utils/comment.server";
import { getCommentId } from "~/utils/helpers/get-comment-id";
import { getDisplayName } from "~/utils/helpers/get-display-name";

type PrismaComment = Prisma.CommentGetPayload<{
	include: typeof RecipeCommentInclude;
}>;

export type CommentType = SerializeFrom<PrismaComment>;

export interface HandleSubmitCommentProps {
	content: string;
	commentId?: string;
	parentId?: string;
	intent?: z.infer<typeof RecipeReviewsIntentSchema>;
}

interface CommentProps {
	authData: SerializeFrom<User> | null | undefined;
	comment: CommentType;
	ratings?: SerializeFrom<Rating>[];
	handleSubmitComment: (props: HandleSubmitCommentProps) => void;
	handleToggleHideComment: (props: { commentId: string }) => void;
	handleDeleteComment: (props: { commentId: string }) => void;
	handleReportComment: (
		props: z.infer<typeof RecipeReportCommentSchema>
	) => void;
	success: boolean | undefined;
	intent: z.infer<typeof RecipeReviewsIntentSchema>;
	formData: FormData | undefined;
	isReplyingTo: string | null;
	setIsReplyingTo: Dispatch<SetStateAction<string | null>>;
}

type HookFormData = z.infer<typeof RecipeCommentSchema>;
const resolver = zodResolver(RecipeCommentSchema);

export const Comment = ({
	authData,
	comment,
	ratings,
	handleToggleHideComment,
	handleDeleteComment,
	handleSubmitComment,
	handleReportComment,
	intent,
	success,
	formData,
	isReplyingTo,
	setIsReplyingTo,
}: CommentProps) => {
	const [isEditing, setIsEditing] = useState<boolean>(false);
	const [hasErrored, setHasErrored] = useState<boolean>(false);

	const commentRef = useRef<HTMLDivElement>(null);

	const {
		t,
		i18n: { language },
	} = useTranslation();
	const { hash } = useLocation();

	const hydrated = useHydrated();
	const [, { setIsOpen: setIsDeletePromptOpen }] = useMenu();

	const locale = LanguageSchema.parse(language);

	const deletedUserFallback = {
		email: "deleted@user.com",
		firstName: t("recipe.section.reviews.comments.deletedUser.firstName"),
		lastName: t("recipe.section.reviews.comments.deletedUser.lastName"),
		username: "deleted_user",
		prefersDisplayName: DisplayName.names,
	};

	const userRating = useMemo(
		() =>
			ratings && ratings.length > 0 && comment.user
				? ratings.find((rating) => rating.userId === comment.user?.id)?.value ??
					0
				: 0,
		[comment.user, ratings]
	);

	const { filterUndefined } = useFilteredValues<HookFormData>();
	const editForm = useRemixForm<HookFormData>({
		defaultValues: {
			intent: "edit_comment",
			content: comment.content,
			commentId: comment.id,
		},
		resolver,
		submitHandlers: {
			onValid: (data) => {
				handleSubmitComment(RecipeCommentSchema.parse(filterUndefined(data)));
			},
		},
	});
	const replyForm = useRemixForm<HookFormData>({
		defaultValues: {
			intent: "reply_comment",
			content: "",
			parentId: comment.parentId ?? comment.id,
		},
		resolver,
		submitHandlers: {
			onValid: (data) => {
				handleSubmitComment(RecipeCommentSchema.parse(filterUndefined(data)));
			},
		},
	});

	const handleSubmit = () => {
		if (isEditing) {
			setHasErrored(false);
			setIsEditing((prev) => !prev);
			editForm.handleSubmit({} as unknown as FormEvent<HTMLFormElement>);
		}

		if (isReplyingTo) {
			setHasErrored(false);
			setIsReplyingTo(null);
			replyForm.handleSubmit({} as unknown as FormEvent<HTMLFormElement>);
			replyForm.reset();
		}
	};

	const handleReset = () => {
		if (isEditing) {
			setIsEditing((prev) => !prev);
			editForm.reset();
		}

		if (isReplyingTo) {
			setIsReplyingTo(null);
			replyForm.reset();
		}
	};

	const optimisticComment = useMemo(
		() =>
			intent === "edit_comment" && formData
				? RecipeCommentSchema.parse(
						JSON.parse(
							RecipeReviewsSchema.parse(Object.fromEntries(formData.entries()))
								.data
						)
					)
				: undefined,
		[formData, intent]
	);

	const commentContent = useMemo(() => {
		if (typeof success === "undefined") {
			if (optimisticComment?.commentId === comment.id) {
				return optimisticComment?.content;
			} else {
				return comment.content;
			}
		} else if (!success) {
			if (optimisticComment?.commentId === comment.id) {
				setHasErrored(true);
			}

			return comment.content;
		} else {
			return comment.content;
		}
	}, [comment, optimisticComment, success]);

	let portal = null;

	if (typeof document !== "undefined") {
		portal = document.body;
	}

	useEffect(() => {
		if (`#${commentRef.current?.id}` === hash) {
			commentRef.current?.scrollIntoView({ behavior: "smooth" });
			commentRef.current?.focus();
		}
	}, [hash]);

	return (
		<div
			ref={commentRef}
			className="flex flex-col gap-2 rounded-lg"
			id={getCommentId(comment.id)}
		>
			<div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-0.5">
				<div className="flex items-center gap-2">
					{comment.userId && comment.user ? (
						<Link to={`/users/${comment.userId}`}>
							<Avatar size="32" user={comment.user ?? null} />
						</Link>
					) : (
						<Avatar size="32" user={comment.user ?? null} />
					)}
					<div className="flex flex-col">
						<div className="flex flex-col xs:flex-row xs:items-center gap-0.5 xs:gap-2">
							{comment.userId && comment.user ? (
								<Link
									className="typography-medium"
									to={`/users/${comment.userId}`}
								>
									{getDisplayName(comment.user)}
								</Link>
							) : (
								<span className="typography-medium cursor-default">
									{getDisplayName(deletedUserFallback)}
								</span>
							)}
							<TooltipWrapper
								className="flex gap-1 shrink grow-0"
								content={t("common.lastUpdate", {
									date: new Date(comment.updatedAt).toLocaleString(locale),
									interpolation: { escapeValue: false },
								})}
							>
								<span className="text-xs cursor-default">
									{new Date(comment.createdAt).toLocaleDateString(locale)}
								</span>
								{comment.createdAt < comment.updatedAt && (
									<Icon name="draft_orders" />
								)}
							</TooltipWrapper>
						</div>
						{userRating > 0 && (
							<div className="flex gap-0.5">
								{RATING_ARR.map((item, index) => (
									<Star
										key={`User__${comment.user?.id ?? 0}__Comment__${
											comment.id
										}__Rating__${userRating}__Star__${index}`}
										currentValue={
											typeof userRating === "number" ? userRating : 0
										}
										height={16}
										value={item}
										width={16}
									/>
								))}
							</div>
						)}
					</div>
				</div>
			</div>
			<div className="relative">
				{isEditing ? (
					<RemixFormProvider {...editForm}>
						<Form preventScrollReset autoComplete="off">
							<Textarea
								aria-label={t("recipe.section.reviews.comments.comment")}
								autoFocus={isEditing}
								className="rounded-xl"
								label=""
								name="content"
								placeholder={t(
									"recipe.section.reviews.comments.commentTextareaPlaceholder"
								)}
							/>
							<input hidden readOnly name="intent" />
							<input hidden readOnly name="commentId" />
						</Form>
					</RemixFormProvider>
				) : (
					<>
						<span
							aria-hidden={comment.isHidden}
							className={clsx(
								comment.isHidden && "blur-sm pointer-events-none select-none"
							)}
						>
							{commentContent}
						</span>
						{comment.isHidden && (
							<div className="absolute inset-0 flex justify-center items-center opacity-0 hover:opacity-100 transition-opacity select-none">
								<span className="drop-shadow">
									{t("recipe.section.reviews.comments.hiddenComment")}
								</span>
							</div>
						)}
					</>
				)}
			</div>
			{authData &&
				(isEditing ? (
					<div className="ml-auto flex gap-1 flex-wrap">
						<Button
							rounded="full"
							size="small"
							variant="normal"
							onClick={handleReset}
						>
							<Pill icon="cancel" label={t("common.cancel")} padding="none" />
						</Button>
						<Button
							isDisabled={!Object.keys(editForm.formState.dirtyFields).length}
							rounded="full"
							size="small"
							variant="normal"
							onClick={handleSubmit as RemixHookFormSubmit}
						>
							<Pill icon="save" label={t("common.save")} padding="none" />
						</Button>
					</div>
				) : (
					<div className="flex gap-1 flex-wrap">
						<Button
							rounded="full"
							size="small"
							variant="normal"
							onClick={() => {
								replyForm.reset();
								setIsReplyingTo(comment.id);
								setIsEditing(false);
							}}
						>
							<Pill
								icon="reply"
								label={t("recipe.section.reviews.comments.reply")}
								padding="none"
							/>
						</Button>

						{(authData.id === comment.userId || authData.role === Role.ADMIN) &&
							!comment.isHidden && (
								<Button
									rounded="full"
									size="small"
									variant="normal"
									onClick={() => {
										setIsEditing((prev) => !prev);
										setIsReplyingTo(null);
									}}
								>
									<Pill icon="edit" label={t("common.edit")} padding="none" />
								</Button>
							)}
						{(authData.id === comment.userId ||
							authData.role === Role.ADMIN) && (
							<Button
								rounded="full"
								size="small"
								variant="normal"
								onClick={() =>
									handleToggleHideComment({ commentId: comment.id })
								}
							>
								<Pill
									icon={comment.isHidden ? "visibility" : "visibility_off"}
									label={t(comment.isHidden ? "common.show" : "common.hide")}
									padding="none"
								/>
							</Button>
						)}
						{(authData.id === comment.userId ||
							authData.role === Role.ADMIN) && (
							<MenuWrapper
								menuChildren={[
									<div
										key={`Comment__Delete__Prompt__${comment.id}`}
										className="max-w-64"
									>
										<p>
											{t(
												comment.Children.length > 0
													? "recipe.section.reviews.comments.deleteCommentWithRepliesPrompt"
													: "recipe.section.reviews.comments.deleteCommentPrompt"
											)}
										</p>
										<div className="flex gap-2 justify-end">
											<Button
												rounded="large"
												size="small"
												variant="normal"
												onClick={() => setIsDeletePromptOpen(false)}
											>
												{t("common.cancel")}
											</Button>
											<Button
												rounded="large"
												size="small"
												variant="danger"
												onClick={() => {
													setIsDeletePromptOpen(false);
													handleDeleteComment({ commentId: comment.id });
												}}
											>
												{t("common.delete")}
											</Button>
										</div>
									</div>,
								]}
								y="top"
							>
								<Pill icon="delete" label={t("common.delete")} />
							</MenuWrapper>
						)}
						{(authData.id !== comment.userId || authData.role === Role.ADMIN) &&
							!comment.isHidden && (
								<Button
									isDisabled={
										!!comment.commentReports?.length &&
										authData.role !== Role.ADMIN
									}
									rounded="full"
									size="small"
									variant="normal"
									onClick={() =>
										handleReportComment({
											commentId: comment.id,
											userId: authData.id,
											reportId: comment.commentReports?.[0]?.id,
										})
									}
								>
									<Pill
										icon={
											comment.commentReports?.length > 0
												? "flag_circle"
												: "flag"
										}
										label={t(
											comment.commentReports?.length > 0
												? authData.role === Role.ADMIN
													? "recipe.section.reviews.comments.resolve"
													: "recipe.section.reviews.comments.reported"
												: "recipe.section.reviews.comments.report"
										)}
										padding="none"
									/>
								</Button>
							)}
						{hasErrored && (
							<Pill
								icon="error"
								label={t("common.error")}
								tooltip={t("error.somethingWentWrong")}
								variant="error"
							/>
						)}
					</div>
				))}
			{comment.Children.length > 0 && (
				<div className="flex flex-col gap-1 ml-10">
					{comment.Children.map((childComment) => (
						<Comment
							key={`Comment__${comment.id}__Child__${childComment.id}`}
							authData={authData}
							comment={childComment as CommentType}
							formData={formData}
							handleDeleteComment={handleDeleteComment}
							handleReportComment={handleReportComment}
							handleSubmitComment={handleSubmitComment}
							handleToggleHideComment={handleToggleHideComment}
							intent={intent}
							isReplyingTo={isReplyingTo}
							ratings={ratings}
							setIsReplyingTo={setIsReplyingTo}
							success={success}
						/>
					))}
				</div>
			)}
			{portal && hydrated
				? createPortal(
						<AnimatePresence initial={false}>
							{isReplyingTo === comment.id && (
								<motion.div
									key={`Motion__Reply__Drawer__${comment.id}`}
									animate={{ translateY: 0, opacity: 1 }}
									className={clsx(
										"sticky bottom-0 flex flex-col gap-2 mx-4 p-3 rounded-t-2xl drop-shadow-2xl shadow-2xl backdrop-blur",
										"bg-primary/40 backdrop-brightness-110",
										"dark:bg-primary/75 dark:backdrop-brightness-125"
									)}
									exit={{ translateY: 8, opacity: 0 }}
									initial={{ translateY: 8, opacity: 0 }}
								>
									<RemixFormProvider {...replyForm}>
										<Form preventScrollReset autoComplete="off">
											<Textarea
												aria-label={t("recipe.section.reviews.comments.reply")}
												autoFocus={!!isReplyingTo}
												className="rounded-xl"
												label=""
												name="content"
												placeholder={t(
													"recipe.section.reviews.comments.replyTextareaPlaceholder"
												)}
											/>
											<input hidden readOnly name="intent" />
											<input hidden readOnly name="parentId" />
										</Form>
									</RemixFormProvider>
									<div className="flex justify-between items-center flex-wrap gap-1">
										<div className="flex items-center gap-1">
											<Icon name="reply" size="14" />
											<span className="text-xs">
												{t("recipe.section.reviews.comments.replyingTo", {
													comment:
														comment.content.length > 16
															? `${comment.content.slice(0, 16)}...`
															: comment.content,
													interpolation: { escapeValue: false },
												})}
											</span>
										</div>
										<div className="flex gap-1 ml-auto">
											<Button
												rounded="full"
												size="small"
												variant="normal"
												onClick={handleReset}
											>
												<Pill
													icon="cancel"
													label={t("common.cancel")}
													padding="none"
												/>
											</Button>
											<Button
												isDisabled={
													!Object.keys(replyForm.formState.dirtyFields).length
												}
												rounded="full"
												size="small"
												variant="normal"
												onClick={handleSubmit as RemixHookFormSubmit}
											>
												<Pill
													icon="save"
													label={t("recipe.section.reviews.comments.reply")}
													padding="none"
												/>
											</Button>
										</div>
									</div>
								</motion.div>
							)}
						</AnimatePresence>,
						portal
					)
				: null}
		</div>
	);
};
