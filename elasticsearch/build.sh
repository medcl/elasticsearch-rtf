rm -rif release
mkdir release
cp -R bin release/bin
cp -R config release/config
cp -R lib release/lib
cp -R plugins release/plugins
mkdir release/logs
tar cfz  release.tar.gz release
rm -rif release
