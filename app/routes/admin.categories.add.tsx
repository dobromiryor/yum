import { zodResolver } from "@hookform/resolvers/zod";
import { Prisma, Role } from "@prisma/client";
import {
	json,
	type ActionFunctionArgs,
	type LoaderFunctionArgs,
	type MetaFunction,
	type TypedResponse,
} from "@remix-run/node";
import {
	Form,
	useActionData,
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
import { Textarea } from "~/components/common/UI/Textarea";
import { LANGUAGES } from "~/consts/languages.const";
import { PARSED_ENV } from "~/consts/parsed-env.const";
import { useFilteredValues } from "~/hooks/useFilteredValues";
import i18next from "~/modules/i18next.server";
import { CategoryDTOSchema } from "~/schemas/category.schema";
import { auth } from "~/utils/auth.server";
import {
	generateMetaDescription,
	generateMetaProps,
	generateMetaTitle,
} from "~/utils/helpers/meta-helpers";
import { prisma } from "~/utils/prisma.server";
import { getThemeSession } from "~/utils/theme.server";

type FormData = z.infer<typeof CategoryDTOSchema>;
const resolver = zodResolver(CategoryDTOSchema);

export const sitemap = () => ({
	exclude: true,
});

export const meta: MetaFunction<typeof loader> = ({ data }) => {
	return generateMetaProps(data?.meta);
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const authData = await auth.isAuthenticated(request);

	if (!authData) {
		throw new Response(null, { status: 401 });
	}

	if (authData.role !== Role.ADMIN) {
		throw new Response(null, { status: 403 });
	}

	const t = await i18next.getFixedT(request);
	const title = generateMetaTitle({
		title: t("seo.admin.categories.title"),
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
			path: `/admin/categories/add`,
			theme: (await getThemeSession(request)).getTheme(),
		},
	});
};

const AdminDashboardCategoryAddModal = () => {
	const [isOpen, setIsOpen] = useState<boolean>(true);

	const actionData = useActionData<typeof action>();

	const { t } = useTranslation();
	const { pathname } = useLocation();
	const { state } = useNavigation();

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
			CTAFn={handleSubmit}
			dismissFn={reset}
			isCTADisabled={!Object.keys(dirtyFields).length}
			isLoading={state !== "idle"}
			isOpen={isOpen}
			prevPath={prevPath}
			setIsOpen={setIsOpen}
			success={actionData?.success}
			title={t("admin.category.modal.create.title")}
		>
			<RemixFormProvider {...form}>
				<Form
					preventScrollReset
					autoComplete="off"
					className="flex flex-col gap-2"
					onSubmit={handleSubmit}
				>
					{LANGUAGES.map((lang, index) => (
						<Input
							key={`${lang}__Name__${index}`}
							isRequired
							autoFocus={index === 0}
							label={`${t(
								"admin.category.table.name"
							)} (${lang.toUpperCase()})`}
							name={`name.${lang}`}
						/>
					))}
					{LANGUAGES.map((lang, index) => (
						<Textarea
							key={`${lang}__Description__${index}`}
							label={`${t(
								"admin.category.table.description"
							)} (${lang.toUpperCase()})`}
							name={`description.${lang}`}
						/>
					))}
					<Input
						isRequired
						explanation={t("explanation.slug")}
						explanationIcon="regular_expression"
						label={t("admin.category.table.slug")}
						name="slug"
					/>
				</Form>
			</RemixFormProvider>
			<FormError
				error={
					typeof actionData?.success === "boolean" && !actionData?.success
						? typeof actionData?.message === "string"
							? actionData.message
							: t("error.somethingWentWrong")
						: undefined
				}
			/>
		</Modal>
	);
};

export const action = async ({
	request,
}: ActionFunctionArgs): Promise<
	TypedResponse<{
		success: boolean;
		message?: string;
	}>
> => {
	const authData = await auth.isAuthenticated(request.clone());

	if (!authData) {
		throw new Response(null, { status: 401 });
	}

	if (authData.role !== Role.ADMIN) {
		throw new Response(null, { status: 403 });
	}

	const data = await parseFormData<FormData>(request.clone());

	let success = true;

	const foundCategories = await prisma.category.findMany({
		select: { slug: true },
	});

	if (foundCategories.find((item) => item.slug === data.slug)) {
		const t = await i18next.getFixedT(request);

		return json({
			success: false,
			message: t("error.slugExists"),
		});
	}

	const { description, ...rest } = data;

	return await prisma.category
		.create({ data: { description: description ?? Prisma.JsonNull, ...rest } })
		.catch(() => (success = false))
		.then(() => json({ success }));
};

export default AdminDashboardCategoryAddModal;
