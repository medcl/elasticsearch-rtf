#!/bin/bash

#
# Issue a search-and-cluster request.
#
# Note the search_request part is a regular search request.
#
# In order to make sense for clustering, it must (should) 
# fetch at least 100 documents.
#
# The "query_hint" part provides query-like terms that the clustering algorithm
# takes into account to avoid creating trivial clusters.
#
# The "field_mapping" section maps logical "document" fields (title, content) to
# the indexed document's fields. We can map to highlighted fields and regular (stored or fetched)
# fields. In this example only fetched fields are used.
#

curl -XPOST 'http://localhost:9200/test/test/_search_with_clusters?pretty=true' -d '
{
    "search_request": {
        "fields" : [
          "url", 
          "title", 
          "content"
        ],
        "query" : {
            "match" : {
              "_all" : "data mining" 
            }
        },
        "size": 100
    },

    "query_hint": "data mining",
    "field_mapping": {
        "title"  : ["fields.title", "fields.content"]
    }
}'
