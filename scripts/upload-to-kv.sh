#!/bin/bash
set -e

echo "📦 Uploading static files to KV..."

KV_NAMESPACE_ID="$1"

if [ -z "$KV_NAMESPACE_ID" ]; then
  echo "Error: KV_NAMESPACE_ID not provided"
  exit 1
fi

# Upload each static file to KV
for file in public/*; do
  if [ ! -f "$file" ]; then
    continue
  fi
  
  filename=$(basename "$file")
  
  # Determine content type
  case "$filename" in
    *.html) content_type="text/html; charset=utf-8" ;;
    *.css) content_type="text/css; charset=utf-8" ;;
    *.js) content_type="application/javascript; charset=utf-8" ;;
    *.json) content_type="application/json" ;;
    *.png) content_type="image/png" ;;
    *.jpg|*.jpeg) content_type="image/jpeg" ;;
    *.svg) content_type="image/svg+xml" ;;
    *.ico) content_type="image/x-icon" ;;
    *) content_type="application/octet-stream" ;;
  esac
  
  echo "Uploading $filename ($content_type)..."
  wrangler kv:key put \
    --namespace-id="$KV_NAMESPACE_ID" \
    "static:$filename" \
    --path="$file" \
    --metadata="{\"contentType\":\"$content_type\"}"
done

echo "✅ Static files uploaded successfully!"
