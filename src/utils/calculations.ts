export default class Calculations {

	public static PriceDifference = (startPrice: number, endPrice: number): number => startPrice - endPrice;

	public static PricePercentageDifference = (startPrice: number, endPrice: number): number => { // Rounded to prevent small number issues
		const roundedStartPrice: number = startPrice * 1000;
		const roundedEndPrice: number = endPrice * 1000;
		const roundedPriceDifference: number = roundedEndPrice - roundedStartPrice;

		return (roundedEndPrice !== roundedStartPrice) ? ((roundedPriceDifference / roundedStartPrice) * 100) : 0;
	}

}
