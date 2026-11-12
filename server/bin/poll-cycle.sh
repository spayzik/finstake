#!/bin/sh
# One bounded cron invocation; external flock prevents overlap.
cd "$(dirname "$0")/../public" || exit 1
FINSTAKE_CONFIG="$(cd ../.. && pwd)/config.json"
export FINSTAKE_CONFIG
finish=$(($(date +%s) + 50))
while [ "$(date +%s)" -lt "$finish" ]; do
    php ../bin/poll.php
    sleep 1
done
