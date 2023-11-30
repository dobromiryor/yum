import { writeAsyncIterableToWritable } from "@remix-run/node";
import cloudinary, { type UploadApiResponse } from "cloudinary";

import { PARSED_ENV } from "~/consts/parsed-env.const";
import { getLocalTime } from "~/utils/helpers/get-time.server";

cloudinary.v2.config({
	cloud_name: PARSED_ENV.CLOUDINARY_CLOUD_NAME,
	api_key: PARSED_ENV.CLOUDINARY_API_KEY,
	api_secret: PARSED_ENV.CLOUDINARY_API_SECRET,
	analytics: false,
});

export const uploadImage = async (
	data: AsyncIterable<Uint8Array>,
	folder: "users" | "recipes",
	id: string
) => {
	const uploadPromise: Promise<UploadApiResponse> = new Promise(
		async (resolve, reject) => {
			const uploadStream = cloudinary.v2.uploader.upload_stream(
				{
					folder,
					public_id: id,

					transformation: {
						crop: "fill",
						aspect_ratio: "1:1",
						gravity: "auto",
					},
					invalidate: true,
				},
				(error, result) => {
					if (error) {
						console.error(
							getLocalTime(),
							"@uploadImage",
							data,
							folder,
							id,
							error
						);
						reject(error);

						return;
					}

					if (!result) {
						return;
					}

					resolve(result);
				}
			);

			await writeAsyncIterableToWritable(data, uploadStream);
		}
	);

	return uploadPromise;
};

export const deleteImage = async (publicId: string): Promise<boolean> => {
	const res = await cloudinary.v2.uploader.destroy(publicId, {
		invalidate: true,
	});

	if (!res || res.result !== "ok") {
		console.error(getLocalTime(), "@deleteImage", publicId, res);

		return false;
	}

	return true;
};
