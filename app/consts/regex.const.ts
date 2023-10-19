export const QUANTITY_REGEX =
	/^(?!0+(?:[,.]0+)?$)(?!1\/0$)(?:[1-9]\d*(?:[,.]\d+)?|0[,.]\d*[1-9]\d*|0?[1-9]\d*)?(?:\/[1-9]\d*)?$/;

export const USERNAME_REGEX = /(?!.*[.-_]{2,})^[a-zA-Z._-]+$/;

export const NAME_REGEX = /^[а-яА-Я]+$|^[a-zA-Z]+$/;
