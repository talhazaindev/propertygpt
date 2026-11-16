#!/usr/bin/env bash
# Forward emulator localhost -> host Next.js API (and Metro).
# Run whenever the emulator is cold-booted.
set -euo pipefail
ADB="${ANDROID_HOME:-$HOME/Library/Android/sdk}/platform-tools/adb"
DEVICE="${1:-emulator-5554}"
"$ADB" -s "$DEVICE" reverse tcp:3000 tcp:3000
"$ADB" -s "$DEVICE" reverse tcp:8081 tcp:8081
"$ADB" -s "$DEVICE" reverse --list
