import { Prisma } from "@prisma/client";
import {
	json,
	redirect,
	type ActionFunctionArgs,
	type LoaderFunctionArgs,
} from "@remix-run/node";
import {
	useActionData,
	useLoaderData,
	useLocation,
	useSubmit,
} from "@remix-run/react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { Modal } from "~/components/common/Modal";
import { FormError } from "~/components/common/UI/FormError";
import i18next from "~/modules/i18next.server";
import { CloudinaryUploadApiResponseWithBlurHashSchema } from "~/schemas/cloudinary.schema";
import { RecipeParamsSchema } from "~/schemas/params.schema";
import { auth } from "~/utils/auth.server";
import { deleteImage } from "~/utils/cloudinary.server";
import { errorCatcher } from "~/utils/helpers/error-catcher.server";
import { prisma } from "~/utils/prisma.server";

export const loader = async ({ request, params: p }: LoaderFunctionArgs) => {
	const authData = await auth.isAuthenticated(request.clone(), {
		failureRedirect: "/login",
	});

	const { recipeId } = RecipeParamsSchema.parse(p);

	const foundRecipe = await prisma.recipe.findFirst({
		where: { id: recipeId },
	});

	if (
		!foundRecipe ||
		(foundRecipe.userId !== authData.id && authData.role !== "ADMIN")
	) {
		return redirect("/recipes");
	}

	return json({ foundRecipe });
};

const DeletePhotoModal = () => {
	const [isOpen, setIsOpen] = useState(true);

	const { foundRecipe } = useLoaderData<typeof loader>();
	const photo = CloudinaryUploadApiResponseWithBlurHashSchema.parse(
		foundRecipe.photo
	);
	const actionData = useActionData<typeof action>();

	const submit = useSubmit();
	const { pathname } = useLocation();
	const { t } = useTranslation();

	const prevPath = pathname.split("/").slice(0, -2).join("/");

	return (
		<Modal
			CTAFn={() => submit({ photo: photo.public_id }, { method: "delete" })}
			CTALabel={t("common.confirm")}
			CTAVariant="danger"
			isOpen={isOpen}
			prevPath={prevPath}
			setIsOpen={setIsOpen}
			success={actionData?.success}
			title={t("recipe.modal.delete.photo.title")}
		>
			{t("recipe.modal.delete.photo.content")}
			<FormError error={actionData?.formError} />
		</Modal>
	);
};

export const action = async ({ request, params: p }: ActionFunctionArgs) => {
	const authData = await auth.isAuthenticated(request.clone(), {
		failureRedirect: "/login",
	});

	const t = await i18next.getFixedT(request);

	const { recipeId } = RecipeParamsSchema.parse(p);
	const foundRecipe = await prisma.recipe.findUnique({
		where: { id: recipeId },
	});

	if (
		!foundRecipe ||
		(foundRecipe.userId !== authData.id && authData.role !== "ADMIN")
	) {
		redirect("/recipes");
	}

	const clonedRequest = request.clone();
	const photo = z.string().parse((await request.formData()).get("photo"));

	const isImageDeleted = await deleteImage(photo);

	if (!isImageDeleted) {
		return errorCatcher(clonedRequest, t("error.somethingWentWrong"));
	}

	await prisma.recipe
		.update({
			data: { photo: Prisma.JsonNull },
			where: {
				id: recipeId,
			},
		})
		.catch((formError) => errorCatcher(request, formError));

	return json({ success: true, formError: undefined as string | undefined });
};

export default DeletePhotoModal;
