export default class CommonExpectations {

	public static ExpectTimesToBeBeforeNow = (times: { [time: string]: string | undefined }): void => { // Ensure no times are in the future
		Object.values(times).forEach((time: string | undefined): void => {
			if (time) expect(new Date(time).getTime()).toBeLessThanOrEqual(new Date().getTime());
		});
	}

}
