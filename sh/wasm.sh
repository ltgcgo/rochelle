#!/bin/bash
if [ "$1" == "" ]; then
	echo "The following modules are available."
	ls -1 src | while IFS= read -r module; do
		if [ -f "./src/${module}/index.wat" ]; then
			echo "- ${module}"
		fi
	done
	exit
fi
if [ -f "./src/${1}/index.wat" ]; then
	printf "Building WASM module \"${1}\"..."
	wat2wasm "./src/${1}/index.wat" -o "./dist/${1}.wasm" && echo " done."
else
	echo "Module \"${1}\" doesn't exist."
fi
exit