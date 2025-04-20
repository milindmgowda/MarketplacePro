#!/bin/bash

# Vercel Build Script for FormScript

echo "Starting Vercel build process..."

# Build the frontend
echo "Building frontend..."
npm run build

# Create necessary directories
mkdir -p api/shared
mkdir -p api/server

# Copy the necessary files for serverless function
echo "Preparing files for serverless function..."
cp -r dist/* api/
cp -r shared/* api/shared/
cp -r server/* api/server/

echo "Build completed successfully!"