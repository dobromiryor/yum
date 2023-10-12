import { zodResolver } from "@hookform/resolvers/zod";
import { TemperatureScale } from "@prisma/client";
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
import { useMemo, useState } from "react";
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
import { Multiselect } from "~/components/common/UI/Multiselect";
import { Select } from "~/components/common/UI/Select";
import { Textarea } from "~/components/common/UI/Textarea";
import { OptionsSchema } from "~/schemas/option.schema";
import { EditRecipeParamsSchema } from "~/schemas/params.schema";
import { StepDTOSchema } from "~/schemas/step.schema";
import { auth } from "~/utils/auth.server";
import { translatedContent } from "~/utils/helpers/translated-content.server";
import { prisma } from "~/utils/prisma.server";

type FormData = z.infer<typeof StepDTOSchema>;
const resolver = zodResolver(StepDTOSchema);

const temperatureScaleOptions = OptionsSchema.parse(
	Object.values(TemperatureScale).map((item) => ({
		label: `°${item}`,
		value: item,
	}))
);

export const loader = async ({ request, params: p }: LoaderFunctionArgs) => {
	const authData = await auth.isAuthenticated(request.clone(), {
		failureRedirect: "/login",
	});

	const { recipeId, lang } = EditRecipeParamsSchema.parse(p);

	const ingredients = await prisma.ingredient.findMany({
		where: { recipeId },
		orderBy: { position: "asc" },
	});

	return json({ authData, ingredients, lang });
};

export const CreateStepModal = () => {
	const { ingredients, lang } = useLoaderData<typeof loader>();
	const ingredientOptions = useMemo(
		() =>
			ingredients.map((item) => {
				return {
					label: item.name?.[lang as keyof typeof item.name] ?? "",
					value: item.id,
				};
			}),
		[ingredients, lang]
	);

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
			title={t("recipe.modal.create.step.title")}
		>
			<RemixFormProvider {...form}>
				<Form
					preventScrollReset
					autoComplete="off"
					className="flex flex-col gap-2"
					onSubmit={handleSubmit}
				>
					<Textarea
						isRequired
						label={t("recipe.field.description")}
						name="content"
					/>
					<Input
						label={t("recipe.field.temperature")}
						name="temperature"
						type="number"
					/>
					<Controller
						control={control}
						name="temperatureScale"
						render={({ field: { onChange, value, name } }) => (
							<Select
								label={t("recipe.field.temperatureScale")}
								name={name}
								options={temperatureScaleOptions}
								selected={value}
								onChange={onChange}
							/>
						)}
					/>
					<Controller
						control={control}
						name="ingredients"
						render={({ field: { onChange, value, name } }) => (
							<Multiselect
								label={t("recipe.field.ingredients")}
								name={name}
								options={ingredientOptions}
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

	const { recipeId, lang } = EditRecipeParamsSchema.parse(p);

	const { errors, data } = await getValidatedFormData<FormData>(
		request.clone(),
		resolver
	);

	if (errors) {
		return json({ success: false, errors });
	}

	try {
		const { ingredients, ...rest } = data;
		const createdStep = await prisma.step.create({
			data: {
				...rest,
				...(await translatedContent({
					request,
					key: "content",
					lang,
					value: rest.content,
				})),
				recipeId,
				userId,
			},
		});

		if (ingredients) {
			await prisma.$transaction(
				ingredients.map((item) =>
					prisma.ingredient.update({
						data: { stepId: createdStep.id },
						where: { id: item },
					})
				)
			);
		}
	} catch (error) {
		console.error(error);

		return json({ success: false, error });
	}

	return json({ success: true });
};

export default CreateStepModal;
