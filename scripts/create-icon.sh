#!/bin/bash

# Exit on error
set -e

# Create temporary directory for icon files
mkdir -p macos/icon.iconset

# Convert SVG to PNG in different sizes
for size in 16 32 64 128 256 512 1024; do
    # Normal resolution
    convert -background none -size ${size}x${size} macos/icon.svg macos/icon.iconset/icon_${size}x${size}.png
    # High resolution (2x)
    convert -background none -size $((size*2))x$((size*2)) macos/icon.svg macos/icon.iconset/icon_${size}x${size}@2x.png
done

# Create ICNS file
iconutil -c icns macos/icon.iconset -o macos/app.icns

# Clean up
rm -rf macos/icon.iconset

echo "Icon created at macos/app.icns" 