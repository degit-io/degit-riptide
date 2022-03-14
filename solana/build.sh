#!/bin/bash

DIR=""
while getopts "d:" opt; do
  case $opt in
  d)
    DIR=$OPTARG
    ;;
  \?)
    echo "Invalid option: -$OPTARG" >&2
    ;;
  esac
done

if [ -z "$DIR" ]; then
  echo "No directory specified"
  exit 1
elif [ ! -d "$DIR" ]; then
  echo "Directory does not exist"
  exit 1
fi

cd "$DIR" || exit 1
cargo \
  build-bpf \
  --manifest-path=Cargo.toml \
  --bpf-out-dir=dist/program
