#!/bin/sh
# Bounded cron invocation; external flock prevents overlapping cycles.
cd "$(dirname "$0")/../public" || exit 1
FINSTAKE_CONFIG="$(cd ../.. && pwd)/config.json"
export FINSTAKE_CONFIG
for attempt in 1 2 3 4 5 6; do
    php ../bin/poll.php
    if [ "$attempt" != 6 ]; then sleep 8; fi
done
