import { zodResolver } from "@hookform/resolvers/zod";
import {
	json,
	type ActionFunctionArgs,
	type LoaderFunctionArgs,
	type MetaFunction,
} from "@remix-run/node";
import {
	Form,
	useActionData,
	useLoaderData,
	useLocation,
	useNavigation,
} from "@remix-run/react";
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
import { TranslatedContentSchema } from "~/schemas/common";
import { EditRecipeSubRecipeParamsSchema } from "~/schemas/params.schema";
import { SubRecipeDTOSchema } from "~/schemas/sub-recipe.schema";
import { type RemixHookFormSubmit } from "~/types/remix-hook-form-submit.type";
import { auth } from "~/utils/auth.server";
import { getDataSession } from "~/utils/dataStorage.server";
import { getInvertedLang } from "~/utils/helpers/get-inverted-lang";
import { subRecipeLanguageValidation } from "~/utils/helpers/language-validation.server";
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

	const { name } = foundSubRecipe;
	const { setData, commit } = await getDataSession(request);

	setData({ name });

	const validation = subRecipeLanguageValidation({ name });

	const invertedLang = getInvertedLang(lang);

	const t = await i18next.getFixedT(request);
	const title = generateMetaTitle({
		title: t("common.editSomething", {
			something: `${t("recipe.field.subRecipe")}`.toLowerCase(),
		}),
		postfix: PARSED_ENV.APP_NAME,
	});
	const description = generateMetaDescription({
		description: t("seo.home.description", { appName: PARSED_ENV.APP_NAME }),
	});

	return json(
		{
			authData,
			foundSubRecipe,
			lang,
			invertedLang,
			validation,
			meta: {
				title,
				description,
				url: `${PARSED_ENV.DOMAIN_URL}`,
				path: `/recipes/edit/${recipeId}/${lang}/sub-recipe/${subRecipeId}/edit`,
				theme: (await getThemeSession(request)).getTheme(),
			},
		},
		{ headers: { "Set-Cookie": await commit() } }
	);
};

const EditSubRecipeModal = () => {
	const [isOpen, setIsOpen] = useState<boolean>(true);

	const { foundSubRecipe, lang, invertedLang, validation } =
		useLoaderData<typeof loader>();

	const actionData = useActionData<typeof action>();

	const { t } = useTranslation();
	const { state } = useNavigation();

	const { pathname } = useLocation();
	const prevPath = pathname.split("/").slice(0, -3).join("/");

	const { name: n } = foundSubRecipe;
	const name = TranslatedContentSchema.parse(n);

	const { onValid } = useFilteredValues<FormData>({
		submitOptions: { method: "PATCH" },
	});
	const form = useRemixForm<FormData>({
		resolver,
		defaultValues: {
			name: name?.[lang] ?? undefined,
		},
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
			isLoading={state !== "idle"}
			isOpen={isOpen}
			prevPath={prevPath}
			setIsOpen={setIsOpen}
			success={actionData?.success}
			title={t("recipe.modal.update.subRecipe.title")}
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
						translationContent={name[invertedLang]}
						translationValidation={validation[lang]?.name}
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
	await auth.isAuthenticated(request.clone(), {
		failureRedirect: "/401",
	});

	const { lang, subRecipeId } = EditRecipeSubRecipeParamsSchema.parse(p);

	const data = await parseFormData<FormData>(request.clone());

	let success = true;

	return await prisma.subRecipe
		.update({
			data: {
				...(await translatedContent({
					request,
					key: "name",
					lang,
					value: data.name,
				})),
			},
			where: {
				id: subRecipeId,
			},
		})
		.catch(() => (success = false))
		.then(() => json({ success }));
};

export default EditSubRecipeModal;
