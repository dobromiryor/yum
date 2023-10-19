import { DisplayName, Role } from "@prisma/client";
import {
	json,
	redirect,
	type ActionFunctionArgs,
	type LoaderFunctionArgs,
} from "@remix-run/node";
import {
	Link,
	Outlet,
	useLoaderData,
	useNavigation,
	useSearchParams,
	useSubmit,
} from "@remix-run/react";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { Avatar } from "~/components/common/Avatar";
import { Note } from "~/components/common/Note";
import { Pill } from "~/components/common/Pill";
import { Button } from "~/components/common/UI/Button";
import { Icon } from "~/components/common/UI/Icon";
import { Switch } from "~/components/common/UI/Switch";
import { Message } from "~/enums/message.enum";
import { useAuth } from "~/hooks/useAuth";
import { SettingsSchema } from "~/schemas/settings.schema";
import { auth } from "~/utils/auth.server";
import { debounce } from "~/utils/helpers/debounce";
import { prisma } from "~/utils/prisma.server";
import { sessionStorage } from "~/utils/session.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const authData = await auth.isAuthenticated(request, {
		failureRedirect: "/login",
	});

	const foundUser = await prisma.user.findUnique({
		where: { id: authData.id },
	});

	if (!foundUser) {
		return redirect("/login");
	}

	let updatedUser;

	if (
		foundUser.prefersDisplayName !== DisplayName.email &&
		(!foundUser.firstName || !foundUser.lastName) &&
		!foundUser.username
	) {
		await prisma.user.update({
			data: { prefersDisplayName: DisplayName.email },
			where: { id: authData.id },
		});
	}

	return json({
		authData,
		foundUser: updatedUser ?? foundUser,
	});
};

export const action = async ({ request }: ActionFunctionArgs) => {
	const authData = await auth.isAuthenticated(request, {
		failureRedirect: "/login",
	});

	const session = await sessionStorage.getSession(
		request.clone().headers.get("Cookie")
	);

	const { prefersDisplayName } = SettingsSchema.parse(
		Object.fromEntries((await request.clone().formData()).entries())
	);

	const updatedUser = await prisma.user.update({
		data: { prefersDisplayName },
		where: { id: authData.id },
	});

	session.set(auth.sessionKey, updatedUser);

	return json(
		{ success: true },
		{ headers: { "Set-Cookie": await sessionStorage.commitSession(session) } }
	);
};

export default function SettingsRoute() {
	const { authData, foundUser } = useLoaderData<typeof loader>();
	const { user } = useAuth(authData);
	const { state } = useNavigation();
	const { t } = useTranslation();
	const submit = useSubmit();
	const [searchParams] = useSearchParams();

	const {
		firstName,
		lastName,
		username,
		email,
		prefersDisplayName,
		prefersTemperatureScale,
		prefersUnitSystem,
	} = foundUser;

	const renderHeader = () => {
		if (
			prefersDisplayName !== DisplayName.email &&
			(username || (firstName && lastName))
		) {
			if (prefersDisplayName === DisplayName.username && username) {
				return username;
			}

			if (prefersDisplayName === DisplayName.names && firstName && lastName) {
				return `${firstName} ${lastName}`;
			}

			return email.split("@")[0];
		}

		return email.split("@")[0];
	};

	const src = null; // TODO: Avatar

	const handleDisplayNameChange = () => {
		submit(
			{
				prefersDisplayName:
					prefersDisplayName === DisplayName.username
						? DisplayName.names
						: DisplayName.username,
			},
			{ method: "patch" }
		);
	};

	const getMessage = () => {
		const message = z
			.nativeEnum(Message)
			.nullish()
			.parse(searchParams.get("message"));

		switch (message) {
			case Message.EMAIL_UPDATED:
				return t("settings.note.EMAIL_UPDATED");
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

				<div className="flex flex-col sm:flex-row gap-3 p-3 bg-secondary dark:bg-primary rounded-2xl shadow-lg transition-colors">
					<div className="flex-shrink-0 bg-light dark:bg-dark aspect-square rounded-xl overflow-hidden">
						{src ? (
							<img alt="" className="aspect-square rounded-xl" src={src} />
						) : (
							<Avatar size="fill" variant="square" />
						)}
					</div>
					<div className="flex-grow flex flex-col sm:flex-row gap-3 justify-between">
						<div className="flex flex-col justify-between gap-3">
							<div className="flex flex-col gap-1">
								<div className="flex gap-2 items-center flex-wrap">
									<h2 className="text-xl typography-semibold">
										{renderHeader()}
									</h2>
									{foundUser.role === Role.ADMIN && (
										<Pill icon="shield_person" label={t("common.admin")} />
									)}
								</div>
								<div className="flex items-center gap-2">
									<p>{user?.email}</p>
									<Link preventScrollReset tabIndex={-1} to="change-email">
										<Button rounded="full" size="smallSquare" variant="normal">
											<Icon
												grade="200"
												icon="edit"
												label={t("common.editSomething", {
													something: t("settings.field.email").toLowerCase(),
												})}
												size="small"
												weight="600"
											/>
										</Button>
									</Link>
								</div>
							</div>
							<div className="flex flex-col gap-1">
								{prefersDisplayName !== DisplayName.email &&
									username &&
									firstName &&
									lastName && (
										<Switch
											isLoading={state !== "idle"}
											label={`${t("settings.field.publicName")}: `}
											labelPosition="left"
											labelWeight="normal"
											name="prefersDisplayName"
											offLabel={t("settings.field.username")}
											value={prefersDisplayName === DisplayName.names}
											variant="secondary"
											onChange={debounce(handleDisplayNameChange, 300)}
											onLabel={t("settings.field.names")}
										/>
									)}
								<div className="flex gap-2">
									<Pill
										icon="weight"
										label={t(`common.units.${prefersUnitSystem}`)}
									/>
									<Pill
										icon="device_thermostat"
										label={`°${prefersTemperatureScale}`}
									/>
									<Link
										preventScrollReset
										tabIndex={-1}
										to="change-preferences"
									>
										<Button rounded="full" size="smallSquare" variant="normal">
											<Icon
												grade="200"
												icon="edit"
												label={t("common.editSomething", {
													something: t(
														"settings.field.preferences"
													).toLowerCase(),
												})}
												size="small"
												weight="600"
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
