import { Prisma } from "@prisma/client";
import {
	json,
	type ActionFunctionArgs,
	type LoaderFunctionArgs,
	type MetaFunction,
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
import { PARSED_ENV } from "~/consts/parsed-env.const";
import i18next from "~/modules/i18next.server";
import { CloudinaryUploadApiResponseWithBlurHashSchema } from "~/schemas/cloudinary.schema";
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
import { getThemeSession } from "~/utils/theme.server";

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
			something: `${t("recipe.field.photo")}`.toLowerCase(),
		}),
		postfix: PARSED_ENV.APP_NAME,
	});
	const description = generateMetaDescription({
		description: t("seo.home.description", { appName: PARSED_ENV.APP_NAME }),
	});

	return json({
		foundRecipe,
		meta: {
			title,
			description,
			url: `${PARSED_ENV.DOMAIN_URL}`,
			path: `/recipes/edit/${recipeId}/${lang}/photo/delete`,
			theme: (await getThemeSession(request)).getTheme(),
		},
	});
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
	const authData = await auth.isAuthenticated(request.clone());

	if (!authData) {
		throw new Response(null, { status: 401 });
	}

	const { recipeId } = EditRecipeParamsSchema.parse(p);
	const foundRecipe = await prisma.recipe.findUnique({
		where: { id: recipeId },
	});

	if (!foundRecipe) {
		throw new Response(null, { status: 404 });
	}

	if (foundRecipe.userId !== authData.id && authData.role !== "ADMIN") {
		throw new Response(null, { status: 403 });
	}

	const photo = z.string().parse((await request.formData()).get("photo"));

	let success = true;

	return await Promise.all([
		await deleteImage(photo),
		await prisma.recipe.update({
			data: { photo: Prisma.JsonNull },
			where: {
				id: recipeId,
			},
		}),
	])
		.catch(() => (success = false))
		.then(() => json({ success }));
};

export default DeletePhotoModal;
