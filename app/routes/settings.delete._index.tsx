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

import { Modal } from "~/components/common/Modal";
import { PARSED_ENV } from "~/consts/parsed-env.const";
import i18next from "~/modules/i18next.server";
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

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const authData = await auth.isAuthenticated(request.clone());

	if (!authData) {
		throw new Response(null, { status: 401 });
	}

	const foundUser = await prisma.user.findFirst({
		where: { id: authData.id },
	});

	if (!foundUser) {
		throw new Response(null, { status: 404 });
	}

	if (foundUser.id !== authData.id) {
		throw new Response(null, { status: 403 });
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
		authData,
		meta: {
			title,
			description,
			url: `${PARSED_ENV.DOMAIN_URL}/settings/delete`,
		},
	});
};

export const DeleteUserModal = () => {
	const [isOpen, setIsOpen] = useState(true);

	const {
		authData: { id },
	} = useLoaderData<typeof loader>();
	const actionData = useActionData<typeof action>();

	const submit = useSubmit();
	const { t } = useTranslation();
	const { pathname } = useLocation();

	const prevPath = pathname.split("/").slice(0, -1).join("/");

	return (
		<Modal
			CTAFn={() => submit({ id }, { method: "delete" })}
			CTALabel={t("common.confirm")}
			CTAVariant="danger"
			isOpen={isOpen}
			prevPath={prevPath}
			setIsOpen={setIsOpen}
			success={actionData?.success}
			title={t("settings.modal.delete.title")}
		>
			{t("settings.modal.delete.content")}
		</Modal>
	);
};

export const action = async ({ request }: ActionFunctionArgs) => {
	const authData = await auth.isAuthenticated(request.clone());

	if (!authData) {
		throw new Response(null, { status: 401 });
	}

	const formData = await request.formData();
	const id = formData.get("id")?.toString();

	if (authData.id !== id) {
		throw new Response(null, { status: 403 });
	}

	try {
		await prisma.user.delete({ where: { id } });
	} catch (error) {
		console.error(error);

		return json({ success: false, error });
	}

	return redirect("/logout");
};

export default DeleteUserModal;
