#!/usr/bin/env bash
# Exit on first error
set -e

# Download and unzip our vendor files
# TODO: Download these in parallel via `fork` and then use `wait`
# TODO: Find a system for downloading all feed data (prob via an API)
mkdir -p vendor
cd vendor
if ! test -f sfmta-60.zip; then
  wget http://transitfeeds.com/p/sfmta/60/latest/download --output-document sfmta-60.zip
  unzip sfmta-60.zip -d sfmta-60
  md5sum sfmta-60.zip > sfmta-60/MD5SUM
  date --utc > sfmta-60/TIMESTAMP
fi
cd -
