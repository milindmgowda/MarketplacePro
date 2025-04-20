#!/bin/bash

# Build the frontend
echo "Building frontend..."
npm run build

# Copy client dist to root level dist directory
echo "Copying client build files..."
mkdir -p dist/client
cp -r client/dist/* dist/client/

echo "Build complete for Vercel deployment!"