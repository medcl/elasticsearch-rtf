@echo off

SETLOCAL
TITLE Elasticsearch 1.4.0

CALL %~dp0elasticsearch.in.bat

"%JAVA_HOME%\bin\java" %JAVA_OPTS% %ES_JAVA_OPTS% %ES_PARAMS% %* -cp "%ES_CLASSPATH%" "org.elasticsearch.bootstrap.Elasticsearch"

ENDLOCAL