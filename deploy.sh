#!/bin/bash

set -e

if [ -z "$1" ]; then
  echo "Usage: ./deploy.sh \"Your commit message\""
  exit 1
fi

COMMIT_MESSAGE="$1"

echo "Building..."
npm run build

echo "Uploading to server..."
scp -r dist/* root@204.168.209.150:/var/www/nithun-website/dist/

echo "Committing and pushing to GitHub..."
git add .
git commit -m "$COMMIT_MESSAGE"
git push

echo "Done."
