import {
	Button,
	Container,
	Head,
	Html,
	Preview,
	Section,
	Text,
} from "@react-email/components";

interface ChangeEmailProps {
	subject: string;
	preheader: string;
	contentTitle: string;
	contentParagraph: string;
	contentCTA: string;
	buttonURL: string;
}

export const ChangeEmail = ({
	subject,
	preheader,
	contentTitle,
	contentParagraph,
	contentCTA,
	buttonURL,
}: ChangeEmailProps) => (
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
