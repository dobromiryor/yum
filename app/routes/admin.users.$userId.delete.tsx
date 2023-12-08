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
import { CloudinaryUploadApiResponseWithBlurHashSchema } from "~/schemas/cloudinary.schema";
import { AdminDashboardDeleteUserParamsSchema } from "~/schemas/params.schema";
import { auth } from "~/utils/auth.server";
import { deleteImage } from "~/utils/cloudinary.server";
import { getDisplayName } from "~/utils/helpers/get-display-name";
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

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
	const authData = await auth.isAuthenticated(request.clone());

	if (!authData) {
		throw new Response(null, { status: 401 });
	}

	if (authData.role !== Role.ADMIN) {
		throw new Response(null, { status: 403 });
	}

	const { userId } = AdminDashboardDeleteUserParamsSchema.parse(params);

	const foundUser = await prisma.user.findFirst({
		where: { id: userId },
	});

	if (!foundUser) {
		throw new Response(null, { status: 404 });
	}

	const t = await i18next.getFixedT(request);
	const title = generateMetaTitle({
		title: t("common.deleteSomething", {
			something: `${t("settings.field.account")}`.toLowerCase(),
		}),
		postfix: PARSED_ENV.APP_NAME,
	});
	const description = generateMetaDescription({
		description: t("seo.home.description", { appName: PARSED_ENV.APP_NAME }),
	});

	return json({
		foundUser,
		meta: {
			title,
			description,
			url: `${PARSED_ENV.DOMAIN_URL}/admin/users/${userId}/delete`,
		},
	});
};

export const DeleteUserModal = () => {
	const [isOpen, setIsOpen] = useState(true);

	const { foundUser } = useLoaderData<typeof loader>();
	const actionData = useActionData<typeof action>();

	const submit = useSubmit();
	const { t } = useTranslation();
	const { pathname } = useLocation();

	const prevPath = pathname.split("/").slice(0, -2).join("/");

	return (
		<Modal
			CTAFn={() => submit({ id: foundUser.id }, { method: "delete" })}
			CTALabel={t("common.confirm")}
			CTAVariant="danger"
			isOpen={isOpen}
			prevPath={prevPath}
			setIsOpen={setIsOpen}
			success={actionData?.success}
			title={t("admin.user.modal.delete.title")}
		>
			{t("admin.user.modal.delete.content", {
				name: getDisplayName(foundUser),
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

	const photo =
		authData.photo &&
		CloudinaryUploadApiResponseWithBlurHashSchema.parse(authData.photo);

	let success = true;

	return await Promise.all([
		photo && (await deleteImage(photo.public_id)),
		await prisma.user.delete({ where: { id } }),
	])
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

export default DeleteUserModal;
