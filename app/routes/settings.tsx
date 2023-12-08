import { DisplayName, Role } from "@prisma/client";
import {
	json,
	type LoaderFunctionArgs,
	type MetaFunction,
} from "@remix-run/node";
import { Link, Outlet, useLoaderData, useSearchParams } from "@remix-run/react";
import clsx from "clsx";
import isEqual from "lodash.isequal";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { Avatar } from "~/components/common/Avatar";
import { Note } from "~/components/common/Note";
import { Pill } from "~/components/common/Pill";
import { Button } from "~/components/common/UI/Button";
import { Icon } from "~/components/common/UI/Icon";
import { PARSED_ENV } from "~/consts/parsed-env.const";
import { Message } from "~/enums/message.enum";
import i18next from "~/modules/i18next.server";
import { auth } from "~/utils/auth.server";
import { getDisplayName } from "~/utils/helpers/get-display-name";
import {
	generateMetaDescription,
	generateMetaProps,
	generateMetaTitle,
} from "~/utils/helpers/meta-helpers";
import { prisma } from "~/utils/prisma.server";
import { sessionStorage } from "~/utils/session.server";

export const sitemap = () => ({
	exclude: true,
});

export const meta: MetaFunction<typeof loader> = ({ data }) => {
	return generateMetaProps(data?.meta);
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const authData = await auth.isAuthenticated(request);

	if (!authData) {
		throw new Response(null, { status: 401 });
	}

	const t = await i18next.getFixedT(request);
	const title = generateMetaTitle({
		title: t("seo.settings.title"),
		postfix: PARSED_ENV.APP_NAME,
	});
	const description = generateMetaDescription({
		description: t("seo.home.description", { appName: PARSED_ENV.APP_NAME }),
	});

	const foundUser = await prisma.user.findUnique({
		where: { id: authData.id },
	});

	if (!foundUser) {
		throw new Response(null, { status: 404 });
	}

	if (foundUser.id !== authData.id) {
		throw new Response(null, { status: 500, statusText: "Wrong user" });
	}

	let updatedUser;

	if (
		foundUser.prefersDisplayName !== DisplayName.email &&
		(!foundUser.firstName || !foundUser.lastName) &&
		!foundUser.username
	) {
		updatedUser = await prisma.user.update({
			data: { prefersDisplayName: DisplayName.email },
			where: { id: authData.id },
		});
	}

	const session = await sessionStorage.getSession(
		request.clone().headers.get("Cookie")
	);

	const { createdAt, updatedAt, lastLogin, ...restAuthData } = authData;
	const {
		createdAt: _cA,
		updatedAt: _uA,
		lastLogin: _lL,
		...restUserData
	} = updatedUser ?? foundUser;

	const isAuthDataStale = !isEqual(restAuthData, restUserData);

	if (isAuthDataStale) {
		session.set(auth.sessionKey, updatedUser ?? foundUser);
	}

	return json(
		{
			foundUser: updatedUser ?? foundUser,
			meta: {
				title,
				description,
				url: `${PARSED_ENV.DOMAIN_URL}/settings`,
			},
		},
		isAuthDataStale
			? {
					headers: {
						"Set-Cookie": await sessionStorage.commitSession(session),
					},
			  }
			: {}
	);
};

export default function SettingsRoute() {
	const { foundUser } = useLoaderData<typeof loader>();
	const [searchParams] = useSearchParams();
	const { t } = useTranslation();

	const { prefersTemperatureScale, prefersUnitSystem, autoConvert } = foundUser;

	const getMessage = () => {
		const message = z
			.nativeEnum(Message)
			.nullish()
			.parse(searchParams.get("message"));

		switch (message) {
			case Message.EMAIL_UPDATED:
				return t("settings.note.EMAIL_UPDATED");
			case Message.TOKEN_EXPIRED:
				return t("settings.note.TOKEN_EXPIRED");
			case Message.TOKEN_NOT_FOUND:
				return t("settings.note.TOKEN_NOT_FOUND");
			case Message.USER_NOT_UPDATED:
				return t("settings.note.USER_NOT_UPDATED");
			case Message.USER_VERIFIED:
				return t("settings.note.USER_VERIFIED");
			case Message.VERIFY_ADDRESS:
				return t("settings.note.VERIFY_ADDRESS");
			default:
				return null;
		}
	};

	return (
		<>
			<div className="flex flex-col gap-6">
				<h1 className="text-2xl typography-bold">
					{t("settings.heading.settings")}
				</h1>

				<Note
					isClearable
					icon={
						searchParams.get("success")
							? searchParams.get("success") === "true"
								? "check_circle"
								: "error"
							: "info"
					}
					message={getMessage()}
				/>
				<Note
					icon="info"
					message={
						foundUser.prefersDisplayName === DisplayName.email
							? t("settings.note.USER_NAMES")
							: null
					}
				/>

				<div className="flex flex-col sm:flex-row gap-3 p-3 bg-secondary dark:bg-primary rounded-2xl shadow-lg transition-colors">
					<div className="relative basis-min bg-light dark:bg-dark rounded-xl overflow-hidden">
						<Avatar
							className={clsx("max-w-none sm:max-w-xs")}
							layout="fill"
							user={foundUser}
							variant="square"
						/>
						<Link
							preventScrollReset
							className="absolute top-2 right-2"
							tabIndex={-1}
							to="change-avatar"
						>
							<Button rounded="full" size="smallSquare" variant="normal">
								<Icon
									label={t("common.editSomething", {
										something: t("settings.field.avatar").toLowerCase(),
									})}
									name="edit"
								/>
							</Button>
						</Link>
					</div>
					<div className="flex-grow flex flex-col sm:flex-row gap-3 justify-between">
						<div className="flex flex-col justify-between gap-3">
							<div className="flex flex-col gap-1">
								<div className="flex gap-2 items-center flex-wrap">
									<h2 className="text-xl typography-semibold">
										{getDisplayName(foundUser)}
									</h2>
									{foundUser.role === Role.ADMIN && (
										<Pill icon="shield_person" label={t("common.admin")} />
									)}
								</div>
								<div className="flex items-center gap-2">
									<p>{foundUser.email}</p>
									<Link preventScrollReset tabIndex={-1} to="change-email">
										<Button rounded="full" size="smallSquare" variant="normal">
											<Icon
												label={t("common.editSomething", {
													something: t("settings.field.email").toLowerCase(),
												})}
												name="edit"
											/>
										</Button>
									</Link>
								</div>
							</div>
							<div className="flex flex-col gap-1">
								<div className="flex flex-wrap gap-2">
									{autoConvert && (
										<Pill
											icon="change_circle"
											label={t("settings.field.autoConvert")}
										/>
									)}
									<Pill
										icon="weight"
										label={t(`common.units.${prefersUnitSystem}`)}
									/>
									<Pill
										icon="thermometer"
										label={`°${prefersTemperatureScale}`}
									/>
									<Link
										preventScrollReset
										tabIndex={-1}
										to="change-preferences"
									>
										<Button rounded="full" size="smallSquare" variant="normal">
											<Icon
												label={t("common.editSomething", {
													something: t(
														"settings.field.preferences"
													).toLowerCase(),
												})}
												name="edit"
											/>
										</Button>
									</Link>
								</div>
							</div>
						</div>
						<div className="flex flex-row flex-wrap sm:flex-col sm:flex-nowrap gap-3">
							<Link preventScrollReset tabIndex={-1} to="change-username">
								<Button className="w-full" variant="normal">
									{t("common.editSomething", {
										something: t("settings.field.username").toLocaleLowerCase(),
									})}
								</Button>
							</Link>
							<Link preventScrollReset tabIndex={-1} to="change-names">
								<Button className="w-full" variant="normal">
									{t("common.editSomething", {
										something: t("settings.field.names").toLocaleLowerCase(),
									})}
								</Button>
							</Link>
							<Link preventScrollReset tabIndex={-1} to="delete">
								<Button className="w-full" variant="normal">
									{t("common.deleteSomething", {
										something: t("settings.field.account").toLocaleLowerCase(),
									})}
								</Button>
							</Link>
							<Link tabIndex={-1} to="/logout">
								<Button className="w-full" variant="normal">
									{t("nav.authMenu.logout")}
								</Button>
							</Link>
						</div>
					</div>
				</div>
			</div>
			{/* Modal outlet */}
			<Outlet />
		</>
	);
}

export { ErrorBoundaryContent as ErrorBoundary } from "~/components/common/ErrorBoundary";
