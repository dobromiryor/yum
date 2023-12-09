import { fill } from "@cloudinary/url-gen/actions/resize";
import { Cloudinary, CloudinaryImage } from "@cloudinary/url-gen/index";
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
} from "@remix-run/react";
import clsx from "clsx";
import { useEffect, useState, type MouseEvent } from "react";
import { useDropzone } from "react-dropzone-esm";
import { useTranslation } from "react-i18next";

import { Modal } from "~/components/common/Modal";
import { Pill } from "~/components/common/Pill";
import { Button } from "~/components/common/UI/Button";
import { FormError } from "~/components/common/UI/FormError";
import { Icon } from "~/components/common/UI/Icon";
import { Image } from "~/components/common/UI/Image";
import { MB } from "~/consts/mb";
import { PARSED_ENV } from "~/consts/parsed-env.const";
import { useDataTransfer } from "~/hooks/useDataTransfer";
import { useIsLoading } from "~/hooks/useIsLoading";
import { useSlowUpload } from "~/hooks/useSlowUpload";
import { useTypedRouteLoaderData } from "~/hooks/useTypedRouteLoaderData";
import i18next from "~/modules/i18next.server";
import {
	CloudinaryUploadApiResponseSchema,
	CloudinaryUploadApiResponseWithBlurHashSchema,
} from "~/schemas/cloudinary.schema";
import { EditRecipeParamsSchema } from "~/schemas/params.schema";
import { auth } from "~/utils/auth.server";
import { uploadImage } from "~/utils/cloudinary.server";
import { errorCatcher } from "~/utils/helpers/error-catcher.server";
import { getBlurHash } from "~/utils/helpers/get-blur-hash.server";
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

export const loader = async ({ request, params: p }: LoaderFunctionArgs) => {
	const authData = await auth.isAuthenticated(request.clone());

	if (!authData) {
		throw new Response(null, { status: 401 });
	}

	const { recipeId } = EditRecipeParamsSchema.parse(p);

	const foundRecipe = await prisma.recipe.findUnique({
		where: { id: recipeId },
	});

	if (!foundRecipe) {
		throw new Response(null, { status: 404 });
	}

	if (foundRecipe.userId !== authData.id && authData.role !== "ADMIN") {
		throw new Response(null, { status: 403 });
	}

	const t = await i18next.getFixedT(request);
	const title = generateMetaTitle({
		title: t("common.addSomething", {
			something: `${t("recipe.field.photo")}`.toLowerCase(),
		}),
		postfix: PARSED_ENV.APP_NAME,
	});
	const description = generateMetaDescription({
		description: t("seo.home.description", { appName: PARSED_ENV.APP_NAME }),
	});

	return json({
		foundRecipe,
		meta: {
			title,
			description,
			url: `${PARSED_ENV.DOMAIN_URL}`,
			path: `/recipes/edit/${recipeId}/photo`,
			theme: (await getThemeSession(request)).getTheme(),
		},
	});
};

const AddPhotoModal = () => {
	const [isOpen, setIsOpen] = useState<boolean>(true);
	const [isUploadSlow, setIsUploadSlow] = useState<boolean>(false);
	const [files, setFiles] = useState<(File & { preview: string })[]>([]);

	const { ENV } = useTypedRouteLoaderData("root");
	const { foundRecipe } = useLoaderData<typeof loader>();
	const actionData = useActionData<typeof action>();

	const { t } = useTranslation();
	const [isLoading] = useIsLoading();

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

	const { photo: p } = foundRecipe;
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
			isLoading={isLoading}
			isOpen={isOpen}
			prevPath={prevPath}
			setIsOpen={setIsOpen}
			success={actionData?.success}
			title={t("recipe.modal.update.photo.title")}
		>
			<div className="flex flex-col gap-4">
				<Form encType="multipart/form-data" id="uploadAvatarForm" method="POST">
					<div
						className={clsx(
							"flex flex-col sm:flex-row items-center gap-3 p-3 sm rounded-lg border cursor-pointer",
							fileRejections[0]?.errors[0]?.code
								? "border-red-500"
								: "border-secondary dark:border-primary",
							isDragActive && "bg-secondary dark:bg-primary",
							isLoading && "animate-pulse"
						)}
						{...getRootProps()}
					>
						<input ref={inputRef} name="img" {...getInputProps()} />
						{(files[0]?.preview || photo) && (
							<div
								className={clsx(
									"grow shrink-0 rounded-md border border-secondary dark:border-primary overflow-hidden w-full h-full max-w-64 max-h-64",
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
								) : photo ? (
									<Image className="max-w-64" photo={photo} />
								) : null}
							</div>
						)}
						<div className="inline-flex flex-col justify-center items-center gap-2 text-center">
							{t("common.dropzone.instructions")}
							{((isLoading && isUploadSlow) || files[0]?.size > 1 * MB) &&
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
							: typeof actionData?.success === "boolean" && !actionData?.success
							  ? t("error.somethingWentWrong")
							  : undefined
					}
				/>
			</div>
		</Modal>
	);
};

export const action = async ({ request, params: p }: ActionFunctionArgs) => {
	const authData = await auth.isAuthenticated(request);

	if (!authData) {
		throw new Response(null, { status: 401 });
	}

	const { recipeId } = EditRecipeParamsSchema.parse(p);
	const t = await i18next.getFixedT(request);

	const uploadHandler = unstable_composeUploadHandlers(
		async ({ name, data }) => {
			if (name !== "img") {
				return undefined;
			}

			const uploadedImage = await uploadImage(data, "recipes", recipeId);

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

	let success = true;

	return await prisma.recipe
		.update({
			data: { photo: cloudinaryData },
			where: {
				id: recipeId,
			},
		})
		.catch(() => (success = false))
		.then(() => json({ success }));
};

export default AddPhotoModal;
