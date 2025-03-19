#!/bin/bash

# Create symlinks for environment files
ln -sf ../../.env packages/database/.env
ln -sf ../../.env packages/server/.env
ln -sf ../../.env packages/agents/.env

echo "Environment file symlinks created successfully!" 