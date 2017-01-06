**什么是Elasticsearch-RTF？**
RTF是Ready To Fly的缩写，在航模里面，表示无需自己组装零件即可直接上手即飞的航空模型，Elasticsearch-RTF是针对中文的一个发行版，即使用最新稳定的elasticsearch版本，并且帮你下载测试好对应的插件，如中文分词插件等，目的是让你可以下载下来就可以直接的使用（虽然es已经很简单了，但是很多新手还是需要去花时间去找配置，中间的过程其实很痛苦），当然等你对这些都熟悉了之后，你完全可以自己去diy了，跟linux的众多发行版是一个意思。


当前版本 Elasticsearch 5.1.1


**如何使用？**


1.运行环境

	a.JDK8+  
	b.系统可用内存>2G 


2.下载

<pre>git clone git://github.com/medcl/elasticsearch-rtf.git -b master --depth 1</pre>

百度网盘：https://pan.baidu.com/s/1pJNkrUV


3.运行

Mac/Linux:
<pre>cd elasticsearch/bin
./elasticsearch</pre>
<pre>
sudo -u ops ES_JAVA_OPTS="-Xms2024m -Xmx2024m"  ./bin/elasticsearch  -d
</pre>

Windows:
<pre>cd elasticsearch/bin
elasticsearch.bat</pre>

以下是安装的官方插件，个别插件需要配置才能使用，可根据需要删除 plugins 目录无关的插件，重启 elasticsearch 生效。

<pre>
bin/elasticsearch-plugin install discovery-multicast
bin/elasticsearch-plugin install analysis-icu
bin/elasticsearch-plugin install analysis-kuromoji
bin/elasticsearch-plugin install analysis-phonetic
bin/elasticsearch-plugin install analysis-smartcn
bin/elasticsearch-plugin install analysis-stempel
bin/elasticsearch-plugin install analysis-ukrainian
bin/elasticsearch-plugin install discovery-file
bin/elasticsearch-plugin install ingest-attachment
bin/elasticsearch-plugin install ingest-geoip
bin/elasticsearch-plugin install ingest-user-agent
bin/elasticsearch-plugin install mapper-attachments
bin/elasticsearch-plugin install mapper-size
bin/elasticsearch-plugin install mapper-murmur3
bin/elasticsearch-plugin install lang-javascript
bin/elasticsearch-plugin install lang-python
bin/elasticsearch-plugin install repository-hdfs
bin/elasticsearch-plugin install repository-s3
bin/elasticsearch-plugin install repository-azure
bin/elasticsearch-plugin install repository-gcs
bin/elasticsearch-plugin install store-smb
bin/elasticsearch-plugin install discovery-ec2
bin/elasticsearch-plugin install discovery-azure-classic
bin/elasticsearch-plugin install discovery-gce
</pre>

**安装 X-Pack**

1.注册免费的 license， https://register.elastic.co

2.运行安装命令
<pre> 
	bin/elasticsearch-plugin install x-pack 
</pre>

3.安装证书，参见：https://www.elastic.co/guide/en/x-pack/current/installing-license.html
<pre>
	curl -XPUT -u elastic 'http://<host>:<port>/_xpack/license' -d @license.json
</pre>

**数据迁移工具**

https://github.com/medcl/elasticsearch-migration


**通过模板设置全局默认分词器**

<pre>
curl -XDELETE http://localhost:9200/_template/rtf


curl -XPUT http://localhost:9200/ _template/rtf
-d'
{
  "template":   "*", 
  "settings": { "number_of_shards": 1 }, 
  "mappings": {
    "_default_": {
      "_all": { 
        "enabled": true
      },
      "dynamic_templates": [
        {
          "strings": { 
            "match_mapping_type": "string",
            "mapping": {
              "type": "text",
              "analyzer":"ik_max_word",
              "ignore_above": 256,
              "fields": {
                "keyword": {
                  "type":  "keyword"
                }
              }
            }
          }
        }
      ]
    }
  }
}
'
</pre>
