describe('filter', function() {

  beforeEach(module('kopf'));

  describe('startsWithFilter', function() {

    it('should convert boolean values to unicode checkmark or cross',
        inject(function(startsWith) {
          expect(startsWith(['abc', 'acd', 'abd'], 'a')).toBe(['fabc', 'acd',
            'abd']);
        }));
  });
});