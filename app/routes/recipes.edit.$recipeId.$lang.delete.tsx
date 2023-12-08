import {
	json,
	redirect,
	type ActionFunctionArgs,
	type LoaderFunctionArgs,
	type MetaFunction,
} from "@remix-run/node";
import { useActionData, useLoaderData, useSubmit } from "@remix-run/react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { Modal } from "~/components/common/Modal";
import { FormError } from "~/components/common/UI/FormError";
import { PARSED_ENV } from "~/consts/parsed-env.const";
import i18next from "~/modules/i18next.server";
import { CloudinaryUploadApiResponseWithBlurHashSchema } from "~/schemas/cloudinary.schema";
import { LanguageSchema, TranslatedContentSchema } from "~/schemas/common";
import {
	EditRecipeParamsSchema,
	EditRecipeWithLangParamsSchema,
} from "~/schemas/params.schema";
import { auth } from "~/utils/auth.server";
import { deleteImage } from "~/utils/cloudinary.server";
import {
	generateMetaDescription,
	generateMetaProps,
	generateMetaTitle,
} from "~/utils/helpers/meta-helpers";
import { prisma } from "~/utils/prisma.server";

export const sitemap = () => ({
	exclude: true,
});

export const meta: MetaFunction<typeof loader> = ({ data }) => {
	return generateMetaProps(data?.meta);
};

export const loader = async ({ request, params: p }: LoaderFunctionArgs) => {
	const authData = await auth.isAuthenticated(request.clone());

	if (!authData) {
		throw new Response(null, { status: 401 });
	}

	const { recipeId, lang } = EditRecipeWithLangParamsSchema.parse(p);

	const foundRecipe = await prisma.recipe.findFirst({
		where: { id: recipeId },
	});

	if (!foundRecipe) {
		throw new Response(null, { status: 404 });
	}

	if (foundRecipe.userId !== authData.id && authData.role !== "ADMIN") {
		throw new Response(null, { status: 403 });
	}

	const t = await i18next.getFixedT(request);
	const title = generateMetaTitle({
		title: t("common.deleteSomething", {
			something: `${t("common.recipe")}`.toLowerCase(),
		}),
		postfix: PARSED_ENV.APP_NAME,
	});
	const description = generateMetaDescription({
		description: t("seo.home.description", { appName: PARSED_ENV.APP_NAME }),
	});

	return json({
		authData,
		foundRecipe,
		meta: {
			title,
			description,
			url: `${PARSED_ENV.DOMAIN_URL}/recipes/edit/${recipeId}/${lang}/delete`,
		},
	});
};

export const DeleteRecipeModal = () => {
	const { authData, foundRecipe } = useLoaderData<typeof loader>();
	const { id, name: n, userId, photo: p } = foundRecipe;

	const actionData = useActionData<typeof action>();

	const [isOpen, setIsOpen] = useState(true);

	const submit = useSubmit();
	const {
		t,
		i18n: { language: lang },
	} = useTranslation();

	const prevPath = `/users/${authData.id}`;

	const parsedName = z
		.string()
		.nullable()
		.optional()
		.parse(TranslatedContentSchema.parse(n)?.[LanguageSchema.parse(lang)]);
	const name =
		parsedName && parsedName.length > 47
			? parsedName.substring(0, 47) + "..."
			: parsedName;

	const photo = p && CloudinaryUploadApiResponseWithBlurHashSchema.parse(p);

	return (
		<Modal
			CTAFn={() =>
				submit(
					{ id, userId, ...(photo && { photo: photo.public_id }) },
					{ method: "delete" }
				)
			}
			CTALabel={t("common.confirm")}
			CTAVariant="danger"
			isOpen={isOpen}
			prevPath={prevPath}
			setIsOpen={setIsOpen}
			success={actionData?.success}
			title={t("recipe.modal.delete.recipe.title")}
		>
			{t(
				parsedName
					? "recipe.modal.delete.recipe.contentWithName"
					: "recipe.modal.delete.recipe.content",
				{ name }
			)}
			<FormError
				error={
					typeof actionData?.success === "boolean" && !actionData?.success
						? t("error.somethingWentWrong")
						: undefined
				}
			/>
		</Modal>
	);
};

export const action = async ({ request, params: p }: ActionFunctionArgs) => {
	const authData = await auth.isAuthenticated(request.clone(), {
		failureRedirect: "/401",
	});

	const formData = await request.formData();

	const { recipeId } = EditRecipeParamsSchema.parse(p);

	const id = formData.get("id")?.toString();
	const userId = formData.get("userId")?.toString();
	const photo = formData.get("photo")?.toString();

	if (
		id !== recipeId ||
		(userId !== authData.id && authData.role !== "ADMIN")
	) {
		redirect("/403");
	}

	let success = true;

	await Promise.all([
		photo && (await deleteImage(photo)),
		await prisma.recipe.delete({ where: { id: recipeId } }),
	]).catch(() => (success = false));

	return json({ success });
};

export default DeleteRecipeModal;
