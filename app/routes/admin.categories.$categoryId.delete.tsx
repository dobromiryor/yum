import { Role } from "@prisma/client";
import {
	json,
	type ActionFunctionArgs,
	type LoaderFunctionArgs,
	type MetaFunction,
	type TypedResponse,
} from "@remix-run/node";
import {
	useActionData,
	useLoaderData,
	useLocation,
	useSubmit,
} from "@remix-run/react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Modal } from "~/components/common/Modal";
import { FormError } from "~/components/common/UI/FormError";
import { PARSED_ENV } from "~/consts/parsed-env.const";
import i18next from "~/modules/i18next.server";
import {
	LanguageSchema,
	NonNullTranslatedContentSchema,
} from "~/schemas/common";
import { AdminDashboardCategoryParamsSchema } from "~/schemas/params.schema";
import { auth } from "~/utils/auth.server";
import {
	generateMetaDescription,
	generateMetaProps,
	generateMetaTitle,
} from "~/utils/helpers/meta-helpers";
import { prisma } from "~/utils/prisma.server";
import { getThemeSession } from "~/utils/theme.server";

export const sitemap = () => ({
	exclude: true,
});

export const meta: MetaFunction<typeof loader> = ({ data }) => {
	return generateMetaProps(data?.meta);
};

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
	const authData = await auth.isAuthenticated(request.clone());

	if (!authData) {
		throw new Response(null, { status: 401 });
	}

	if (authData.role !== Role.ADMIN) {
		throw new Response(null, { status: 403 });
	}

	const { categoryId } = AdminDashboardCategoryParamsSchema.parse(params);

	const foundCategory = await prisma.category.findFirst({
		where: { id: categoryId },
	});

	if (!foundCategory) {
		throw new Response(null, { status: 404 });
	}

	const t = await i18next.getFixedT(request);
	const title = generateMetaTitle({
		title: t("common.deleteSomething", {
			something: `${t("admin.category.table.category_one")}`.toLowerCase(),
		}),
		postfix: PARSED_ENV.APP_NAME,
	});
	const description = generateMetaDescription({
		description: t("seo.home.description", { appName: PARSED_ENV.APP_NAME }),
	});

	return json({
		foundCategory,
		meta: {
			title,
			description,
			url: `${PARSED_ENV.DOMAIN_URL}`,
			path: `/admin/categories/${categoryId}/delete`,
			theme: (await getThemeSession(request)).getTheme(),
		},
	});
};

export const DeleteCategoryModal = () => {
	const [isOpen, setIsOpen] = useState(true);

	const { foundCategory } = useLoaderData<typeof loader>();
	const actionData = useActionData<typeof action>();

	const submit = useSubmit();
	const {
		t,
		i18n: { language },
	} = useTranslation();
	const { pathname } = useLocation();

	const prevPath = pathname.split("/").slice(0, -2).join("/");

	const name = NonNullTranslatedContentSchema.parse(foundCategory.name);
	const lang = LanguageSchema.parse(language);

	return (
		<Modal
			CTAFn={() => submit({ id: foundCategory.id }, { method: "delete" })}
			CTALabel={t("common.confirm")}
			CTAVariant="danger"
			isOpen={isOpen}
			prevPath={prevPath}
			setIsOpen={setIsOpen}
			success={actionData?.success}
			title={t("admin.category.modal.delete.title")}
		>
			{t("admin.category.modal.delete.content", {
				name: name[lang],
			})}
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

export const action = async ({
	request,
}: ActionFunctionArgs): Promise<
	| TypedResponse<{
			success: true;
	  }>
	| undefined
> => {
	const authData = await auth.isAuthenticated(request.clone());

	if (!authData) {
		throw new Response(null, { status: 401 });
	}

	if (authData.role !== Role.ADMIN) {
		throw new Response(null, { status: 403 });
	}

	const formData = await request.formData();
	const id = formData.get("id")?.toString();

	let success = true;

	return await prisma.category
		.delete({ where: { id } })
		.catch(() => {
			success = false;

			return json({ success });
		})
		.then(() => {
			if (success) {
				return json({ success });
			}
		});
};

export default DeleteCategoryModal;
