export default class Calculations {

	public static PriceDifference = (startPrice: number, endPrice: number, precision: number): string =>
		(endPrice - startPrice).toFixed(precision)

	public static PricePercentageDifference = (startPrice: number, endPrice: number): number => { // Rounded to prevent small number issues
		const roundedStartPrice: number = startPrice * 1000;
		const roundedEndPrice: number = endPrice * 1000;
		const roundedPriceDifference: number = roundedEndPrice - roundedStartPrice;

		return (roundedEndPrice !== roundedStartPrice) ?
			Number(((roundedPriceDifference / roundedStartPrice) * 100).toFixed(4)) :
			0;
	}

}
