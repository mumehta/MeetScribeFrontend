#!/bin/bash

# Create fonts directory if it doesn't exist
mkdir -p src/assets/fonts/Inter

# Download Inter variable font
curl -L https://github.com/rsms/inter/releases/download/v4.0/Inter-VariableFont_slnt,wght.woff2 \
     -o src/assets/fonts/Inter/Inter-VariableFont_slnt,wght.woff2

echo "Font files downloaded successfully!"
