#!/usr/bin/env bash

# Credits to https://www.redhat.com/sysadmin/arguments-options-bash-scripts
help()
{
  # Display Help
  echo "Builds the application"
  echo
  echo "Syntax: ./build.sh [-h|-t <win|mac|linux>|-a <arm64|x64>|-z]"
  echo "options:"
  echo "  h   Print this help."
  echo "  t   Target platform. If not specified, all platforms will be built."
  echo "        To build for multiple platforms, use this option multiple times."
  echo "  a   Target architecture. If not specified, all architectures will be built."
  echo "  z   Compress (zip) the output."
}

NODE_VERSION="20.11.0"

TARGET_WIN=false
TARGET_MAC=false
TARGET_LINUX=false
ARCH_ARM64=false
ARCH_X64=false
COMPRESS_OUTPUT=false

while getopts ":hzt:a:" option; do
   case $option in
      h) # display Help
        help
        exit;;
      t) # Target platform
        case $OPTARG in
            win) TARGET_WIN=true;;
            mac) TARGET_MAC=true;;
            linux) TARGET_LINUX=true;;
            *) echo "Error: Invalid target platform"
              exit;;
        esac;;
      a) # Target architecture
        case $OPTARG in
            arm64) ARCH_ARM64=true;;
            x64) ARCH_X64=true;;
            *) echo "Error: Invalid target architecture"
              exit;;
        esac;;
      z) # Compress output
        COMPRESS_OUTPUT=true;;
      \?) # Invalid option
        echo "Error: Invalid option"
        exit;;
   esac
done

if [[ "$TARGET_LINUX" = false && "$TARGET_MAC" = false && "$TARGET_WIN" = false ]]; then
  TARGET_LINUX=true
  TARGET_MAC=true
  TARGET_WIN=true
fi

if [[ "$ARCH_ARM64" = false && "$ARCH_X64" = false ]]; then
  ARCH_ARM64=true
  ARCH_X64=true
fi

echo "Building with options:"
echo "- Target platform: win=$TARGET_WIN, mac=$TARGET_MAC, linux=$TARGET_LINUX"
echo "- Target architecture: arm64=$ARCH_ARM64, x64=$ARCH_X64"
echo "- Compress output: $COMPRESS_OUTPUT"
echo

# Download Node.js
mkdir -p build

echo "Downloading Node.js"
if [[ "$ARCH_ARM64" = true ]]; then
  if [[ ! -f "build/node-win-arm64.zip" && "$TARGET_WIN" = true ]]; then
    curl -L https://nodejs.org/dist/v$NODE_VERSION/node-v$NODE_VERSION-win-arm64.zip -o build/node-win-arm64.zip
  fi
  if [[ ! -f "build/node-mac-arm64.tar.gz" && "$TARGET_MAC" = true ]]; then
    curl -L https://nodejs.org/dist/v$NODE_VERSION/node-v$NODE_VERSION-darwin-arm64.tar.gz -o build/node-mac-arm64.tar.gz
  fi
  if [[ ! -f "build/node-linux-arm64.tar.xz" && "$TARGET_LINUX" = true ]]; then
    echo "Downloading Node.js for Linux arm64"
    curl -L https://nodejs.org/dist/v$NODE_VERSION/node-v$NODE_VERSION-linux-arm64.tar.xz -o build/node-linux-arm64.tar.xz
  fi
fi
if [[ "$ARCH_X64" = true ]]; then
  if [[ ! -f "build/node-win-x64.zip" && "$TARGET_WIN" = true ]]; then
    curl -L https://nodejs.org/dist/v$NODE_VERSION/node-v$NODE_VERSION-win-x64.zip -o build/node-win-x64.zip
  fi
  if [[ ! -f "build/node-mac-x64.tar.gz" && "$TARGET_MAC" = true ]]; then
    curl -L https://nodejs.org/dist/v$NODE_VERSION/node-v$NODE_VERSION-darwin-x64.tar.gz -o build/node-mac-x64.tar.gz
  fi
  if [[ ! -f "build/node-linux-x64.tar.xz" && "$TARGET_LINUX" = true ]]; then
    curl -L https://nodejs.org/dist/v$NODE_VERSION/node-v$NODE_VERSION-linux-x64.tar.xz -o build/node-linux-x64.tar.xz
  fi
fi

# unzip if needed
echo "Extracting Node.js"
if [[ "$ARCH_ARM64" = true ]]; then
  if [[ ! -d "build/node-win-arm64" && "$TARGET_WIN" = true ]]; then
    mkdir -p build/node-win-arm64
    unzip build/node-win-arm64.zip -d build/node-win-arm64
  fi
  if [[ ! -d "build/node-mac-arm64" && "$TARGET_MAC" = true ]]; then
    mkdir -p build/node-mac-arm64
    tar -xvzf build/node-mac-arm64.tar.gz -C build/node-mac-arm64
  fi
  if [[ ! -d "build/node-linux-arm64" && "$TARGET_LINUX" = true ]]; then
    mkdir -p build/node-linux-arm64
    tar -xvJf build/node-linux-arm64.tar.xz -C build/node-linux-arm64
  fi
fi
if [[ "$ARCH_X64" = true ]]; then
  if [[ ! -d "build/node-win-x64" && "$TARGET_WIN" = true ]]; then
    mkdir -p build/node-win-x64
    unzip build/node-win-x64.zip -d build/node-win-x64
  fi
  if [[ ! -d "build/node-mac-x64" && "$TARGET_MAC" = true ]]; then
    mkdir -p build/node-mac-x64
    tar -xvzf build/node-mac-x64.tar.gz -C build/node-mac-x64
  fi
  if [[ ! -d "build/node-linux-x64" && "$TARGET_LINUX" = true ]]; then
    mkdir -p build/node-linux-x64
    tar -xvJf build/node-linux-x64.tar.xz -C build/node-linux-x64
  fi
fi

# create tmp directory for source files
mkdir -p build/tmp

# copy source files
echo "Copying source files"
cp -r dist/ build/tmp/
cp build-backend/app.js build/tmp/
cp package.json build/tmp

# make output directories
echo "Recreating output directories"
if [ -d "build/arm64-win" ]; then
  rm -rf build/arm64-win
fi
if [ -d "build/arm64-mac" ]; then
  rm -rf build/arm64-mac
fi
if [ -d "build/arm64-linux" ]; then
  rm -rf build/arm64-linux
fi
if [ -d "build/x64-win" ]; then
  rm -rf build/x64-win
fi
if [ -d "build/x64-mac" ]; then
  rm -rf build/x64-mac
fi
if [ -d "build/x64-linux" ]; then
  rm -rf build/x64-linux
fi

if [[ "$ARCH_ARM64" = true ]]; then
  if [[ "$TARGET_WIN" = true ]]; then
    mkdir -p build/arm64-win/bin
  fi
  if [[ "$TARGET_MAC" = true ]]; then
    mkdir -p build/arm64-mac/bin
  fi
  if [[ "$TARGET_LINUX" = true ]]; then
    mkdir -p build/arm64-linux/bin
  fi
fi
if [[ "$ARCH_X64" = true ]]; then
  if [[ "$TARGET_WIN" = true ]]; then
    mkdir -p build/x64-win/bin
  fi
  if [[ "$TARGET_MAC" = true ]]; then
    mkdir -p build/x64-mac/bin
  fi
  if [[ "$TARGET_LINUX" = true ]]; then
    mkdir -p build/x64-linux/bin
  fi
fi

# copy tmp to output
echo "Copying source files to output directories"
if [[ "$ARCH_ARM64" = true ]]; then
  if [[ "$TARGET_WIN" = true ]]; then
    cp -r build/tmp/* build/arm64-win
  fi
  if [[ "$TARGET_MAC" = true ]]; then
    cp -r build/tmp/* build/arm64-mac
  fi
  if [[ "$TARGET_LINUX" = true ]]; then
    cp -r build/tmp/* build/arm64-linux
  fi
fi
if [[ "$ARCH_X64" = true ]]; then
  if [[ "$TARGET_WIN" = true ]]; then
    cp -r build/tmp/* build/x64-win
  fi
  if [[ "$TARGET_MAC" = true ]]; then
    cp -r build/tmp/* build/x64-mac
  fi
  if [[ "$TARGET_LINUX" = true ]]; then
    cp -r build/tmp/* build/x64-linux
  fi
fi

# copy node files
echo "Copying node files"
if [[ "$ARCH_ARM64" = true ]]; then
  if [[ "$TARGET_WIN" = true ]]; then
    mv build/node-win-arm64/*/* build/arm64-win/bin
    rm -rf build/node-win-arm64
  fi
  if [[ "$TARGET_MAC" = true ]]; then
    mv build/node-mac-arm64/*/* build/arm64-mac/bin
    rm -rf build/node-mac-arm64
  fi
  if [[ "$TARGET_LINUX" = true ]]; then
    mv build/node-linux-arm64/*/* build/arm64-linux/bin
    rm -rf build/node-linux-arm64
  fi
fi
if [[ "$ARCH_X64" = true ]]; then
  if [[ "$TARGET_WIN" = true ]]; then
    mv build/node-win-x64/*/* build/x64-win/bin
    rm -rf build/node-win-x64
  fi
  if [[ "$TARGET_MAC" = true ]]; then
    mv build/node-mac-x64/*/* build/x64-mac/bin
    rm -rf build/node-mac-x64
  fi
  if [[ "$TARGET_LINUX" = true ]]; then
    mv build/node-linux-x64/*/* build/x64-linux/bin
    rm -rf build/node-linux-x64
  fi
fi

# copy entrypoint
echo "Copying entrypoint"
if [[ "$ARCH_ARM64" = true ]]; then
  if [[ "$TARGET_WIN" = true ]]; then
    cp runner/entry.bat build/arm64-win
    cp runner/entry.ps1 build/arm64-win
  fi
  if [[ "$TARGET_MAC" = true ]]; then
    cp runner/entry.sh build/arm64-mac
  fi
  if [[ "$TARGET_LINUX" = true ]]; then
    cp runner/entry.sh build/arm64-linux
  fi
fi
if [[ "$ARCH_X64" = true ]]; then
  if [[ "$TARGET_WIN" = true ]]; then
    cp runner/entry.bat build/x64-win
    cp runner/entry.ps1 build/x64-win
  fi
  if [[ "$TARGET_MAC" = true ]]; then
    cp runner/entry.sh build/x64-mac
  fi
  if [[ "$TARGET_LINUX" = true ]]; then
    cp runner/entry.sh build/x64-linux
  fi
fi

# remove temporary folder
echo "Cleaning up temporary files"
rm -rf build/tmp

# zip
# help from https://askubuntu.com/questions/521011/zip-an-archive-without-including-parent-directory
if [[ "$COMPRESS_OUTPUT" = true ]]; then
  echo "Zipping"
  cd build
  if [[ "$ARCH_ARM64" = true ]]; then
    if [[ "$TARGET_WIN" = true ]]; then
      if [ -f "arm64-win.zip" ]; then
        rm arm64-win.zip
      fi
      (cd arm64-win && zip -r ../arm64-win.zip .)
    fi
    if [[ "$TARGET_MAC" = true ]]; then
      if [ -f "arm64-mac.zip" ]; then
        rm arm64-mac.zip
      fi
      (cd arm64-mac && zip -r ../arm64-mac.zip .)
    fi
    if [[ "$TARGET_LINUX" = true ]]; then
      if [ -f "arm64-linux.zip" ]; then
        rm arm64-linux.zip
      fi
      (cd arm64-linux && zip -r ../arm64-linux.zip .)
    fi
  fi
  if [[ "$ARCH_X64" = true ]]; then
    if [[ "$TARGET_WIN" = true ]]; then
      if [ -f "x64-win.zip" ]; then
        rm x64-win.zip
      fi
      (cd x64-win && zip -r ../x64-win.zip .)
    fi
    if [[ "$TARGET_MAC" = true ]]; then
      if [ -f "x64-mac.zip" ]; then
        rm x64-mac.zip
      fi
      (cd x64-mac && zip -r ../x64-mac.zip .)
    fi
    if [[ "$TARGET_LINUX" = true ]]; then
      if [ -f "x64-linux.zip" ]; then
        rm x64-linux.zip
      fi
      (cd x64-linux && zip -r ../x64-linux.zip .)
    fi
  fi
  cd ..
fi
