import { type User } from "@prisma/client";
import SendGrid from "@sendgrid/mail";
import { type SendEmailFunction } from "remix-auth-email-link";
import { type z } from "zod";

import { PARSED_ENV } from "~/consts/parsed-env.const";
import { Language } from "~/enums/language.enum";
import { Message } from "~/enums/message.enum";
import i18next from "~/modules/i18next.server";
import { LanguageSchema } from "~/schemas/common";
import { type DynamicTemplateSchema } from "~/schemas/dynamic-template.schema";

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
	const { user, magicLink, emailAddress, form } = options;

	const buttonURL = new URL(magicLink);

	const from = form.get("from")?.toString();

	if (from && from !== "null") {
		buttonURL.searchParams.append("from", encodeURI(from));
	}

	const language =
		LanguageSchema.parse(form.get("language")?.toString()) ?? Language.EN;

	const t = await i18next.getFixedT(language);

	const dynamicTemplateData: z.infer<typeof DynamicTemplateSchema> = {
		appName: PARSED_ENV.APP_NAME,
		subject: user?.isVerified
			? t("email.magic.subject.login")
			: t("email.magic.subject.register"),
		preheader: t("email.magic.preheader", { appName: PARSED_ENV.APP_NAME }),
		contentTitle: user?.isVerified
			? t("email.magic.subject.login")
			: t("email.magic.subject.register"),
		contentParagraph: t("email.magic.content.paragraph", {
			appName: PARSED_ENV.APP_NAME,
		}),
		contentCTA: t("email.magic.content.CTA", { appName: PARSED_ENV.APP_NAME }),
		buttonURL: buttonURL.href,
	};

	await sendEmail({
		to: emailAddress,
		from: {
			email: PARSED_ENV.SENDGRID_FROM_EMAIL,
			name: PARSED_ENV.SENDGRID_FROM_NAME,
		},
		dynamicTemplateData,
		templateId: PARSED_ENV.SENDGRID_MAGIC_LINK_AUTH_TEMPLATE,
	});
};

export const sendChangeEmail = async (
	request: Request,
	token: string,
	email: string
) => {
	const t = await i18next.getFixedT(request.clone() ?? "en");

	const dynamicTemplateData: z.infer<typeof DynamicTemplateSchema> = {
		appName: PARSED_ENV.APP_NAME,
		subject: t("email.changeEmail.subject"),
		preheader: t("email.changeEmail.preheader"),
		contentTitle: t("email.changeEmail.subject"),
		contentParagraph: t("email.changeEmail.content.paragraph"),
		contentCTA: t("email.changeEmail.content.CTA", {
			appName: PARSED_ENV.APP_NAME,
		}),
		buttonURL: new URL(`/change-email?token=${token}`, PARSED_ENV.DOMAIN_URL)
			.href,
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
