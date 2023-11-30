import { AdvancedImage, lazyload } from "@cloudinary/react";
import * as urlGen from "@cloudinary/url-gen";
import { dpr } from "@cloudinary/url-gen/actions/delivery";
import { name } from "@cloudinary/url-gen/actions/namedTransformation";
import { fill, scale } from "@cloudinary/url-gen/actions/resize";
import { ar1X1 } from "@cloudinary/url-gen/qualifiers/aspectRatio";
import { auto } from "@cloudinary/url-gen/qualifiers/dpr";
import { autoBest } from "@cloudinary/url-gen/qualifiers/quality";
import { blurhashToGradientCssObject } from "@unpic/placeholder";
import clsx from "clsx";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { type z } from "zod";

import { useTypedRouteLoaderData } from "~/hooks/useTypedRouteLoaderData";
import { type CloudinaryUploadApiResponseWithBlurHashSchema } from "~/schemas/cloudinary.schema";

interface ImageProps {
	className?: string;
	photo: z.infer<typeof CloudinaryUploadApiResponseWithBlurHashSchema>;
	transformation?: string;
}

export const Image = ({ className, photo, transformation }: ImageProps) => {
	const [isLoaded, setIsLoaded] = useState(false);
	const { ENV } = useTypedRouteLoaderData("root");
	const ref = useRef<AdvancedImage>(null);

	const cldImg = new urlGen.CloudinaryImage(
		photo.public_id,
		{
			cloudName: ENV.CLOUDINARY_CLOUD_NAME,
		},
		{
			analytics: false,
		}
	).setVersion(photo.version);

	if (transformation) {
		cldImg.namedTransformation(name(transformation)).format("auto");
	} else {
		cldImg
			.resize(fill().gravity("auto").aspectRatio(ar1X1()))
			.resize(scale().width("auto"))
			.quality(autoBest())
			.delivery(dpr(auto()))
			.format("auto");
	}

	const placeholder = blurhashToGradientCssObject(photo.blurHash);

	useEffect(() => {
		if (ref.current?.imageRef.current) {
			ref.current.imageRef.current.classList.add("w-full");
			!transformation &&
				ref.current.imageRef.current.classList.add("aspect-square");

			ref.current.imageRef.current.onload = () => {
				setIsLoaded(true);
			};
		}
	}, [ref, transformation]);

	return (
		<div
			className={clsx(!transformation && "aspect-square", className)}
			style={placeholder}
		>
			<motion.div
				animate={isLoaded ? { opacity: 1 } : { opacity: 0 }}
				className={clsx("w-full", !transformation && "aspect-square")}
				initial={{ opacity: 0 }}
			>
				<AdvancedImage ref={ref} cldImg={cldImg} plugins={[lazyload()]} />
			</motion.div>
		</div>
	);
};
