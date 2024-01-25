#!/usr/bin/env bash

# set workdir relative to the script
cd "$(dirname "$0")"

service_paths=$(echo services/*)
for service_path in ${service_paths[@]}; do
    service_name="$(basename "$service_path")"
    service_version="$(jq -r '.version' "$service_path/package.json")"
    docker build . --target "$service_name" --tag "vsb-eink/$service_name:$service_version" --tag "vsb-eink/$service_name:latest"
done
