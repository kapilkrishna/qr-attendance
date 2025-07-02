#!/bin/bash

# MCP Render Helper Script
# This script provides Render operations for MCP integration

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to show help
show_help() {
    echo -e "${BLUE}MCP Render Helper - QR Attendance${NC}"
    echo "=========================================="
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  deploy     - Deploy the application to Render"
    echo "  status     - Check deployment status"
    echo "  logs       - Show recent logs"
    echo "  restart    - Restart the service"
    echo "  env        - List environment variables"
    echo "  help       - Show this help message"
    echo ""
}

# Function to deploy
deploy() {
    echo -e "${GREEN}🚀 Deploying QR Attendance to Render...${NC}"
    
    # Run the deployment script
    ./deploy.sh
    
    echo -e "${GREEN}✅ Deployment initiated!${NC}"
    echo -e "${YELLOW}📋 Check Render dashboard for status${NC}"
}

# Function to check status
status() {
    echo -e "${BLUE}📊 Checking deployment status...${NC}"
    
    # Use render CLI to check status
    if command -v render &> /dev/null; then
        echo "Render CLI available"
        # render status (if you have service configured)
    else
        echo -e "${YELLOW}⚠️  Render CLI not available${NC}"
        echo "Please check: https://dashboard.render.com"
    fi
}

# Function to show logs
logs() {
    echo -e "${BLUE}📋 Recent logs:${NC}"
    echo "Check Render dashboard for logs:"
    echo "https://dashboard.render.com"
}

# Function to restart service
restart() {
    echo -e "${YELLOW}🔄 Restarting service...${NC}"
    echo "This will trigger a new deployment on Render"
    
    # Commit and push to trigger auto-deploy
    git add .
    git commit -m "Restart: $(date '+%Y-%m-%d %H:%M:%S')"
    git push origin main
    
    echo -e "${GREEN}✅ Restart triggered!${NC}"
}

# Function to show environment variables
env_vars() {
    echo -e "${BLUE}🔧 Environment Variables:${NC}"
    echo ""
    echo "Current environment variables:"
    echo "DATABASE_URL: [set in Render dashboard]"
    echo "COACH_PASSWORD: [set in Render dashboard]"
    echo "CORS_ORIGINS: [set in Render dashboard]"
    echo ""
    echo "To update environment variables:"
    echo "1. Go to Render dashboard"
    echo "2. Select your service"
    echo "3. Go to Environment tab"
    echo "4. Add/update variables"
}

# Main script logic
case "${1:-help}" in
    "deploy")
        deploy
        ;;
    "status")
        status
        ;;
    "logs")
        logs
        ;;
    "restart")
        restart
        ;;
    "env")
        env_vars
        ;;
    "help"|*)
        show_help
        ;;
esac 