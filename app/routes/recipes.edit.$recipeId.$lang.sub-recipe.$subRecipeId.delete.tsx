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
import { LanguageSchema, TranslatedContentSchema } from "~/schemas/common";
import { EditRecipeSubRecipeParamsSchema } from "~/schemas/params.schema";
import { auth } from "~/utils/auth.server";
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

	const { recipeId, lang, subRecipeId } =
		EditRecipeSubRecipeParamsSchema.parse(p);

	const foundSubRecipe = await prisma.subRecipe.findFirst({
		where: { id: subRecipeId },
	});

	if (!foundSubRecipe) {
		throw new Response(null, { status: 404 });
	}

	if (foundSubRecipe.userId !== authData.id && authData.role !== "ADMIN") {
		throw new Response(null, { status: 403 });
	}

	const t = await i18next.getFixedT(request);
	const title = generateMetaTitle({
		title: t("common.deleteSomething", {
			something: `${t("recipe.field.subRecipe")}`.toLowerCase(),
		}),
		postfix: PARSED_ENV.APP_NAME,
	});
	const description = generateMetaDescription({
		description: t("seo.home.description", { appName: PARSED_ENV.APP_NAME }),
	});

	return json({
		foundSubRecipe,
		meta: {
			title,
			description,
			url: `${PARSED_ENV.DOMAIN_URL}`,
			path: `/recipes/edit/${recipeId}/${lang}/sub-recipe/${subRecipeId}/delete`,
			theme: (await getThemeSession(request)).getTheme(),
		},
	});
};

const DeleteSubRecipeModal = () => {
	const { foundSubRecipe } = useLoaderData<typeof loader>();
	const { id, name: n, userId } = foundSubRecipe;

	const actionData = useActionData<typeof action>();

	const [isOpen, setIsOpen] = useState(true);

	const submit = useSubmit();
	const { pathname } = useLocation();
	const {
		t,
		i18n: { language: lang },
	} = useTranslation();

	const prevPath = pathname.split("/").slice(0, -3).join("/");

	const parsedName = z
		.string()
		.nullish()
		.parse(TranslatedContentSchema.parse(n)?.[LanguageSchema.parse(lang)]);
	const name =
		parsedName && parsedName.length > 47
			? parsedName.substring(0, 47) + "..."
			: parsedName;

	return (
		<Modal
			CTAFn={() => submit({ id, userId }, { method: "delete" })}
			CTALabel={t("common.confirm")}
			CTAVariant="danger"
			isOpen={isOpen}
			prevPath={prevPath}
			setIsOpen={setIsOpen}
			success={actionData?.success}
			title={t("recipe.modal.delete.subRecipe.title")}
		>
			{t(
				parsedName
					? "recipe.modal.delete.subRecipe.contentWithName"
					: "recipe.modal.delete.subRecipe.content",
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
	const authData = await auth.isAuthenticated(request.clone());

	if (!authData) {
		throw new Response(null, { status: 401 });
	}

	const formData = await request.formData();

	const { subRecipeId } = EditRecipeSubRecipeParamsSchema.parse(p);

	const id = formData.get("id")?.toString();
	const userId = formData.get("userId")?.toString();

	if (
		id !== subRecipeId ||
		(userId !== authData.id && authData.role !== "ADMIN")
	) {
		throw new Response(null, { status: 403 });
	}

	let success = true;

	return await prisma.subRecipe
		.delete({ where: { id: subRecipeId } })
		.catch(() => (success = false))
		.then(() => json({ success }));
};

export default DeleteSubRecipeModal;
