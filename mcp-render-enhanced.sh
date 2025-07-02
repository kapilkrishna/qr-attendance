#!/bin/bash

# Enhanced MCP Render Helper Script
# This script provides real Render API integration

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if API key is set
check_api_key() {
    if [ -z "$RENDER_API_KEY" ]; then
        echo -e "${RED}❌ RENDER_API_KEY environment variable not set${NC}"
        echo "Please set your Render API key:"
        echo "export RENDER_API_KEY='your_api_key_here'"
        exit 1
    fi
}

# Function to show help
show_help() {
    echo -e "${BLUE}Enhanced MCP Render Helper - QR Attendance${NC}"
    echo "================================================"
    echo ""
    echo "Usage: $0 [COMMAND] [SERVICE_ID]"
    echo ""
    echo "Commands:"
    echo "  list              - List all Render services"
    echo "  status [ID]       - Check service status"
    echo "  logs [ID]         - Show service logs"
    echo "  deploy [ID]       - Trigger manual deployment"
    echo "  deployments [ID]  - Show deployment history"
    echo "  auto-deploy       - Commit and push to trigger auto-deploy"
    echo "  help              - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 list"
    echo "  $0 status srv-abc123"
    echo "  $0 deploy srv-abc123"
    echo ""
}

# Function to list services
list_services() {
    echo -e "${BLUE}📋 Listing Render services...${NC}"
    check_api_key
    
    export RENDER_API_KEY
    python render-mcp-server.py list
}

# Function to check service status
check_status() {
    if [ -z "$1" ]; then
        echo -e "${RED}❌ Service ID required${NC}"
        echo "Usage: $0 status <service_id>"
        exit 1
    fi
    
    echo -e "${BLUE}📊 Checking status for service: $1${NC}"
    check_api_key
    
    export RENDER_API_KEY
    python render-mcp-server.py service "$1"
}

# Function to show logs
show_logs() {
    if [ -z "$1" ]; then
        echo -e "${RED}❌ Service ID required${NC}"
        echo "Usage: $0 logs <service_id>"
        exit 1
    fi
    
    echo -e "${BLUE}📋 Getting logs for service: $1${NC}"
    check_api_key
    
    export RENDER_API_KEY
    python render-mcp-server.py logs "$1"
}

# Function to trigger deployment
trigger_deploy() {
    if [ -z "$1" ]; then
        echo -e "${RED}❌ Service ID required${NC}"
        echo "Usage: $0 deploy <service_id>"
        exit 1
    fi
    
    echo -e "${GREEN}🚀 Triggering deployment for service: $1${NC}"
    check_api_key
    
    export RENDER_API_KEY
    python render-mcp-server.py deploy "$1"
}

# Function to show deployment history
show_deployments() {
    if [ -z "$1" ]; then
        echo -e "${RED}❌ Service ID required${NC}"
        echo "Usage: $0 deployments <service_id>"
        exit 1
    fi
    
    echo -e "${BLUE}📋 Getting deployment history for service: $1${NC}"
    check_api_key
    
    export RENDER_API_KEY
    python render-mcp-server.py deployments "$1"
}

# Function to auto-deploy (commit and push)
auto_deploy() {
    echo -e "${GREEN}🚀 Auto-deploying via GitHub...${NC}"
    
    # Check git status
    if [ -z "$(git status --porcelain)" ]; then
        echo -e "${YELLOW}ℹ️  No changes to commit${NC}"
        return 0
    fi
    
    # Add all changes
    git add .
    
    # Commit with timestamp
    commit_message="Auto-deploy: $(date '+%Y-%m-%d %H:%M:%S')"
    git commit -m "$commit_message"
    
    # Push to GitHub
    git push origin main
    
    echo -e "${GREEN}✅ Changes pushed to GitHub - Render will auto-deploy${NC}"
}

# Main script logic
case "${1:-help}" in
    "list")
        list_services
        ;;
    "status")
        check_status "$2"
        ;;
    "logs")
        show_logs "$2"
        ;;
    "deploy")
        trigger_deploy "$2"
        ;;
    "deployments")
        show_deployments "$2"
        ;;
    "auto-deploy")
        auto_deploy
        ;;
    "help"|*)
        show_help
        ;;
esac 