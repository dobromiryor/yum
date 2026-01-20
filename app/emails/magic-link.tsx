import {
	Button,
	Container,
	Head,
	Html,
	Preview,
	Section,
	Text,
} from "@react-email/components";

interface MagicLinkEmailProps {
	subject: string;
	preheader: string;
	contentTitle: string;
	contentParagraph: string;
	contentCTA: string;
	buttonURL: string;
}

export const MagicLinkEmail = ({
	subject,
	preheader,
	contentTitle,
	contentParagraph,
	contentCTA,
	buttonURL,
}: MagicLinkEmailProps) => (
	<Html>
		<Head>
			<title>{subject}</title>
		</Head>
		<Preview>{preheader}</Preview>
		<Section>
			<Container>
				<Text>{contentTitle}</Text>
				<Text>{contentParagraph}</Text>
				<Button href={buttonURL}>{contentCTA}</Button>
			</Container>
		</Section>
	</Html>
);
