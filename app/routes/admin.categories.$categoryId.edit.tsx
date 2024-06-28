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
import { Textarea } from "~/components/common/UI/Textarea";
import { LANGUAGES } from "~/consts/languages.const";
import { PARSED_ENV } from "~/consts/parsed-env.const";
import { useFilteredValues } from "~/hooks/useFilteredValues";
import i18next from "~/modules/i18next.server";
import { CategoryDTOSchema } from "~/schemas/category.schema";
import {
	NonNullTranslatedContentSchema,
	OptionalNonNullTranslatedContentSchema,
} from "~/schemas/common";
import { AdminDashboardCategoryParamsSchema } from "~/schemas/params.schema";
import { type RemixHookFormSubmit } from "~/types/remix-hook-form-submit.type";
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

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
	const authData = await auth.isAuthenticated(request);

	if (!authData) {
		throw new Response(null, { status: 401 });
	}

	if (authData.role !== Role.ADMIN) {
		throw new Response(null, { status: 403 });
	}

	const { categoryId } = AdminDashboardCategoryParamsSchema.parse(params);

	const foundCategory = await prisma.category.findUnique({
		where: { id: categoryId },
	});

	if (!foundCategory) {
		throw new Response(null, { status: 404 });
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
		foundCategory,
		meta: {
			title,
			description,
			url: `${PARSED_ENV.DOMAIN_URL}`,
			path: `/admin/categories/${categoryId}/edit`,
			theme: (await getThemeSession(request)).getTheme(),
		},
	});
};

const AdminDashboardCategoryUpdateModal = () => {
	const [isOpen, setIsOpen] = useState<boolean>(true);

	const { foundCategory } = useLoaderData<typeof loader>();
	const actionData = useActionData<typeof action>();

	const { t } = useTranslation();
	const { pathname } = useLocation();
	const { state } = useNavigation();

	const prevPath = pathname.split("/").slice(0, -2).join("/");

	const { onValid } = useFilteredValues<FormData>();
	const form = useRemixForm<FormData>({
		defaultValues: {
			description: OptionalNonNullTranslatedContentSchema.parse(
				foundCategory.description
			),
			name: NonNullTranslatedContentSchema.parse(foundCategory.name),
			slug: foundCategory.slug,
		},
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
			CTAFn={handleSubmit as RemixHookFormSubmit}
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
					onSubmit={handleSubmit as RemixHookFormSubmit}
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
	params,
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

	const { categoryId } = AdminDashboardCategoryParamsSchema.parse(params);

	const data = await parseFormData<FormData>(request.clone());

	let success = true;

	const foundCategories = await prisma.category.findMany({
		select: { id: true, slug: true },
	});

	if (
		foundCategories.find(
			(item) => item.slug === data.slug && item.id !== categoryId
		)
	) {
		const t = await i18next.getFixedT(request);

		return json({
			success: false,
			message: t("error.slugExists"),
		});
	}

	const { description: d, ...rest } = data;

	const description =
		d && d.bg && d.bg.length > 0 && d.en && d.en.length > 0
			? d
			: Prisma.JsonNull;

	return await prisma.category
		.update({
			data: { description, ...rest },
			where: { id: categoryId },
		})
		.catch(() => (success = false))
		.then(() => json({ success }));
};

export default AdminDashboardCategoryUpdateModal;
