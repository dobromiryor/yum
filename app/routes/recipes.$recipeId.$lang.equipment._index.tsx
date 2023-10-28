import { zodResolver } from "@hookform/resolvers/zod";
import { Length, Volume } from "@prisma/client";
import {
	json,
	type ActionFunctionArgs,
	type LoaderFunctionArgs,
} from "@remix-run/node";
import {
	Form,
	useActionData,
	useLocation,
	useNavigation,
} from "@remix-run/react";
import { useMemo, useState } from "react";
import { Controller } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
	RemixFormProvider,
	getValidatedFormData,
	useRemixForm,
} from "remix-hook-form";
import { z } from "zod";

import { Modal } from "~/components/common/Modal";
import { Input } from "~/components/common/UI/Input";
import { Select } from "~/components/common/UI/Select";
import { EquipmentDTOSchema } from "~/schemas/equipment.schema";
import { EditRecipeParamsSchema } from "~/schemas/params.schema";
import { auth } from "~/utils/auth.server";
import { translatedContent } from "~/utils/helpers/translated-content.server";
import { prisma } from "~/utils/prisma.server";

type FormData = z.infer<typeof EquipmentDTOSchema>;
const resolver = zodResolver(EquipmentDTOSchema);

export const loader = async ({ request }: LoaderFunctionArgs) => {
	await auth.isAuthenticated(request.clone(), {
		failureRedirect: "/login",
	});

	return json({});
};

const CreateEquipmentModal = () => {
	const [isOpen, setIsOpen] = useState<boolean>(true);

	const actionData = useActionData<typeof action>();

	const { t } = useTranslation();
	const { pathname } = useLocation();
	const { state } = useNavigation();

	const prevPath = pathname.split("/").slice(0, -1).join("/");

	const form = useRemixForm<FormData>({
		resolver,
		submitConfig: {
			method: "post",
		},
	});
	const {
		control,
		reset,
		handleSubmit,
		formState: { isDirty },
	} = form;

	const dimensionUnitOptions = useMemo(
		() =>
			Object.keys(Length).map((item) => {
				const lengthItem = z.nativeEnum(Length).parse(item);

				return {
					label: t(`recipe.units.${lengthItem}`, {
						count: 0,
					}),
					value: item,
				};
			}),
		[t]
	);
	const volumeUnitOptions = useMemo(
		() =>
			Object.keys(Volume).map((item) => {
				const volumeItem = z.nativeEnum(Volume).parse(item);

				return {
					label: t(`recipe.units.${volumeItem}`, {
						count: 0,
					}),
					value: item,
				};
			}),
		[t]
	);

	return (
		<Modal
			CTAFn={handleSubmit}
			dismissFn={reset}
			isCTADisabled={!isDirty}
			isLoading={state !== "idle"}
			isOpen={isOpen}
			prevPath={prevPath}
			setIsOpen={setIsOpen}
			success={actionData?.success}
			title={t("recipe.modal.create.equipment.title")}
		>
			<RemixFormProvider {...form}>
				<Form
					preventScrollReset
					autoComplete="off"
					className="flex flex-col gap-2"
					onSubmit={handleSubmit}
				>
					<Input isRequired label={t("recipe.field.name")} name="name" />
					<Input label={t("recipe.field.length")} name="length" type="number" />
					<Input label={t("recipe.field.width")} name="width" type="number" />
					<Input label={t("recipe.field.height")} name="height" type="number" />
					<Controller
						control={control}
						name="dimensionUnit"
						render={({ field: { onChange, value, name } }) => (
							<Select
								label={t("recipe.field.dimensionUnit")}
								name={name}
								options={dimensionUnitOptions}
								selected={value}
								onChange={onChange}
							/>
						)}
					/>
					<Input label={t("recipe.field.volume")} name="volume" type="number" />
					<Controller
						control={control}
						name="volumeUnit"
						render={({ field: { onChange, value, name } }) => (
							<Select
								label={t("recipe.field.volumeUnit")}
								name={name}
								options={volumeUnitOptions}
								selected={value}
								onChange={onChange}
							/>
						)}
					/>
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
		await prisma.equipment.create({
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

export default CreateEquipmentModal;
