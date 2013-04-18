# Elasticsearch date histogram facet grapher

This is a very simple graphing tool for date histogram facets.

## Screenshot

![Action Screenshot](https://github.com/spinscale/elasticsearch-facetgrapher/raw/master/facetgraph-screenshot.png)

## Installing the plugin 

```
bin/plugin -install spinscale/elasticsearch-facetgrapher
```

Then Open this URL in your browser

[http://localhost:9200/_plugin/facetgrapher/index.html](http://localhost:9200/_plugin/facetgrapher/index.html)

After opening the URL, an AJAX request to the cluster state API will be issued automatically.
The request will check for any fields which are of type "date" in your indices. These will be available in the dropdowns.
Whenever you select an index in your dropdown, you will only get listed those types which are available in this index. Same goes for the fields.

## Technologies used:

* Twitter Bootrap, available at http://twitter.github.com/bootstrap/
* Jquery, available at http://jquery.com/
* d3.js, available at http://d3js.org/
* nvd3.js, available at http://nvd3.com/
* moment.js, available at http://momentjs.com/

## TODO

* The current code base is just plain ugly, and does not do any good job in terms of application design or MVC. Rewrite the code in something cool like emberjs or backbone or batman or whatever. I really accept pull requests in this case. I havent yet really grasped stuff like emberjs. So I also accept hackathon requests :-)
* Furthermore, after making this more MVC like, I would like to be able to store all model data in the URL, which would allow persons to exchange links to predefined graphs.
* Also datetimepickers would be nice, could not find any for bootstrap.
* And labels dependant on the interval would also be useful.

## License

Respect the individual licenses of the other projects. All the code I wrote is licensed under do-what-you-want-with-it license.

