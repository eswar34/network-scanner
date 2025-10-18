#!/bin/bash

# Network Scanner Script
# This script pings a target and performs nmap scan if target is reachable

read -p "Enter the target IP or hostname: " target

if [ -z "$target" ]; then
    echo "Error: No target specified"
    exit 1
fi

echo "Scanning target: $target"
echo "Pinging target..."

if ping -c 10 -W 500 "$target" > /dev/null 2>&1; then
    echo "Target is reachable! Fetching detailed information..."
    echo "Running nmap scan..."
    nmap -sV -sC "$target"
else
    echo "Target is unreachable or dead"
    exit 1
fi
