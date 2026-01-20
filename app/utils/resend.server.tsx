import { type User } from "@prisma/client";
import { render } from "@react-email/render";
import { type SendEmailFunction } from "remix-auth-email-link";
import { Resend } from "resend";

import { PARSED_ENV } from "~/consts/parsed-env.const";
import { ChangeEmail } from "~/emails/change-email";
import { MagicLinkEmail } from "~/emails/magic-link";
import { Language } from "~/enums/language.enum";
import { Message } from "~/enums/message.enum";
import i18next from "~/modules/i18next.server";
import { LanguageSchema } from "~/schemas/common";

const resend = new Resend(PARSED_ENV.RESEND_API_KEY);

export const sendEmail = async (
	to: string,
	subject: string,
	react: React.ReactElement
) => {
	try {
		const { data, error } = await resend.emails.send({
			from: PARSED_ENV.RESEND_FROM,
			to,
			subject,
			html: await render(react),
		});

		if (error) {
			console.error(error);
			throw new Error(Message.EMAIL_NOT_SENT);
		}

		return data;
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

	const subject = user?.isVerified
		? t("email.magic.subject.login")
		: t("email.magic.subject.register");

	await sendEmail(
		emailAddress,
		subject,
		<MagicLinkEmail
			buttonURL={buttonURL.href}
			contentCTA={t("email.magic.content.CTA", {
				appName: PARSED_ENV.APP_NAME,
			})}
			contentParagraph={t("email.magic.content.paragraph", {
				appName: PARSED_ENV.APP_NAME,
			})}
			contentTitle={
				user?.isVerified
					? t("email.magic.subject.login")
					: t("email.magic.subject.register")
			}
			preheader={t("email.magic.preheader", { appName: PARSED_ENV.APP_NAME })}
			subject={subject}
		/>
	);
};

export const sendChangeEmail = async (
	request: Request,
	token: string,
	email: string
) => {
	const t = await i18next.getFixedT(request.clone() ?? "en");

	const subject = t("email.changeEmail.subject");

	await sendEmail(
		email,
		subject,
		<ChangeEmail
			buttonURL={
				new URL(`/change-email?token=${token}`, PARSED_ENV.DOMAIN_URL).href
			}
			contentCTA={t("email.changeEmail.content.CTA", {
				appName: PARSED_ENV.APP_NAME,
			})}
			contentParagraph={t("email.changeEmail.content.paragraph")}
			contentTitle={t("email.changeEmail.subject")}
			preheader={t("email.changeEmail.preheader")}
			subject={subject}
		/>
	);
};
