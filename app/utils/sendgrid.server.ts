import { type User } from "@prisma/client";
import * as SendGrid from "@sendgrid/mail";
import { type z } from "zod";

import { PARSED_ENV } from "~/consts/parsed-env.const";
import { Message } from "~/enums/message.enum";
import { type DynamicTemplateSchema } from "~/schemas/dynamic-template.schema";

type SendEmailOptions<User> = {
	emailAddress: string;
	magicLink: string;
	user?: User | null;
	domainUrl: string;
	form: FormData;
};

type SendEmailFunction<User> = {
	(options: SendEmailOptions<User>): Promise<void>;
};

SendGrid.setApiKey(PARSED_ENV.SENDGRID_API_KEY);

export const sendEmail = async (mail: SendGrid.MailDataRequired) => {
	try {
		const transport = await SendGrid.send(mail);

		return transport;
	} catch (error) {
		console.error(error);
		throw new Error(Message.EMAIL_NOT_SENT);
	}
};

export const sendAuthEmail: SendEmailFunction<User> = async (options) => {
	const { user, magicLink, emailAddress } = options;

	const dynamicTemplateData: z.infer<typeof DynamicTemplateSchema> = {
		appName: PARSED_ENV.APP_NAME,
		subject: user ? "Welcome!" : "Welcome back!",
		preheader: `Confirm that you want to sign in to ${PARSED_ENV.APP_NAME}`,
		contentTitle: user ? "Welcome!" : "Welcome back!",
		contentParagraph: `Please use the button below to confirm you want to sign in to ${PARSED_ENV.APP_NAME}.`,
		contentCTA: `Go to ${PARSED_ENV.APP_NAME}`,
		buttonURL: magicLink,
	};

	await sendEmail({
		to: emailAddress,
		from: {
			email: PARSED_ENV.SENDGRID_FROM_EMAIL,
			name: PARSED_ENV.SENDGRID_FROM_NAME,
		},
		dynamicTemplateData,
		templateId: user
			? PARSED_ENV.SENDGRID_MAGIC_LINK_LOGIN_TEMPLATE
			: PARSED_ENV.SENDGRID_MAGIC_LINK_REGISTER_TEMPLATE,
	});
};

export const sendChangeEmail = async (
	// user: User,
	url: string,
	email: string
) => {
	const dynamicTemplateData: z.infer<typeof DynamicTemplateSchema> = {
		appName: PARSED_ENV.APP_NAME,
		subject: "Change email address",
		preheader: "A change email request has been made.",
		contentTitle: "Change email address",
		contentParagraph:
			"Please use the button below to change your email address.",
		contentCTA: `Go to ${PARSED_ENV.APP_NAME}`,
		buttonURL: url,
		unsubscribeURL: new URL("unsubscribe", PARSED_ENV.DOMAIN_URL).href,
		unsubscribePreferencesURL: new URL(
			"unsubscribe-preferences",
			PARSED_ENV.DOMAIN_URL
		).href,
	};

	await sendEmail({
		to: email,
		from: {
			email: PARSED_ENV.SENDGRID_FROM_EMAIL,
			name: PARSED_ENV.SENDGRID_FROM_NAME,
		},
		dynamicTemplateData,
		templateId: PARSED_ENV.SENDGRID_CHANGE_EMAIL_TEMPLATE,
	});
};
