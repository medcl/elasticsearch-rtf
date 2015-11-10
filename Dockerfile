FROM java:7-jre
ENV ES_HOME=/usr/share/elasticsearch-rtf
ENV PATH $ES_HOME/bin:$PATH

#  RUN git clone -b 1.7.1 git://github.com/medcl/elasticsearch-rtf.git $ES_HOME
COPY . $ES_HOME
COPY bin/docker-entrypoint.sh /

RUN $ES_HOME/bin/plugin -install mobz/elasticsearch-head

RUN $ES_HOME/bin/plugin -install river-csv -url https://github.com/AgileWorksOrg/elasticsearch-river-csv/releases/download/2.2.1/elasticsearch-river-csv-2.2.1.zip

# ES_MAX_MEM, ES_MIN_MEM or ES_HEAP_SIZE only (max = min)
# RUN git clone https://github.com/elastic/elasticsearch-servicewrapper /usr/share/elasticsearch-servicewrapper
# RUN cp -r /user/share/elasticsearch-servicewrapper/service $ES_HOME/bin/
# RUN /user/share/elasticsearch-servicewrapper/elasticsearch64 install
# RUN service elasticsearch start

RUN mkdir -p $ES_HOME/data
RUN mkdir -p $ES_HOME/data-csv

# VOLUME /usr/share/elasticsearch-rtf/data

VOLUME ["/usr/share/elasticsearch-rtf/data", "/usr/share/elasticsearch-rtf/data-csv"]


ENTRYPOINT ["/docker-entrypoint.sh"]

EXPOSE 9200 9300

CMD ["elasticsearch"]
