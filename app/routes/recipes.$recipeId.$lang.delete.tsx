import {
	json,
	redirect,
	type ActionFunctionArgs,
	type LoaderFunctionArgs,
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
import { LanguageSchema, TranslatedContentSchema } from "~/schemas/common";
import { RecipeParamsSchema } from "~/schemas/params.schema";
import { auth } from "~/utils/auth.server";
import { prisma } from "~/utils/prisma.server";

export const loader = async ({ request, params: p }: LoaderFunctionArgs) => {
	const authData = await auth.isAuthenticated(request.clone(), {
		failureRedirect: "/login",
	});

	const { recipeId } = RecipeParamsSchema.parse(p);

	const foundRecipe = await prisma.recipe.findFirst({
		where: { id: recipeId },
	});

	if (
		!foundRecipe ||
		(foundRecipe.userId !== authData.id && authData.role !== "ADMIN")
	) {
		return redirect("/recipes");
	}

	return json({ foundRecipe });
};

export const DeleteRecipeModal = () => {
	const { foundRecipe } = useLoaderData<typeof loader>();
	const { id, name: n, userId } = foundRecipe;

	const actionData = useActionData<typeof action>();

	const [isOpen, setIsOpen] = useState(true);

	const submit = useSubmit();
	const { pathname } = useLocation();
	const {
		t,
		i18n: { language: lang },
	} = useTranslation();

	const prevPath = pathname.split("/").slice(0, -1).join("/");

	const parsedName = z
		.string()
		.nullable()
		.optional()
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
			title={t("recipe.modal.delete.recipe.title")}
		>
			{t(
				parsedName
					? "recipe.modal.delete.recipe.contentWithName"
					: "recipe.modal.delete.recipe.content",
				{ name }
			)}
		</Modal>
	);
};

export const action = async ({ request, params: p }: ActionFunctionArgs) => {
	const authData = await auth.isAuthenticated(request.clone(), {
		failureRedirect: "/login",
	});

	const formData = await request.formData();

	const { recipeId } = RecipeParamsSchema.parse(p);

	const id = formData.get("id")?.toString();
	const userId = formData.get("userId")?.toString();

	if (
		id !== recipeId ||
		(userId !== authData.id && authData.role !== "ADMIN")
	) {
		redirect("/recipes");
	}

	try {
		await prisma.recipe.delete({ where: { id: recipeId } });
	} catch (error) {
		console.error(error);

		return json({ success: false, error });
	}

	return json({ success: true });
};

export default DeleteRecipeModal;