interface ParagraphMapProps {
	text: string | null | undefined;
	as?: "span" | "p" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
}

export const ParagraphMap = ({ text, as = "p" }: ParagraphMapProps) => {
	if (!text) {
		return null;
	}

	const paragraphs = text.split("\n").filter((item) => item !== "");

	const ElementType = as as keyof JSX.IntrinsicElements;

	if (paragraphs.length > 0) {
		return paragraphs.map((paragraph, index) => (
			<ElementType key={`Paragraph__${paragraph}__${index}`}>
				{paragraph}
			</ElementType>
		));
	} else {
		return null;
	}
};
