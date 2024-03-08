#!/bin/bash
lightningcss --bundle ${2:--m --sourcemap} $3 "css/${1}/index.css" -o "dist/${1}.css"
exit