elasticsearch-logstash-faceter
==============================

A log analyzing plugin using elasticsearch facets API for logstash schema. The idea comes from <https://github.com/spinscale/elasticsearch-facetgrapher>. But it cannot draw multi-graphs, so I change to use amcharts.

Technologies Used
=================

* Twitter Bootrap, available at <http://twitter.github.com/bootstrap/>
* Jquery, available at <http://jquery.com/>
* amCharts, available at <http://www.amcharts.com/>

Logstash Introduce
==================

logstash is a tool for managing events and logs. You can use it to collect logs, parse them, and store them for later use (like, for searching). Speaking of searching, the most popular search engine in logstash community is ElasticSearch. And community already has [Kibana](https://github.com/rashidkpc/Kibana) as a recommended web interface.

Then, why I start this repo?

`Kibana` is a common tools. It only show you a chart or table about counts. And you need to write `LUCENE` like QueryDSL by your hands. How you can teach all your users those DSL before they leave or sleep?

So, my es-logstash-faceter is custom made for some log which have `dateOptionalTime`, `string` and `number` fields then we can directly have the charts and table to show the string fields' count tendency, number fields' statistics and so on.

TODO LIST
=========

* Maybe use jQuery.autocomplete for form-search input;
* Maybe use jQuery.tablesorter to sort local tbody;
* Be able to add/delete new form-div to compare datas of different indexs or types.

