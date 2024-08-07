import { zodResolver } from "@hookform/resolvers/zod";
import {
	json,
	type ActionFunctionArgs,
	type LoaderFunctionArgs,
	type MetaFunction,
} from "@remix-run/node";
import { Form, useActionData, useLocation } from "@remix-run/react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
	RemixFormProvider,
	parseFormData,
	useRemixForm,
} from "remix-hook-form";
import { type z } from "zod";

import { Modal } from "~/components/common/Modal";
import { FormError } from "~/components/common/UI/FormError";
import { Input } from "~/components/common/UI/Input";
import { PARSED_ENV } from "~/consts/parsed-env.const";
import { useFilteredValues } from "~/hooks/useFilteredValues";
import i18next from "~/modules/i18next.server";
import { EditRecipeWithLangParamsSchema } from "~/schemas/params.schema";
import { SubRecipeDTOSchema } from "~/schemas/sub-recipe.schema";
import { type RemixHookFormSubmit } from "~/types/remix-hook-form-submit.type";
import { auth } from "~/utils/auth.server";
import {
	generateMetaDescription,
	generateMetaProps,
	generateMetaTitle,
} from "~/utils/helpers/meta-helpers";
import { translatedContent } from "~/utils/helpers/translated-content.server";
import { prisma } from "~/utils/prisma.server";
import { getThemeSession } from "~/utils/theme.server";

type FormData = z.infer<typeof SubRecipeDTOSchema>;
const resolver = zodResolver(SubRecipeDTOSchema);

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

	const { lang, recipeId } = EditRecipeWithLangParamsSchema.parse(p);

	const foundRecipe = await prisma.recipe.findUnique({
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
		title: t("common.addSomething", {
			something: `${t("recipe.field.subRecipe")}`.toLowerCase(),
		}),
		postfix: PARSED_ENV.APP_NAME,
	});
	const description = generateMetaDescription({
		description: t("seo.home.description", { appName: PARSED_ENV.APP_NAME }),
	});

	return json({
		meta: {
			title,
			description,
			url: `${PARSED_ENV.DOMAIN_URL}`,
			path: `/recipes/edit/${recipeId}/${lang}/sub-recipe`,
			theme: (await getThemeSession(request)).getTheme(),
		},
	});
};

const CreateSubRecipeModal = () => {
	const [isOpen, setIsOpen] = useState<boolean>(true);

	const actionData = useActionData<typeof action>();

	const { t } = useTranslation();
	const { pathname } = useLocation();

	const prevPath = pathname.split("/").slice(0, -1).join("/");

	const { onValid } = useFilteredValues<FormData>();
	const form = useRemixForm<FormData>({
		resolver,
		submitHandlers: {
			onValid,
		},
	});
	const {
		reset,
		handleSubmit,
		formState: { dirtyFields },
	} = form;

	return (
		<Modal
			CTAFn={handleSubmit as RemixHookFormSubmit}
			dismissFn={reset}
			isCTADisabled={!Object.keys(dirtyFields).length}
			isOpen={isOpen}
			prevPath={prevPath}
			setIsOpen={setIsOpen}
			success={actionData?.success}
			title={t("recipe.modal.create.subRecipe.title")}
		>
			<RemixFormProvider {...form}>
				<Form
					preventScrollReset
					autoComplete="off"
					className="flex flex-col gap-2"
					onSubmit={handleSubmit as RemixHookFormSubmit}
				>
					<Input
						autoFocus
						isRequired
						label={t("recipe.field.name")}
						name="name"
					/>
				</Form>
			</RemixFormProvider>
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

	const { lang, recipeId } = EditRecipeWithLangParamsSchema.parse(p);

	const data = await parseFormData<FormData>(request.clone());

	let success = true;

	return await prisma.subRecipe
		.create({
			data: {
				...data,
				...(await translatedContent({
					request,
					key: "name",
					lang,
					value: data.name,
				})),
				recipeId,
				userId: authData.id,
			},
		})
		.catch(() => (success = false))
		.then(() => json({ success }));
};

export default CreateSubRecipeModal;
