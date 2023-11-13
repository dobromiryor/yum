import { encode } from "blurhash";
import sharp from "sharp";
import { type z } from "zod";

import { type CloudinaryUploadApiResponseSchema } from "~/schemas/cloudinary.schema";

export const getBlurHash = async (
	cloudinaryObject: z.infer<typeof CloudinaryUploadApiResponseSchema>
) => {
	const { url } = cloudinaryObject;
	const response = await fetch(url, {
		headers: { Accept: "image/*" },
	});
	const arrayBuffer = await response.arrayBuffer();
	const array = new Uint8Array(arrayBuffer);
	const image = sharp(array);
	const buffer = await image
		.raw()
		.ensureAlpha()
		.toBuffer({ resolveWithObject: true });
	const data = Uint8ClampedArray.from(buffer.data);
	const blurHash = encode(data, buffer.info.width, buffer.info.height, 4, 4);

	return blurHash;
};
