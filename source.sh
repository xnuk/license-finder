#!/bin/sh
# shellcheck shell=dash enable=all

arg="$1"
set -euf

payload_line=$(awk '/^## PAYLOAD ##/ { print NR + 1; exit 0 }' "$0")

payload=$(printf 'tail -n +%d %s' "${payload_line}" "$0")
list='tar -ztf -'
unpack='tar -zOxf -'

if [ -n "${arg}" ]; then
	${payload} | ${unpack} "${arg}"
	exit 0
fi

names=$(${payload} | ${list})
name=$(fzf --preview="${payload} | ${unpack}" <<EOF
${names}
EOF
)
${payload} | ${unpack} "${name}" > "LICENSE-${name}"
printf '[%s] Saved license text to %s.\n' "${name}" "LICENSE-${name}" > /dev/stderr

exit 0

## PAYLOAD ##
