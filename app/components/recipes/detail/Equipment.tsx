import { type Equipment as EquipmentType } from "@prisma/client";
import { type SerializeFrom } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import { Dimension, Volume } from "~/components/recipes/crud/Equipment";
import { type loader } from "~/routes/recipes.$recipeId._index";
import { TranslatedContentSchema } from "~/schemas/common";

interface EquipmentProps {
	equipment: SerializeFrom<EquipmentType>;
}

interface EquipmentListProps {
	keyPrefix?: string;
	equipment: SerializeFrom<EquipmentType>[];
}

interface EquipmentCardProps extends EquipmentListProps {
	title?: string | null;
}

export const Equipment = ({ equipment }: EquipmentProps) => {
	const { locale } = useLoaderData<typeof loader>();

	const { name: n } = equipment;
	const name = TranslatedContentSchema.parse(n);

	return (
		<li className="flex gap-1">
			<span className="typography-medium">{name[locale]}</span>
			<Dimension shouldConvert equipment={equipment} />
			<Volume shouldConvert equipment={equipment} />
		</li>
	);
};

export const EquipmentList = ({ equipment, keyPrefix }: EquipmentListProps) => {
	return (
		<ul>
			{equipment.map((item, index) => {
				return (
					<Equipment
						key={`${keyPrefix ? `${keyPrefix}__` : ""}Equipment__${
							item.id
						}__${index}`}
						equipment={item}
					/>
				);
			})}
		</ul>
	);
};

export const EquipmentCard = ({
	keyPrefix,
	title,
	equipment,
}: EquipmentCardProps) => {
	return (
		<div className="flex flex-col gap-1 p-3 bg-secondary dark:bg-primary rounded-2xl shadow-lg transition-colors">
			{title && <h3 className="text-lg typography-medium">{title}</h3>}
			<EquipmentList equipment={equipment} keyPrefix={keyPrefix} />
		</div>
	);
};
