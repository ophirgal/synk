#!/bin/bash

# Default to "dev" if no argument is provided
ENV=${1:-dev}

# Determine source file based on argument
if [[ "$ENV" == "dev" ]]; then
    DOTENV_FILE=".env.local.dev"
elif [[ "$ENV" == "prod" ]]; then
    DOTENV_FILE=".env.local.prod"
else
    echo "Invalid argument: $ENV. Use 'dev' or 'prod'."
    exit 1
fi

# Copy and then delete the source file
echo "Deploying [synk] to '$ENV' environment." && \
cp "$DOTENV_FILE" .env.local && \
npm run build && \
firebase use "$ENV" && \
firebase deploy && \
rm .env.local && \
echo "[synk] was deployed successfully to '$ENV' environment."