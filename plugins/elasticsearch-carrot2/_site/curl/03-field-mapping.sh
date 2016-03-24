#!/bin/bash

#
# Issue a search-and-cluster request with a more complex field mapping.
#
# Note the search_request part is a regular search request; it contains
# highlighter directives; the number of fragments and fields to be highlighted
# are configurable.
#
# In order to make sense for clustering, it must (should) 
# fetch at least 100 documents.
#
# The "query_hint" part provides query-like terms that the clustering algorithm
# takes into account to avoid creating trivial clusters.
#
# The "field_mapping" section maps logical "document" fields (title, content) to
# the indexed document's title field and a highlighted (typically shorter content)
# fragment of "content" field.
#

curl -XPOST 'http://localhost:9200/test/test/_search_with_clusters?pretty=true' -d '
{
    "search_request": {
        "fields" : [
          "url", 
          "title", 
          "content"
        ],
        "highlight" : {
            "pre_tags" :  ["", ""],
            "post_tags" : ["", ""],
            "fields" : {
                "content" : { "fragment_size" : 150, "number_of_fragments" : 3 },
                "title"   : { "fragment_size" : 150, "number_of_fragments" : 3 }
            }
        },
        "query" : {
            "match" : {
              "_all" : "data mining" 
            }
        },
        "size": 100
    },

    "query_hint": "data mining",
    "field_mapping": {
        "title"  : ["fields.title"],
        "content": ["highlight.content"]
    }
}'
