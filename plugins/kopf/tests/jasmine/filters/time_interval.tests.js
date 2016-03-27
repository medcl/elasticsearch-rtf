describe('filter', function() {

  beforeEach(module('kopf'));

  describe('timeInterval', function() {

    it('should convert boolean values to unicode checkmark or cross',
        inject(function(timeIntervalFilter) {
          expect(timeIntervalFilter(100000)).toBe('1min.');
          expect(timeIntervalFilter(1000000)).toBe('16min.');
          expect(timeIntervalFilter(10000000)).toBe('2h.');
          expect(timeIntervalFilter(100000000)).toBe('1d.');
          expect(timeIntervalFilter(1000000000)).toBe('11d.');
          expect(timeIntervalFilter(10000000000)).toBe('3mo.');
          expect(timeIntervalFilter(100000000000)).toBe('3yr.');
        }));
  });
});