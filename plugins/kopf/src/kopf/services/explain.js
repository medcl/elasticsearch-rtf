kopf.factory('ExplainService', ['$TreeDnDConvert',
  function($TreeDnDConvert) {
    function containsString(value, searched) {
      return value.indexOf(searched) >= 0;
    }
    this.isExplainPath = function(path) {
      return path &&
           (containsString(path, '_explain') ||
            containsString(path, '?explain') ||
            containsString(path, 'explain=true'));
    };
    /**
     * Normalize Get document by id and Document search responses.
     * Build explanation tree for TreeDnd directive.
     */
    this.normalizeExplainResponse = function(response) {
      var lHits;
      if (response.hits) {
        // Explain query
        lHits = response.hits.hits;
        // Remove hits from main response
        delete response.hits.hits;
      } else {
        // Explain document
        lHits = [response];
      }
      lHits.forEach(function(lHit) {
        // Sometimes ._explanation, .sometimes explanation, let's normalize it
        if (lHit.explanation) {
          var lExplanation = lHit.explanation;
          delete response.explanation;
          response._explanation = lExplanation;
        }
        lHit.documentId = lHit._index + '/' + lHit._type + '/' + lHit._id;
        if (lHit._explanation) {
          if (!lHit._score) {
            lHit._score = lHit._explanation.value;
          }
          lHit.explanationTreeData =
            $TreeDnDConvert.tree2tree([lHit._explanation], 'details');
        }
      });
      return lHits;
    };

    return this;
  }]);
