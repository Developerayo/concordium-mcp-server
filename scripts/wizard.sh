#!/bin/bash
set -e

echo "Setup concordium mcp-server - Wizard"
echo "==========================================="
echo
echo "Options:"
echo

if [ $# -eq 0 ]; then
    PS3="Select deployment method (1-2): "
    options=("Local - Claude Desktop" "Docker - Claude Desktop/Cursor/Related" "Exit")
    
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
                exit 0;;
            *)
                echo "Invalid";;
        esac
    done
fi