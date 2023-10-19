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

import { Modal } from "~/components/common/Modal";
import { auth } from "~/utils/auth.server";
import { prisma } from "~/utils/prisma.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const authData = await auth.isAuthenticated(request.clone(), {
		failureRedirect: "/login",
	});

	return json({ authData });
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
	const authData = await auth.isAuthenticated(request.clone(), {
		failureRedirect: "/login",
	});

	const formData = await request.formData();
	const id = formData.get("id")?.toString();

	if (authData.id !== id) {
		return redirect("/");
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
