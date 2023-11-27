import { fill } from "@cloudinary/url-gen/actions/resize";
import { Cloudinary, CloudinaryImage } from "@cloudinary/url-gen/index";
import { Prisma } from "@prisma/client";
import {
	json,
	unstable_composeUploadHandlers,
	unstable_parseMultipartFormData,
	type ActionFunctionArgs,
	type LoaderFunctionArgs,
	type MetaFunction,
} from "@remix-run/node";
import {
	Form,
	useActionData,
	useLoaderData,
	useLocation,
	useNavigation,
} from "@remix-run/react";
import clsx from "clsx";
import { useEffect, useState, type MouseEvent } from "react";
import { useDropzone } from "react-dropzone-esm";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { Avatar } from "~/components/common/Avatar";
import { Modal } from "~/components/common/Modal";
import { Pill } from "~/components/common/Pill";
import { Button } from "~/components/common/UI/Button";
import { FormError } from "~/components/common/UI/FormError";
import { Icon } from "~/components/common/UI/Icon";
import { MB } from "~/consts/mb";
import { PARSED_ENV } from "~/consts/parsed-env.const";
import { useDataTransfer } from "~/hooks/useDataTransfer";
import { useSlowUpload } from "~/hooks/useSlowUpload";
import { useTypedRouteLoaderData } from "~/hooks/useTypedRouteLoaderData";
import i18next from "~/modules/i18next.server";
import {
	CloudinaryUploadApiResponseSchema,
	CloudinaryUploadApiResponseWithBlurHashSchema,
} from "~/schemas/cloudinary.schema";
import { auth } from "~/utils/auth.server";
import { deleteImage, uploadImage } from "~/utils/cloudinary.server";
import { errorCatcher } from "~/utils/helpers/error-catcher.server";
import { getBlurHash } from "~/utils/helpers/get-blur-hash.server";
import {
	generateMetaDescription,
	generateMetaProps,
	generateMetaTitle,
} from "~/utils/helpers/meta-helpers";
import { prisma } from "~/utils/prisma.server";
import { sessionStorage } from "~/utils/session.server";

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
		title: t("common.editSomething", {
			something: `${t("settings.field.avatar")}`.toLowerCase(),
		}),
		postfix: PARSED_ENV.APP_NAME,
	});
	const description = generateMetaDescription({
		description: t("seo.home.description", { appName: PARSED_ENV.APP_NAME }),
	});

	return json({
		authData,
		foundUser,
		meta: {
			title,
			description,
			url: `${PARSED_ENV.DOMAIN_URL}/settings/change-avatar`,
		},
	});
};

const EditAvatarModal = () => {
	const [isOpen, setIsOpen] = useState<boolean>(true);
	const [isUploadSlow, setIsUploadSlow] = useState<boolean>(false);
	const [files, setFiles] = useState<(File & { preview: string })[]>([]);

	const { ENV } = useTypedRouteLoaderData("root");
	const { foundUser } = useLoaderData<typeof loader>();
	const actionData = useActionData<typeof action>();

	const { t } = useTranslation();
	const { state, formMethod } = useNavigation();
	const {
		acceptedFiles,
		fileRejections,
		getInputProps,
		getRootProps,
		isDragActive,
		inputRef,
	} = useDropzone({
		accept: {
			"image/*": [],
		},
		maxFiles: 1,
		maxSize: 5 * MB, // 5MB
		multiple: false,
		onDrop: (acceptedFiles) => {
			setFiles(
				acceptedFiles.map((file) =>
					Object.assign(file, {
						preview: URL.createObjectURL(file),
					})
				)
			);
		},
	});

	useDataTransfer({ acceptedFiles, inputRef });
	useSlowUpload({ setIsUploadSlow });

	const { pathname } = useLocation();
	const prevPath = pathname.split("/").slice(0, -1).join("/");

	const { photo: p } = foundUser;
	const photo =
		CloudinaryUploadApiResponseWithBlurHashSchema.nullable().parse(p);

	const cld = new Cloudinary({
		cloud: { cloudName: ENV.CLOUDINARY_CLOUD_NAME },
	});
	const cldImg = photo && cld.image(photo.public_id);

	if (cldImg instanceof CloudinaryImage) {
		cldImg.resize(fill().width(256).height(256));
	}

	const handleRemoveFile = (e?: MouseEvent) => {
		e?.stopPropagation();
		acceptedFiles.pop();
		setFiles([]);
	};

	useEffect(() => {
		return () => files.forEach((file) => URL.revokeObjectURL(file.preview));
	}, [files]);

	return (
		<Modal
			CTAFn="uploadAvatarForm"
			dismissFn={() => handleRemoveFile()}
			isCTADisabled={!acceptedFiles.length}
			isLoading={state !== "idle"}
			isOpen={isOpen}
			prevPath={prevPath}
			setIsOpen={setIsOpen}
			success={actionData?.success}
			title={t("settings.modal.changeAvatar.title")}
		>
			<div className="flex flex-col gap-4">
				<Form id="deleteAvatarForm" method="DELETE">
					<input hidden readOnly name="photo" value={photo?.public_id} />
				</Form>
				<Form encType="multipart/form-data" id="uploadAvatarForm" method="POST">
					<div
						className={clsx(
							"flex flex-col sm:flex-row items-center gap-3 p-3 sm rounded-lg border cursor-pointer",
							fileRejections[0]?.errors[0]?.code
								? "border-red-500"
								: "border-secondary dark:border-primary",
							isDragActive && "bg-secondary dark:bg-primary",
							state !== "idle" && formMethod === "POST" && "animate-pulse"
						)}
						{...getRootProps()}
					>
						<input ref={inputRef} name="img" {...getInputProps()} />
						{(files[0]?.preview || photo) && (
							<div
								className={clsx(
									"grow rounded-md border border-secondary dark:border-primary overflow-hidden w-full h-full max-w-64 max-h-64",
									files[0]?.preview ? "aspect-auto" : "aspect-square"
								)}
							>
								{files[0]?.preview ? (
									<div className="relative">
										<img
											alt={t("common.dropzone.uploadPreview")}
											className="max-w-64"
											src={files[0].preview}
											onLoad={() => {
												URL.revokeObjectURL(files[0].preview);
											}}
										/>
										<div className="absolute top-2 left-2">
											<Pill label={t("common.dropzone.uploadPreview")} />
										</div>
										<Button
											className="absolute top-2 right-2"
											rounded="full"
											size="smallSquare"
											variant="danger"
											onClick={handleRemoveFile}
										>
											<Icon
												label={t("common.editSomething", {
													something: t("settings.field.avatar").toLowerCase(),
												})}
												name="close"
											/>
										</Button>
									</div>
								) : (
									<div
										className={clsx(
											"relative min-w-full max-w-64",
											state !== "idle" &&
												formMethod === "DELETE" &&
												"animate-pulse"
										)}
									>
										<Avatar
											layout="fill"
											size="initial"
											user={foundUser}
											variant="square"
										/>
										<div className="absolute top-2 right-2">
											<Button
												form="deleteAvatarForm"
												rounded="full"
												size="smallSquare"
												type="submit"
												variant="danger"
												onClick={(e) => e.stopPropagation()}
											>
												<Icon
													label={t("common.editSomething", {
														something: t("settings.field.avatar").toLowerCase(),
													})}
													name="delete"
												/>
											</Button>
										</div>
									</div>
								)}
							</div>
						)}
						<div className="inline-flex flex-col justify-center items-center gap-2 text-center">
							{t("common.dropzone.instructions")}
							{((state === "submitting" &&
								formMethod === "POST" &&
								isUploadSlow) ||
								files[0]?.size > 1 * MB) &&
								` ${t("common.dropzone.uploadNote")}`}
						</div>
					</div>
				</Form>
				<FormError
					error={
						fileRejections.length > 0
							? t(
									`error.${fileRejections[0]?.errors[0]?.code}` as unknown as TemplateStringsArray
							  )
							: actionData?.formError
					}
				/>
			</div>
		</Modal>
	);
};

export const action = async ({ request }: ActionFunctionArgs) => {
	const authData = await auth.isAuthenticated(request);

	if (!authData) {
		throw new Response(null, { status: 401 });
	}

	const t = await i18next.getFixedT(request);

	const session = await sessionStorage.getSession(
		request.headers.get("Cookie")
	);

	switch (request.method) {
		case "DELETE":
			{
				const clonedRequest = request.clone();
				const photo = z.string().parse((await request.formData()).get("photo"));

				const isAvatarDeleted = await deleteImage(photo);

				if (!isAvatarDeleted) {
					return errorCatcher(clonedRequest, t("error.somethingWentWrong"));
				}

				const updatedUser = await prisma.user
					.update({
						data: { photo: Prisma.JsonNull },
						where: {
							id: authData.id,
						},
					})
					.catch((formError) => errorCatcher(request, formError));

				session.set(auth.sessionKey, updatedUser);
			}

			return json(
				{
					success: true,
					formError: undefined as string | undefined,
				},
				{
					headers: {
						"Set-Cookie": await sessionStorage.commitSession(session),
					},
				}
			);
		case "POST":
			{
				const uploadHandler = unstable_composeUploadHandlers(
					async ({ name, data }) => {
						if (name !== "img") {
							return undefined;
						}

						const uploadedImage = await uploadImage(data, "users", authData.id);

						return JSON.stringify(uploadedImage);
					}
				);

				const formData = await unstable_parseMultipartFormData(
					request.clone(),
					uploadHandler
				);

				const cloudinaryResponse = formData.get("img");

				if (!cloudinaryResponse) {
					return errorCatcher(request, t("error.somethingWentWrong"));
				}

				const cloudinaryObject = CloudinaryUploadApiResponseSchema.parse(
					JSON.parse(cloudinaryResponse.toString())
				);

				const blurHash = await getBlurHash(cloudinaryObject);

				Object.assign(cloudinaryObject, { blurHash });

				const cloudinaryData =
					CloudinaryUploadApiResponseWithBlurHashSchema.parse(cloudinaryObject);

				const updatedUser = await prisma.user
					.update({
						data: { photo: cloudinaryData },
						where: {
							id: authData.id,
						},
					})
					.catch((formError) => errorCatcher(request, formError));

				session.set(auth.sessionKey, updatedUser);
			}

			return json(
				{
					success: true,
					formError: undefined as string | undefined,
				},
				{
					headers: {
						"Set-Cookie": await sessionStorage.commitSession(session),
					},
				}
			);
	}

	return errorCatcher(request, t("error.somethingWentWrong"));
};

export default EditAvatarModal;
