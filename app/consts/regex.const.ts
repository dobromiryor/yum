export const QUANTITY_REGEX =
	/^(?!0+(?:[,.]0+)?$)(?!1\/0$)(?:[1-9]\d*(?:[,.]\d+)?|0[,.]\d*[1-9]\d*|0?[1-9]\d*)?(?:\/[1-9]\d*)?$/;

export const USERNAME_REGEX = /^[a-zA-Z0-9]+(?:[._-][a-zA-Z0-9]+)*$/;

export const NAME_REGEX = /^[а-яА-Я]+$|^[a-zA-Z]+$/;

export const SLUG_REGEX = /^(([a-z0-9])+[-]?([a-z0-9])+)+[-]?([a-z0-9])+$/;
