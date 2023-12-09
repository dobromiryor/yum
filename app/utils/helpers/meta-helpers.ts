import imageFallback from "public/images/social/dark.png";
import { DARK, LIGHT } from "~/consts/color.const";
import { Theme } from "~/utils/providers/theme-provider";

const MAX_TITLE_LENGTH = 70;
const MAX_DESCRIPTION_LENGTH = 155;
const ELLIPSIS = "...";

export const generateMetaTitle = ({
	prefix,
	title,
	postfix,
	separator = " | ",
}: {
	prefix?: string;
	title: string;
	postfix?: string;
	separator?: string;
}) => {
	const prefixL = prefix ? (prefix?.length ?? 0) + separator.length : 0;
	const postfixL = postfix ? separator.length + postfix?.length : 0;
	const maxTitleL = MAX_TITLE_LENGTH - prefixL - postfixL;
	const titleL = title.length;
	const ellipsisL = ELLIPSIS.length;

	const slicedTitle =
		titleL > maxTitleL
			? title.slice(0, maxTitleL - ellipsisL) + ELLIPSIS
			: title;

	return `${prefix ? prefix + separator : ""}${slicedTitle}${
		postfix ? separator + postfix : ""
	}`;
};

export const generateMetaDescription = ({
	description,
}: {
	description: string;
}) => {
	const ellipsisL = ELLIPSIS.length;

	return description.length > MAX_DESCRIPTION_LENGTH
		? description.slice(0, MAX_DESCRIPTION_LENGTH - ellipsisL) + ELLIPSIS
		: description;
};

type GenerateMetaProps = {
	url: string;
	title?: string;
	description?: string;
	path?: string;
	image?: string;
	theme?: Theme | null;
};

export const generateMetaProps = (props: GenerateMetaProps | undefined) => {
	const metaArr: { [key: string]: string }[] = [];

	if (!props) {
		return metaArr;
	}

	const {
		url,
		title,
		description,
		path = url,
		image = `${url}${imageFallback}`,
		theme,
	} = props;

	if (title) {
		metaArr.push({ title });
		metaArr.push({ "og:title": title });
		metaArr.push({ "twitter:title": title });
	}

	if (description) {
		metaArr.push({ name: "description", content: description });
		metaArr.push({ "og:description": description });
		metaArr.push({ "twitter:description": description });
	}

	if (image) {
		metaArr.push({ "og:image": image });
		metaArr.push({ "twitter:image": image });
	}

	if (path) {
		metaArr.push({ "og:url": `${url}${path}` });
		metaArr.push({ "twitter:url": `${url}${path}` });
	}

	metaArr.push({ "og:type": "website" });
	metaArr.push({ "twitter:card": image ? "summary_large_image" : "summary" });

	metaArr.push({
		name: "theme-color",
		content: theme === Theme.LIGHT ? LIGHT : DARK,
	});

	return metaArr;
};
