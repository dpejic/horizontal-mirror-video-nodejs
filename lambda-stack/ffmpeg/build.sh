#!/bin/sh

# Download ffmpeg
mkdir -p ./ffmpeg-dist
curl -L https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-arm64-static.tar.xz | tar xJ -C ./ffmpeg-dist --strip-components=1