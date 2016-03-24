# Introduction

[![Join the chat at https://gitter.im/jettro/elasticsearch-gui](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/jettro/elasticsearch-gui?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
Welcome to the Gui plugin for elasticsearch. Using this plugin you can explore your elasticsearch index. This plugin gives you a few different ways to start exploring. There is a way to search the repository in a way you would do it on a web site. You can enter keywords, do advanced search, use facets. Another way to explore the index is focussed on learning the structure of the actual executed query. You can enter a number of items to include in the query. You can enter fields, facets, highlighting, limit the indexes, limit the types. Finally there is a way to show some of the data in a graph.

# Installation
## local installation
You can install the plugin in your own elasticsearch instance using the following command in the elasticsearch folder:
```
[~/elasticsearch] $ bin/plugin install jettro/elasticsearch-gui 
```
Next you can browse to you elasticsearch instance: http://localhost:9200/_plugin/gui/index.html
## use deployed installation
Since we use mainly JavaScript, it is possible to connect to a remote elasticsearch instance. To facilitate this, elasticsearch returns a specific html header.

That way you can use my installed version of the plugin to connect to your local elasticsearch instance. You can find it at the following url:
[Remote installed plugin @gridshore](http://www.gridshore.nl/esgui)

Starting from elasticsearch 1.4 there have been some security measures. One thing is that CORS is now by default disabled. This is smart from security perspective but prevents this plugin from running if you are not coming from the same host as the elasticsearch server. If you still want this to work add the following properties to elasticsearch.yml: 
```yml
http.cors.enabled: true
http.cors.allow-origin: "http://www.gridshore.nl"
```

# Older versions
Currently we develop agains elasticsearch v2.0. Due to some api changes you cannot use it with older elasticsearch installations. You can however use the older versions in branch v1.1.x and v0.90.8+. On my website you can also access the older version using the url:

[Remote installed plugin @gridshore (v1.2)](http://www.gridshore.nl/esgui_1_2)
[Remote installed plugin @gridshore (v1.1)](http://www.gridshore.nl/esgui_1_1)
[Remote installed plugin @gridshore (v0.90)](http://www.gridshore.nl/esgui_0_90)

# TODO's
- Replace all callbacks with promises.
- Use the resolve function of a routing instead of a initializer function.
- Check startup logic to do the configurations
- While starting, config object is not automaticalle started.

