#!/usr/bin/env bash
set -euo pipefail
# Increase inotify watcher limits for large JS/TS monorepos.
# Usage: sudo ./scripts/increase-inotify.sh

NEW_WATCHES=${1:-524288}
NEW_INSTANCES=${2:-1024}
CONF_FILE=/etc/sysctl.d/60-inotify.conf

if [[ $EUID -ne 0 ]]; then
  echo "Please run with sudo: sudo $0 [watches] [instances]" >&2
  exit 1
fi

echo "fs.inotify.max_user_watches=${NEW_WATCHES}" > "$CONF_FILE"
echo "fs.inotify.max_user_instances=${NEW_INSTANCES}" >> "$CONF_FILE"

sysctl --system >/dev/null

echo "Applied limits:" >&2
sysctl fs.inotify.max_user_watches fs.inotify.max_user_instances
