import { zodResolver } from "@hookform/resolvers/zod";
import {
	json,
	redirect,
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
	getValidatedFormData,
	useRemixForm,
} from "remix-hook-form";
import { type z } from "zod";

import { Modal } from "~/components/common/Modal";
import { Input } from "~/components/common/UI/Input";
import { PARSED_ENV } from "~/consts/parsed-env.const";
import i18next from "~/modules/i18next.server";
import { TranslatedContentSchema } from "~/schemas/common";
import { EditRecipeSubRecipeParamsSchema } from "~/schemas/params.schema";
import { SubRecipeDTOSchema } from "~/schemas/sub-recipe.schema";
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

type FormData = z.infer<typeof SubRecipeDTOSchema>;
const resolver = zodResolver(SubRecipeDTOSchema);

export const sitemap = () => ({
	exclude: true,
});

export const meta: MetaFunction<typeof loader> = ({ data }) => {
	return generateMetaProps(data?.meta);
};

export const loader = async ({ request, params: p }: LoaderFunctionArgs) => {
	const authData = await auth.isAuthenticated(request.clone(), {
		failureRedirect: "/401",
	});

	const { recipeId, lang, subRecipeId } =
		EditRecipeSubRecipeParamsSchema.parse(p);

	const foundSubRecipe = await prisma.subRecipe.findFirst({
		where: { id: subRecipeId },
	});

	if (!foundSubRecipe) {
		return redirect("/404");
	}

	if (foundSubRecipe.userId !== authData.id && authData.role !== "ADMIN") {
		return redirect("/403");
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
				url: `${PARSED_ENV.DOMAIN_URL}/recipes/edit/${recipeId}/${lang}/sub-recipe/${subRecipeId}/edit`,
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

	const form = useRemixForm<FormData>({
		resolver,
		defaultValues: {
			name: name?.[lang] ?? undefined,
		},
		submitConfig: {
			method: "patch",
		},
	});

	const {
		reset,
		handleSubmit,
		formState: { isDirty },
	} = form;

	return (
		<Modal
			CTAFn={handleSubmit}
			dismissFn={reset}
			isCTADisabled={!isDirty}
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
					onSubmit={handleSubmit}
				>
					<Input
						isRequired
						label={t("recipe.field.name")}
						name="name"
						translationContent={name[invertedLang]}
						translationValidation={validation[lang]?.name}
					/>
				</Form>
			</RemixFormProvider>
		</Modal>
	);
};

export const action = async ({ request, params: p }: ActionFunctionArgs) => {
	await auth.isAuthenticated(request.clone(), {
		failureRedirect: "/401",
	});

	const { lang, subRecipeId } = EditRecipeSubRecipeParamsSchema.parse(p);

	const { errors, data } = await getValidatedFormData<FormData>(
		request.clone(),
		resolver
	);

	if (errors) {
		console.error(errors);

		return json({ success: false, errors });
	}

	try {
		await prisma.subRecipe.update({
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
		});
	} catch (error) {
		console.error(error);

		return json({ success: false, error });
	}

	return json({ success: true });
};

export default EditSubRecipeModal;
