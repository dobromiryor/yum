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
import { PARSED_ENV } from "~/consts/parsed-env.const";
import i18next from "~/modules/i18next.server";
import { LanguageSchema, TranslatedContentSchema } from "~/schemas/common";
import { EditRecipeStepParamsSchema } from "~/schemas/params.schema";
import { auth } from "~/utils/auth.server";
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

	const { stepId, lang, recipeId } = EditRecipeStepParamsSchema.parse(p);

	const foundStep = await prisma.step.findFirst({
		where: { id: stepId },
	});

	if (!foundStep) {
		throw new Response(null, { status: 404 });
	}

	if (foundStep.userId !== authData.id && authData.role !== "ADMIN") {
		throw new Response(null, { status: 403 });
	}

	const t = await i18next.getFixedT(request);
	const title = generateMetaTitle({
		title: t("common.deleteSomething", {
			something: `${t("recipe.field.step")}`.toLowerCase(),
		}),
		postfix: PARSED_ENV.APP_NAME,
	});
	const description = generateMetaDescription({
		description: t("seo.home.description", { appName: PARSED_ENV.APP_NAME }),
	});

	return json({
		foundStep,
		meta: {
			title,
			description,
			url: `${PARSED_ENV.DOMAIN_URL}/recipes/edit/${recipeId}/${lang}/step/${stepId}/delete`,
		},
	});
};

const DeleteStepModal = () => {
	const { foundStep } = useLoaderData<typeof loader>();
	const { id, content, userId } = foundStep;

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
		.parse(
			TranslatedContentSchema.parse(content)?.[LanguageSchema.parse(lang)]
		);
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
			title={t("recipe.modal.delete.step.title")}
		>
			{t(
				parsedName
					? "recipe.modal.delete.step.contentWithName"
					: "recipe.modal.delete.step.content",
				{ name }
			)}
		</Modal>
	);
};

export const action = async ({ request, params: p }: ActionFunctionArgs) => {
	const authData = await auth.isAuthenticated(request.clone());

	if (!authData) {
		throw new Response(null, { status: 401 });
	}

	const formData = await request.formData();

	const { stepId } = EditRecipeStepParamsSchema.parse(p);

	const id = formData.get("id")?.toString();
	const userId = formData.get("userId")?.toString();

	if (id !== stepId || (userId !== authData.id && authData.role !== "ADMIN")) {
		throw new Response(null, { status: 403 });
	}

	try {
		await prisma.step.delete({ where: { id: stepId } });
	} catch (error) {
		console.error(error);

		return json({ success: false, error });
	}

	return json({ success: true });
};

export default DeleteStepModal;
