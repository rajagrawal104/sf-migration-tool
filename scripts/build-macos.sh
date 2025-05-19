#!/bin/bash

# Exit on error
set -e

# Clean previous builds
rm -rf dist
mkdir -p dist

# Create icon
./scripts/create-icon.sh

# Build client
cd client
npm install
npm run build
cd ..

# Build server
echo "Building server..."
npx pkg src/server/index.js --targets node16-macos-x64 --output dist/aura-lwc-converter

# Create macOS app bundle structure
mkdir -p dist/aura-lwc-converter.app/Contents/{MacOS,Resources}

# Copy executable
cp dist/aura-lwc-converter dist/aura-lwc-converter.app/Contents/MacOS/

# Copy Info.plist
cp macos/Info.plist dist/aura-lwc-converter.app/Contents/

# Copy icon
cp macos/app.icns dist/aura-lwc-converter.app/Contents/Resources/

# Copy assets
cp -r client/build/* dist/aura-lwc-converter.app/Contents/Resources/
cp -r src dist/aura-lwc-converter.app/Contents/Resources/

# Create DMG
create-dmg \
  --volname "Aura to LWC Converter" \
  --volicon "macos/app.icns" \
  --window-pos 200 120 \
  --window-size 800 400 \
  --icon-size 100 \
  --icon "aura-lwc-converter.app" 200 190 \
  --hide-extension "aura-lwc-converter.app" \
  --app-drop-link 600 185 \
  "dist/AuraToLWCConverter.dmg" \
  "dist/aura-lwc-converter.app"

echo "DMG created at dist/AuraToLWCConverter.dmg" 