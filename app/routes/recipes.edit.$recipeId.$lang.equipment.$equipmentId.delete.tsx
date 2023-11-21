import {
	json,
	redirect,
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
import { EditRecipeEquipmentParamsSchema } from "~/schemas/params.schema";
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
	const authData = await auth.isAuthenticated(request.clone(), {
		failureRedirect: "/login",
	});

	const { equipmentId, recipeId, lang } =
		EditRecipeEquipmentParamsSchema.parse(p);

	const foundEquipment = await prisma.equipment.findFirst({
		where: { id: equipmentId },
	});

	if (!foundEquipment) {
		return redirect("/404");
	}

	if (foundEquipment.userId !== authData.id && authData.role !== "ADMIN") {
		return redirect("/403");
	}

	const t = await i18next.getFixedT(request);
	const title = generateMetaTitle({
		title: t("common.deleteSomething", {
			something: `${t("recipe.field.equipment")}`.toLowerCase(),
		}),
		postfix: PARSED_ENV.APP_NAME,
	});
	const description = generateMetaDescription({
		description: t("seo.home.description", { appName: PARSED_ENV.APP_NAME }),
	});

	return json({
		foundEquipment,
		meta: {
			title,
			description,
			url: `${PARSED_ENV.DOMAIN_URL}/recipes/edit/${recipeId}/${lang}/equipment/${equipmentId}/delete`,
		},
	});
};

const DeleteEquipmentModal = () => {
	const { foundEquipment } = useLoaderData<typeof loader>();
	const { id, name: n, userId } = foundEquipment;

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
			title={t("recipe.modal.delete.equipment.title")}
		>
			{t(
				parsedName
					? "recipe.modal.delete.equipment.contentWithName"
					: "recipe.modal.delete.equipment.content",
				{ name }
			)}
		</Modal>
	);
};

export const action = async ({ request, params: p }: ActionFunctionArgs) => {
	const authData = await auth.isAuthenticated(request.clone(), {
		failureRedirect: "/401",
	});

	const formData = await request.formData();

	const { equipmentId } = EditRecipeEquipmentParamsSchema.parse(p);

	const id = formData.get("id")?.toString();
	const userId = formData.get("userId")?.toString();

	if (
		id !== equipmentId ||
		(userId !== authData.id && authData.role !== "ADMIN")
	) {
		redirect("/403");
	}

	try {
		await prisma.equipment.delete({ where: { id: equipmentId } });
	} catch (error) {
		console.error(error);

		return json({ success: false, error });
	}

	return json({ success: true });
};

export default DeleteEquipmentModal;
