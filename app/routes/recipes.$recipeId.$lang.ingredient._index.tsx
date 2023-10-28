import { zodResolver } from "@hookform/resolvers/zod";
import { Prisma, Unit } from "@prisma/client";
import {
	json,
	type ActionFunctionArgs,
	type LoaderFunctionArgs,
} from "@remix-run/node";
import {
	Form,
	useActionData,
	useLoaderData,
	useLocation,
} from "@remix-run/react";
import { t } from "i18next";
import { useState } from "react";
import { Controller } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
	RemixFormProvider,
	getValidatedFormData,
	useRemixForm,
} from "remix-hook-form";
import { type z } from "zod";

import { Modal } from "~/components/common/Modal";
import { Input } from "~/components/common/UI/Input";
import { Select } from "~/components/common/UI/Select";
import { Textarea } from "~/components/common/UI/Textarea";
import { IngredientDTOSchema } from "~/schemas/ingredient.schema";
import { OptionsSchema } from "~/schemas/option.schema";
import { EditRecipeParamsSchema } from "~/schemas/params.schema";
import { auth } from "~/utils/auth.server";
import { getInvertedLang } from "~/utils/helpers/get-inverted-lang";
import { parseQuantity } from "~/utils/helpers/parse-quantity.server";
import {
	nullishTranslatedContent,
	translatedContent,
} from "~/utils/helpers/translated-content.server";
import { prisma } from "~/utils/prisma.server";

type FormData = z.infer<typeof IngredientDTOSchema>;
const resolver = zodResolver(IngredientDTOSchema);

const options = OptionsSchema.parse(
	Object.values(Unit).map((item) => ({
		label: item.replace("_", " "),
		value: item,
	}))
);

export const loader = async ({ request, params: p }: LoaderFunctionArgs) => {
	const authData = await auth.isAuthenticated(request.clone(), {
		failureRedirect: "/login",
	});

	const { lang, recipeId } = EditRecipeParamsSchema.parse(p);

	const invertedLang = getInvertedLang(lang);

	const foundSubRecipes = await prisma.subRecipe.findMany({
		where: { recipeId },
	});

	const subRecipeOptions = OptionsSchema.parse(
		foundSubRecipes.map((item) => ({
			label:
				item.name?.[lang as keyof typeof item.name] ??
				item.name?.[invertedLang as keyof typeof item.name] ??
				t("error.translationMissing"),
			value: item.id,
		}))
	);

	return json({ authData, subRecipeOptions });
};

export const CreateIngredientModal = () => {
	const { subRecipeOptions } = useLoaderData<typeof loader>();
	const actionData = useActionData<typeof action>();

	const [isOpen, setIsOpen] = useState(true);
	const { t } = useTranslation();
	const { pathname } = useLocation();

	const prevPath = pathname.split("/").slice(0, -1).join("/");

	const form = useRemixForm<FormData>({
		resolver,
		submitConfig: {
			method: "post",
		},
	});
	const { reset, handleSubmit, control } = form;

	return (
		<Modal
			CTAFn={handleSubmit}
			dismissFn={reset}
			isOpen={isOpen}
			prevPath={prevPath}
			setIsOpen={setIsOpen}
			success={actionData?.success}
			title={t("recipe.modal.create.ingredient.title")}
		>
			<RemixFormProvider {...form}>
				<Form
					preventScrollReset
					autoComplete="off"
					className="flex flex-col gap-2"
					onSubmit={handleSubmit}
				>
					<Input
						autoFocus
						isRequired
						label={t("recipe.field.name")}
						name="name"
					/>
					<Input label={t("recipe.field.quantity")} name="quantity" />
					<Controller
						control={control}
						name="unit"
						render={({ field: { onChange, value, name } }) => (
							<Select
								label={t("recipe.field.unit")}
								name={name}
								options={options}
								selected={value}
								onChange={onChange}
							/>
						)}
					/>
					<Textarea label={t("recipe.field.note")} name="note" />
					<Controller
						control={control}
						name="subRecipeId"
						render={({ field: { onChange, value, name } }) => (
							<Select
								label={t("recipe.field.subRecipe")}
								name={name}
								options={subRecipeOptions}
								selected={value}
								onChange={onChange}
							/>
						)}
					/>
				</Form>
			</RemixFormProvider>
		</Modal>
	);
};

export const action = async ({ request, params: p }: ActionFunctionArgs) => {
	const { id: userId } = await auth.isAuthenticated(request.clone(), {
		failureRedirect: "/login",
	});

	const { lang, recipeId } = EditRecipeParamsSchema.parse(p);

	const { errors, data } = await getValidatedFormData<FormData>(
		request.clone(),
		resolver
	);

	if (errors) {
		return json({ success: false, errors });
	}

	try {
		const { name, note, subRecipeId, quantity } = data;

		await prisma.ingredient.create({
			data: {
				...data,
				...(await translatedContent({
					request,
					key: "name",
					lang,
					value: name,
				})),
				...(await nullishTranslatedContent({
					request,
					key: "note",
					lang,
					value: note,
				})),
				quantity:
					quantity === null
						? null
						: quantity === undefined
						? undefined
						: new Prisma.Decimal(parseQuantity(quantity)),
				subRecipeId,
				recipeId,
				userId,
			},
		});
	} catch (error) {
		console.error(error);

		return json({ success: false, error });
	}

	return json({ success: true });
};

export default CreateIngredientModal;
