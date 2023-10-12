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
import { EditRecipeSubRecipeParamsSchema } from "~/schemas/params.schema";
import { auth } from "~/utils/auth.server";
import { prisma } from "~/utils/prisma.server";

export const loader = async ({ request, params: p }: LoaderFunctionArgs) => {
	const authData = await auth.isAuthenticated(request.clone(), {
		failureRedirect: "/login",
	});

	const { subRecipeId } = EditRecipeSubRecipeParamsSchema.parse(p);

	const foundSubRecipe = await prisma.subRecipe.findFirst({
		where: { id: subRecipeId },
	});

	if (
		!foundSubRecipe ||
		(foundSubRecipe.userId !== authData.id && authData.role !== "ADMIN")
	) {
		return redirect("/recipes");
	}

	return json({ foundSubRecipe });
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
		</Modal>
	);
};

export const action = async ({ request, params: p }: ActionFunctionArgs) => {
	const authData = await auth.isAuthenticated(request.clone(), {
		failureRedirect: "/login",
	});

	const formData = await request.formData();

	const { subRecipeId } = EditRecipeSubRecipeParamsSchema.parse(p);

	const id = formData.get("id")?.toString();
	const userId = formData.get("userId")?.toString();

	if (
		id !== subRecipeId ||
		(userId !== authData.id && authData.role !== "ADMIN")
	) {
		redirect("/recipes");
	}

	try {
		await prisma.subRecipe.delete({ where: { id: subRecipeId } });
	} catch (error) {
		console.error(error);

		return json({ success: false, error });
	}

	return json({ success: true });
};

export default DeleteSubRecipeModal;
