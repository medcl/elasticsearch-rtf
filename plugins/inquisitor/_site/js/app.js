angular.module('inquisitor.service', [])
    .value('Data', {
        host: "http://localhost:9200",
        query:'{"query" : {"match_all": {}}}',
        highlight: '"highlight":{"order" : "score", "pre_tags" : ["<span class=\'highlight\'>"],"post_tags" : ["</span>"],"fields":{',
        elasticResponse: "",
        elasticError: [],
        currentIndex: "",
        currentType: "",
        mapping: {} ,
        tabs:['Queries', 'Analyzers', 'Tokenizers'],
        autodetectfield: false
    })
    .value('Analyzer', {
        query: 'the quick brown fox',
        analyzers: ['standard', 'simple', 'whitespace', 'stop', 'keyword', 'pattern', 'snowball'],
        customAnalyzers: {},
        fields: {},
        currentField: {},
        atext: {}
    })
    .value('Tokenizer', {
        query: 'the quick brown fox',
        tokenizers: ['standard', 'keyword', 'edgeNGram', 'nGram', 'letter', 'lowercase', 'whitespace', 'uax_url_email', 'path_hierarchy'],
        ttext: {}
    })
    .value('Filter', {
        query: 'the quick brown fox',
        filters: ['standard', 'asciifolding', 'length', 'lowercase', 'nGram', 'edgeNGram',
                    'porterStem', 'shingle', 'stop', 'word_delimiter', 'stemmer','keyword_marker',
                    'kstem', 'snowball', 'phonetic', 'synonym', 'dictionary_decompounder', 'hyphenation_decompounder',
                    'reverse', 'elision', 'truncate', 'unique', 'trim'],
        ftext: {}
    });


var app = angular.module('Inquisitor', ['inquisitor.service', 'ui.bootstrap', 'ui', 'ngSanitize']);
app.factory('pubsub', function(){
  var cache = {};
  return {
    publish: function(topic, args) { 
      cache[topic] && $.each(cache[topic], function() {
        this.call(null, args || []);
      });
    },
    
    subscribe: function(topic, callback) {
      if(!cache[topic]) {
        cache[topic] = [];
      }
      
      cache[topic].push(callback);
      return [topic, callback]; 
    },
    
    unsubscribe: function(handle) {
      var t = handle[0];
      cache[t] && d.each(cache[t], function(idx){
        if(this == handle[1]){
          cache[t].splice(idx, 1);
        }
      });
    }
  }
});

app.config(function ($routeProvider) {
    $routeProvider
        .when('/',
        {
            templateUrl: "views/queries.html"
        })
        .when('/queries',
        {
            templateUrl: "views/queries.html"
        })
        .when('/analyzers',
        {
            templateUrl: "views/analyzers.html"
        })
        .when('/tokenizers',
        {
            templateUrl: "views/tokenizers.html"
        });
});





