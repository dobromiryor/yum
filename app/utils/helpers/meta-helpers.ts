import logo_dark from "public/images/logo/logo_square_dark.png";

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
	title?: string;
	description?: string;
	url?: string;
	image?: string;
};

export const generateMetaProps = (props: GenerateMetaProps | undefined) => {
	const metaArr: { [key: string]: string }[] = [];

	if (!props) {
		return metaArr;
	}

	const {
		title,
		description,
		url,
		image = logo_dark, // TODO: prefers-color-scheme?
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

	if (url) {
		metaArr.push({ "og:url": url });
		metaArr.push({ "twitter:url": url });
	}

	metaArr.push({ "og:type": "website" });
	metaArr.push({ "twitter:card": image ? "summary_large_image" : "summary" });

	return metaArr;
};
