#!/bin/bash
echo "Building..."
shx build
echo "Publishing to JSR..."
deno publish --config ./deno.json
exit