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
        analyzers: ['standard', 'simple', 'whitespace', 'stop', 'keyword', 'pattern', 'snowball'
        ,'lowercase_keyword','lowercase_keyword_ngram_min_size1','lowercase_keyword_ngram_min_size2','lowercase_keyword_ngram_min_size3','lowercase_keyword_ngram','lowercase_keyword_without_standard','lowercase_whitespace','smartcn','ik','ik_max_word','ik_smart','mmseg','mmseg_maxword','mmseg_complex','mmseg_simple','index_ansj','query_ansj'
        ,'comma_spliter','pct_spliter','custom_snowball_analyzer','simple_english_analyzer','edge_ngram','pinyin_ngram_analyzer','pinyin_first_letter_analyzer','pinyin_first_letter_keyword_analyzer','stconvert','s2t_convert','t2s_convert','s2t_keep_both_convert','t2s_keep_both_convert','string2int','custom_string2int','path_analyzer'],
        customAnalyzers: {},
        fields: {},
        currentField: {},
        atext: {}
    })
    .value('Tokenizer', {
        query: 'the quick brown fox',
        tokenizers: ['standard', 'keyword', 'edgeNGram', 'nGram', 'letter', 'lowercase', 'whitespace', 'uax_url_email', 'path_hierarchy'
        ,'my_pinyin','pinyin_first_letter','pinyin','mmseg_maxword','mmseg_complex'
        ,'mmseg_simple','semicolon_spliter','pct_spliter','s2t_convert','t2s_convert'
        ,'s2t_keep_both_convert','t2s_keep_both_convert','ngram_1_to_2','ngram_1_to_3'
        ,'smartcn_sentence','ik','mmseg'],
        ttext: {}
    })
    .value('Filter', {
        query: 'the quick brown fox',
        filters: ['standard', 'asciifolding', 'length', 'lowercase', 'nGram', 'edgeNGram',
                    'porterStem', 'shingle', 'stop', 'word_delimiter', 'stemmer','keyword_marker',
                    'kstem', 'snowball', 'phonetic', 'synonym', 'dictionary_decompounder', 'hyphenation_decompounder',
                    'reverse', 'elision', 'truncate', 'unique', 'trim','smartcn_word'
                    ,'ngram_min_3','ngram_min_2','ngram_min_1','min2_length','min3_length','s2t_convert','t2s_convert','s2t_keep_both_convert','t2s_keep_both_convert','my_string2int','pinyin_first_letter'],
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






