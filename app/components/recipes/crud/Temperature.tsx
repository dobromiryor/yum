import { type TemperatureScale } from "@prisma/client";

interface TemperatureProps {
	temperature: number | null | undefined;
	temperatureScale: TemperatureScale | null | undefined;
}

export const TemperatureString = ({
	temperature,
	temperatureScale,
}: TemperatureProps) =>
	temperature && temperatureScale && `${temperature} °${temperatureScale}`;
