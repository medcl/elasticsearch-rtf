ElasticSearch Paramedic
=======================

Paramedic is a simple yet sexy tool to monitor and inspect [ElasticSearch](http://elasticsearch.org) clusters.

It displays real-time statistics and information about your nodes and indices,
as well as shard allocation within the cluster.

The application is written in JavaScript, using the [Ember.js](http://emberjs.com/) framework for sanity
and the [Cubism.js](http://square.github.com/cubism/) library for visuals. While the project is
_useful_, the codebase, with most logic in controllers, lacking proper component separation and test suite,
can't be considered mature enough, yet.

For basic overview, see a screenshot below.

![ElasticSearch Paramedic Screenshot](/elasticsearch-paramedic-screenshot.png)


Installation
------------

The easiest way to check out the application is to open it in a modern browser:
**<http://karmi.github.com/elasticsearch-paramedic>**.

If you have ElasticSearch running on `http://localhost:9200`, you should see the stats for your cluster.

You can also download or clone this repository and open the `index.html` file in your browser:

    git clone git://github.com/karmi/elasticsearch-paramedic.git && cd elasticsearch-paramedic
    open index.html

The easiest way to use Paramedic in production is to install it as an ElasticSearch plugin:

    plugin -install karmi/elasticsearch-paramedic

If your cluster is publicly accessible (authenticated with firewall rules or HTTP Authentication via proxy),
open it in your browser:

    open http://localhost:9200/_plugin/paramedic/index.html


Overview
--------

The application displays basic information about your cluster: cluster name, health, number of nodes and shards,
etc., using the [Cluster Health](http://www.elasticsearch.org/guide/reference/api/admin-cluster-health.html) API.

The “Stats” chart displays key metrics from the
[Nodes Stats](http://www.elasticsearch.org/guide/reference/api/admin-cluster-nodes-stats.html) API,
updated every second.

The “Nodes” part displays the most important information about the cluster nodes (used disk space and memory,
number of nodes, machine load and ElasticSearch CPU consumption, etc.), using the
[Nodes Info](http://www.elasticsearch.org/guide/reference/api/admin-cluster-nodes-info.html) and
[Nodes Stats](http://www.elasticsearch.org/guide/reference/api/admin-cluster-nodes-stats.html) APIs.

The “Indices” part displays basic information about the indices: number of primary shards, number of replicas,
basic index statistics, using the
[Cluster State](http://www.elasticsearch.org/guide/reference/api/admin-cluster-state.html),
[Indices Status](http://www.elasticsearch.org/guide/reference/api/admin-indices-status.html) and
[Indices Stats](http://www.elasticsearch.org/guide/reference/api/admin-indices-stats.html) APIs.
Primary shards are displayed in _blue_, allocated replicas in _green_, unassigned replicas in _yellow_,
and unassigned (missing) primary shards in _red_.

To display shard allocation across the nodes, use the “Show Details” button. All information is updated periodically,
which allows you to see node and index statistics, shard initialization or relocation, etc. in real time.

Note, that a considerable number of Ajax calls is being performed, and launching the application
for large clusters, with large number of nodes and indices/shards, may leave your
browser unresponsive, or crash your machine. Try increasing the polling interval and hiding the charts
if you experience performance problems.

The application performance has been successfuly tested for clusters with around five nodes and sixty shards.


Similar Applications
--------------------

You are encouraged to try similar existing tools for ElasticSearch:

* [BigDesk](http://github.com/lukas-vlcek/bigdesk)
* [elasticsearch-head](http://github.com/mobz/elasticsearch-head)
* [Sematext SPM](http://sematext.com/spm)
* [Munin Plugins](https://gist.github.com/2159398)

-----

[Karel Minarik](http://karmi.cz)
