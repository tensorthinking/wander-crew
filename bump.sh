#!/bin/sh
# Stamp every local asset URL in index.html with a fresh version so phones never mix old and new files.
V=$(date -u +%Y%m%d%H%M%S)
sed -i -E "s#(href|src)=\"((styles\.css)|(js/[a-z]+\.js)|(data/[a-z]+\.js))(\?v=[0-9]+)?\"#\1=\"\2?v=$V\"#g" index.html
sed -i -E "s#window.WC_BUILD = \"[0-9]*\"#window.WC_BUILD = \"$V\"#" index.html
sed -i -E "s#const VERSION = \"[0-9]*\"#const VERSION = \"$V\"#" sw.js
echo "$V"
