#!/bin/bash

echo "Preparing for local testing..."

# Remove fsevents from package-lock.json
if [ -f package-lock.json ]; then
  echo "Removing fsevents from package-lock.json..."
  
  # Use jq to properly handle the structure, removing fsevents dependencies
  jq 'del(.packages."node_modules/fsevents")' package-lock.json > temp-package-lock.json
  mv temp-package-lock.json package-lock.json
  
  # Run another pass to remove references to fsevents in dependencies
  jq 'walk(if type == "object" and .dependencies? != null then .dependencies |= (del(.fsevents) // .) else . end)' package-lock.json > temp-package-lock.json
  mv temp-package-lock.json package-lock.json
  
  # Verify removal
  if grep -q '"node_modules/fsevents"' package-lock.json; then
    echo "Warning: fsevents references still present in package-lock.json."
  else
    echo "fsevents references removed from package-lock.json."
  fi
fi

# Check if frontend directory exists and do the same there
if [ -d "frontend" ] && [ -f "frontend/package-lock.json" ]; then
  echo "Removing fsevents from frontend/package-lock.json..."
  
  # Use jq to properly handle the structure, removing fsevents dependencies
  jq 'del(.packages."node_modules/fsevents")' frontend/package-lock.json > frontend/temp-package-lock.json
  mv frontend/temp-package-lock.json frontend/package-lock.json
  
  # Run another pass to remove references to fsevents in dependencies
  jq 'walk(if type == "object" and .dependencies? != null then .dependencies |= (del(.fsevents) // .) else . end)' frontend/package-lock.json > frontend/temp-package-lock.json
  mv frontend/temp-package-lock.json frontend/package-lock.json
  
  # Verify removal
  if grep -q '"node_modules/fsevents"' frontend/package-lock.json; then
    echo "Warning: fsevents references still present in frontend/package-lock.json."
  else
    echo "fsevents references removed from frontend/package-lock.json."
  fi
fi

echo "Creating local .npmrc file to prevent fsevents..."
cat > .npmrc << EOF
omit=optional
platform=linux
optional=false
loglevel=error
EOF

if [ -d "frontend" ]; then
  cp .npmrc frontend/.npmrc
  echo ".npmrc file copied to frontend directory."
fi

echo "Preparation complete. You can now run 'act -j test --container-architecture linux/amd64'" 