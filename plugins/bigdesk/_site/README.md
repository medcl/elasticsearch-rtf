# Bigdesk

Live charts and statistics for Elasticsearch cluster.

## Contents

- [Support Matrix](#support-matrix)
- [Release Notes](#release-notes)
- [Installation Instructions](#installation-instructions)
- [How to use Bigdesk](#how-to-use-bigdesk)
- [Screenshots](#screenshots)
- [Supported Web Browsers](#supported-web-browsers)
- [Credits](#credits)

## Support Matrix

<table>
  <tr>
    <th>Bigdesk</th>
    <th>Elasticsearch</th>
  </tr>
  <tr>
    <td>2.5.0</td>
    <td>1.3.0 ... 1.3.x</td>
  </tr>
  <tr>
    <td>2.4.1 (2.4.0)</td>
    <td>1.0.0.RC1 ... 1.2.x</td>
  </tr>
  <tr>
    <td>n/a</td>
    <td>1.0.0.Beta1 ... 1.0.0.Beta2</td>
  </tr>
  <tr>
    <td>2.2.3</td>
    <td>0.90.10 ... 0.90.x</td>
  </tr>
  <tr>
    <td>2.2.2 (2.2.1)</td>
    <td>0.90.0 ... 0.90.9</td>
  </tr>
  <tr>
    <td>2.1.0</td>
    <td>0.20.0 ... 0.20.x</td>
  </tr>
  <tr>
    <td>2.0.0</td>
    <td>0.19.0 ... 0.20.x</td>
  </tr>
  <tr>
    <td>1.0.0</td>
    <td>0.17.0 ... 0.18.x</td>
  </tr>
</table>

## Release Notes

#### 2.5.0 (09-08-2014)

- Support for Elasticsearch `1.3.x` and later by switching from JSONP to XHR (thanks to [@hmarcelino](https://github.com/hmarcelino)).

#### 2.4.1 (09-08-2014)

- Improvements to charting: namely added tick format to `y-axis` (thanks to [@slingler](https://github.com/slingler))
  and increased size of the cluster diagram (thanks to [@tylerlong](https://github.com/tylerlong)).

#### 2.4.0 (21-02-2014)

- Support for Elasticsearch `1.0.0.RC1` and later.
- Added ID cache series into Indices Cache Size chart.
- Fixed display of hostname.
- There is no Bigdesk release with support for Elasticsearch `1.0.0.Beta1` and `1.0.0.Beta2` for now.
  We can add support later if there is urgent need. This is the reason why release number 2.3.0 is skipped.

#### 2.2.3 (14-02-2014)

- Support for Elasticsearch `0.90.10` and above in `0.90.x`. (Main changes introduced in [#4661](https://github.com/elasticsearch/elasticsearch/issues/4661))
- JVM GC (Garbage Collection) Chart shows separated series for Young and Old generations.
- Fixed node get stats retrieval.

#### 2.2.2 (14-10-2013)

Reducing the amount of data pulled over HTTP and kept in the memory.

- Show Elasticsearch version as part of node information [#38](https://github.com/lukas-vlcek/bigdesk/issues/38)
- Reduce the amount of the data pulled via HTTP/REST [#41](https://github.com/lukas-vlcek/bigdesk/issues/41)
- Further reduce the amount of the data kept in web browser memory [#42](https://github.com/lukas-vlcek/bigdesk/issues/42)

#### 2.2.1 (02-07-2013)

- This release is a recommended upgrade from 2.2.0
- Fix bug: Update filter cache stats for latest stats API [#35](https://github.com/lukas-vlcek/bigdesk/issues/35) (kudos to [@cbcase](https://github.com/cbcase))
- Improvement: Tolerate ES version 1.0.x [#32](https://github.com/lukas-vlcek/bigdesk/issues/32) (kudos to [@hmalphettes](https://github.com/hmalphettes))

#### 2.2.0 (24-04-2013)

- Upgrade to Elasticsearch `0.90.0` and later (kudos to [@mrflip](https://github.com/mrflip) and [@hustonhoburg](https://github.com/hustonhoburg))

#### 2.1.0

- Added threadpool row to the metrics for Elasticsearch `0.20.0` and higher (kudos to [@jgagnon1](https://github.com/jgagnon1))

#### 2.0.0

- Complete reimplementation (based on backbone and underscore)
- Switched to D3.js (mainly due to friendly License)

#### 1.0.0

- Initial version (jQuery and Highcharts)

## Installation Instructions

There are couple of options how to get and install Bigdesk. Which one to use can depend on your use case.

#### 1) Use it as an Elasticsearch plugin

Install Elasticsearch then navigate to `<ES_HOME>` and execute the following command on command line:

    $ ./bin/plugin -install lukas-vlcek/bigdesk/<bigdesk_version>

where `<bigdesk_version>` specify particular Bigdesk version. For instance to install version 2.4.0 run:

    $ ./bin/plugin -install lukas-vlcek/bigdesk/2.4.0

Elasticsearch plugin manager then downloads and install Bigdesk sources:

	-> Installing lukas-vlcek/bigdesk/2.4.0...
	Trying http://download.elasticsearch.org/lukas-vlcek/bigdesk/bigdesk-2.4.0.zip...
	Trying http://search.maven.org/remotecontent?filepath=lukas-vlcek/bigdesk/2.4.0/bigdesk-2.4.0.zip...
	Trying https://oss.sonatype.org/service/local/repositories/releases/content/lukas-vlcek/bigdesk/2.4.0/bigdesk-2.4.0.zip...
	Trying https://github.com/lukas-vlcek/bigdesk/archive/v2.4.0.zip...
	Downloading ............................................................DONE
	Installed lukas-vlcek/bigdesk/2.4.0 into /Users/lukas/projects/elasticsearch-1.0.0/plugins/bigdesk
	Identified as a _site plugin, moving to _site structure ...

Then you can open web browser and navigate to `http://localhost:9200/_plugin/bigdesk/` it will open installed Bigdesk
and automatically auto-connect to local node.

#### 2) Clone Bigdesk repo into local filesystem and checkout specific tag

Clone Bigdesk repo (the master branch) and checkout specific release tag.

	$ git clone https://github.com/lukas-vlcek/bigdesk.git
	Cloning into 'bigdesk'...
	remote: Counting objects: 4947, done.
	remote: Compressing objects: 100% (2726/2726), done.
	remote: Total 4947 (delta 1831), reused 4883 (delta 1792)
	Receiving objects: 100% (4947/4947), 17.78 MiB | 1.08 MiB/s, done.
	Resolving deltas: 100% (1831/1831), done.

	$ cd bigdesk/
	$ git tag
	[... some tags left out for brevity ....]
	v2.2.2
	v2.2.3
	v2.4.0

	$ git checkout v2.4.0
	Note: checking out 'v2.4.0'.
	[... optional git messages ...]
	HEAD is now at 4a23042... Release v2.4.0 - Extract the cluster status CSS and make it more readable

Now you should be able to open index.html in web browser and point it to the Elasticsearch node.

#### 3) You can download archives from GitHub

See <http://bigdesk.org/#download_locally>

BTW these archives are provided by GitHub and are based on above discussed git tags.

#### 4) You can use Bigdesk online

See <http://bigdesk.org/v/>

## How to use Bigdesk

Once you open Bigdesk in your web browser, you need to **point it to the Elasticsearch node REST endpoint**.
For example if you run Elasticsearch locally the REST endpoint would be `http://localhost:9200/` by default.
You simply specify any endpoint URL in the text field on top of the Bigdesk screen (or via URL parameter, see below).

If you are using Bigdesk **1.0.0** (ie. you want to connect Bigdesk to elasticsearch 0.17.x - 0.18.x) then you need
to fill into two different text fields. First you specify **hostname** of the Elasticsearch node into the first
text field and its **port** number into the second text field (but in some situations this can be limiting,
for example if you run Elasticsearch behind firewall).

Then you hit **Connect** button (it is called **GO!** button in Bigdesk 1.0.0) and that's it.

Now you should see cluster name and list of its nodes. You can switch between nodes in the cluster, new nodes are added
and old nodes are removed automatically on the fly.

You can change the Bigdesk **refresh interval** and **amount of data** that is displayed by charts.

### URL parameters

If you are using **Bigdesk 1.0.0** you can immediately connect to a particular host, add the
`host`, `port`, and `go` parameters to the query string:

	index.html?host=search.example.com&port=9200&go

If you are using **Bigdesk 2.x** you can use any of the following URL parameters to immediately connect to
a particular host or set history or refresh interval:

- `endpoint` = URL of ES node REST endpoint (you might want to use URL encoded value). Defaults to `http://localhost:9200`.
- `refresh` = refresh interval in milliseconds. Defaults to `2000` (2 sec).
- `history` = number of milliseconds to keep in history. Defaults to `300000` (5 min).
- `connect` = if set to `true` Bigdesk will try to connect immediately to the endpoint. Defaults to `false`.

Example connecting to `http://127.0.0.1:9201` with 3 sec refresh interval:

	index.html?endpoint=http%3A%2F%2F127.0.0.1%3A9201&refresh=3000&connect=true

## Screenshots

### Bigdesk 1.0.0

![Bigdesk 1.0.0](https://github.com/lukas-vlcek/bigdesk/raw/master/bigdesk-1.0.0.jpg)

### Bigdesk 2.x

![Bigdesk 2.x](https://github.com/lukas-vlcek/bigdesk/raw/master/bigdesk-2.0.0-SNAPSHOT.jpg)

## Supported Web Browsers

Bigdesk should work in all modern web browsers as long as they support SVG. It has been tested in Safari, Firefox and Chrome.

## Credits

Lukas Vlcek and [contributors](https://github.com/lukas-vlcek/bigdesk/contributors).
