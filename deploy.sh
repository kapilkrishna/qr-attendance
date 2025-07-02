#!/bin/bash

# QR Attendance Deployment Script
# This script can be used with MCP to deploy to Render

set -e

echo "🚀 Starting QR Attendance deployment..."

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -f "backend/requirements.txt" ]; then
    echo "❌ Error: Not in the project root directory"
    exit 1
fi

# Function to deploy backend
deploy_backend() {
    echo "📦 Deploying backend..."
    
    # Check if backend directory exists
    if [ ! -d "backend" ]; then
        echo "❌ Backend directory not found"
        exit 1
    fi
    
    # Build and deploy backend
    echo "🔨 Building backend..."
    cd backend
    
    # Check if requirements.txt exists
    if [ ! -f "requirements.txt" ]; then
        echo "❌ requirements.txt not found in backend directory"
        exit 1
    fi
    
    echo "✅ Backend ready for deployment"
    cd ..
}

# Function to deploy frontend
deploy_frontend() {
    echo "🎨 Deploying frontend..."
    
    # Check if package.json exists
    if [ ! -f "package.json" ]; then
        echo "❌ package.json not found"
        exit 1
    fi
    
    # Install dependencies
    echo "📦 Installing frontend dependencies..."
    npm install
    
    # Build frontend
    echo "🔨 Building frontend..."
    npm run build
    
    echo "✅ Frontend ready for deployment"
}

# Function to commit and push changes
commit_and_push() {
    echo "📝 Committing and pushing changes..."
    
    # Check git status
    if [ -z "$(git status --porcelain)" ]; then
        echo "ℹ️  No changes to commit"
        return 0
    fi
    
    # Add all changes
    git add .
    
    # Commit with timestamp
    commit_message="Deploy: $(date '+%Y-%m-%d %H:%M:%S')"
    git commit -m "$commit_message"
    
    # Push to GitHub
    git push origin main
    
    echo "✅ Changes pushed to GitHub"
}

# Main deployment flow
main() {
    echo "🎯 QR Attendance Deployment"
    echo "=========================="
    
    # Deploy backend
    deploy_backend
    
    # Deploy frontend
    deploy_frontend
    
    # Commit and push changes
    commit_and_push
    
    echo ""
    echo "🎉 Deployment completed!"
    echo "📋 Next steps:"
    echo "   1. Check Render dashboard for deployment status"
    echo "   2. Monitor build logs for any errors"
    echo "   3. Test the deployed application"
    echo ""
    echo "🔗 Render Dashboard: https://dashboard.render.com"
}

# Run main function
main "$@" 