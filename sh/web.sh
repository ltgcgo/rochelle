#!/bin/bash
cd build
#cd ..
case "$1" in
	"deno")
		LISTEN_PORT=8010 LISTEN_ADDR=127.0.0.1 GRACE_JAIL=1 grace
		;;
	*)
		python3 -m http.server 8010
		;;
esac
exit