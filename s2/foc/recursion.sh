#!/bin/bash

factorial() {
  local n="$1"
  if [ "$n" -eq 0 ]; then
    echo 1
  else
    local prev=$((n - 1))
    local result=$(factorial "$prev")
    echo $((n * result))
  fi
}

read num
result=$(factorial "$num")
echo "$result"
