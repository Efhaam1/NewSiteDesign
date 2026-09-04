#!/bin/sh
# usage: sh .audit5/snap.sh take|diff|revert
S=.audit5/snap
case "$1" in
take)
  rm -rf "$S"; mkdir -p "$S"
  cp -r app/css app/js app/data app/teach app/index.html "$S"/
  cp tools/gate.cjs "$S"/gate.cjs
  echo "snapshot taken"
  ;;
diff)
  diff -ru "$S"/css app/css
  diff -ru "$S"/js app/js
  diff -ru "$S"/data app/data
  diff -ru "$S"/teach app/teach
  diff -u "$S"/index.html app/index.html
  diff -u "$S"/gate.cjs tools/gate.cjs
  ;;
revert)
  rm -rf app/css app/js app/data app/teach
  cp -r "$S"/css "$S"/js "$S"/data "$S"/teach app/
  cp "$S"/index.html app/index.html
  cp "$S"/gate.cjs tools/gate.cjs
  echo "reverted to snapshot"
  ;;
esac
