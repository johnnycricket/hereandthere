import clockService from './clockService';

describe('All of clockService', () => {
    const service = clockService;
    let expectedTime,
        expectedHour,
        expectedMinute
    beforeEach(() => {
        expectedTime = new Date();
        expectedHour = expectedTime.getUTCHours();
        expectedMinute = expectedTime.getUTCMinutes();
    })
    it('should call service and return utc hour and minute as a string', () => {
        const actual = service();
        expect(actual).toEqual(`${expectedHour}:${expectedMinute}`);
    })
    it('should adjust time based on hour offset', () => {
        const actual = service(2);
        expectedHour = expectedHour + 2
        expect(actual).toEqual(`${expectedHour}:${expectedMinute}`);
    })
    it('offset should not got over 24', () => {
        const twentyfourmax = 24 - expectedHour + 1;
        if (expectedHour + twentyfourmax > 24){
            expectedHour = expectedHour + twentyfourmax - 24;
        }
        const actual = service(twentyfourmax);
        
        expect(actual).toEqual(`${expectedHour}:${expectedMinute}`);
    });
    it('offset should not go below 0', () => {
        const negExpectedHour = (expectedHour + 1) * -1;
        if (expectedHour + negExpectedHour < 0) {
            expectedHour = (expectedHour + negExpectedHour) + 24;
        }
        const actual = service(negExpectedHour);
        expect(actual).toEqual(`${expectedHour}:${expectedMinute}`);
    });
})