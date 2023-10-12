import { zodResolver } from "@hookform/resolvers/zod";
import {
	json,
	type ActionFunctionArgs,
	type LoaderFunctionArgs,
} from "@remix-run/node";
import { Form, useActionData, useLocation } from "@remix-run/react";
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
import { EditRecipeParamsSchema } from "~/schemas/params.schema";
import { SubRecipeDTOSchema } from "~/schemas/sub-recipe.schema";
import { auth } from "~/utils/auth.server";
import { translatedContent } from "~/utils/helpers/translated-content.server";
import { prisma } from "~/utils/prisma.server";

type FormData = z.infer<typeof SubRecipeDTOSchema>;
const resolver = zodResolver(SubRecipeDTOSchema);

export const loader = async ({ request }: LoaderFunctionArgs) => {
	await auth.isAuthenticated(request.clone(), {
		failureRedirect: "/login",
	});

	return json({});
};

const CreateSubRecipeModal = () => {
	const [isOpen, setIsOpen] = useState<boolean>(true);

	const actionData = useActionData<typeof action>();

	const { t } = useTranslation();
	const { pathname } = useLocation();

	const prevPath = pathname.split("/").slice(0, -1).join("/");

	const form = useRemixForm<FormData>({
		resolver,
		submitConfig: {
			method: "post",
		},
	});
	const { reset, handleSubmit } = form;

	return (
		<Modal
			CTAFn={handleSubmit}
			dismissFn={reset}
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
					onSubmit={handleSubmit}
				>
					<Input isRequired label={t("recipe.field.name")} name="name" />
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
		await prisma.subRecipe.create({
			data: {
				...data,
				...(await translatedContent({
					request,
					key: "name",
					lang,
					value: data.name,
				})),
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

export default CreateSubRecipeModal;
