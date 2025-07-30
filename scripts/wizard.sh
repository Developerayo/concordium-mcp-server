#!/bin/bash
set -e

echo "Setup concordium mcp-server - Wizard"
echo "==========================================="
echo
echo "Options:"
echo

if [ $# -eq 0 ]; then
    PS3="Select deployment method (1-6): "
    options=("Local - Claude Desktop" "Docker - Claude Desktop/Cursor/Related" "Fly.io - HTTP" "Railway - HTTP" "Render - HTTP" "Exit")
    
    select opt in "${options[@]}"; do
        case $REPLY in
            1)
                echo "Starting local mcp setup..."
                ./scripts/local-deploy.sh
                break;;
            2)
                echo "Starting Docker mcp setup..."
                ./scripts/docker-deploy.sh
                break;;
            3)
                echo "Starting Fly.io mcp setup..."
                ./scripts/fly-deploy.sh
                break;;
            4)
                echo "Starting Railway mcp setup..."
                ./scripts/railway-deploy.sh
                break;;
            5)
                echo "Starting Render mcp setup..."
                ./scripts/render-deploy.sh
                break;;
            6)
                exit 0;;
            *)
                echo "Invalid";;
        esac
    done
fi