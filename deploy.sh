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
scp -r dist/* deploy@204.168.209.150:/var/www/nithun-website/dist/

echo "Updating Nginx config..."
scp nginx/nithun-website deploy@204.168.209.150:/tmp/nithun-website
ssh deploy@204.168.209.150 "sudo cp /tmp/nithun-website /etc/nginx/sites-available/nithun-website && sudo nginx -t && sudo nginx -s reload"

echo "Committing and pushing to GitHub..."
git add .
git commit -m "$COMMIT_MESSAGE"
git push

echo "Done."
