#!/bin/bash

# Vercel Deployment Script
# This script helps deploy your appointment system to Vercel

set -e

echo "🚀 Vercel Deployment Script"
echo "==========================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if Vercel CLI is installed
check_vercel_cli() {
    if ! command -v vercel &> /dev/null; then
        print_warning "Vercel CLI not found. Installing..."
        npm install -g vercel
        print_success "Vercel CLI installed"
    else
        print_success "Vercel CLI found"
    fi
}

# Check if user is logged in
check_login() {
    if ! vercel whoami &> /dev/null; then
        print_warning "Not logged in to Vercel. Please login:"
        vercel login
    else
        print_success "Already logged in to Vercel"
    fi
}

# Build the application
build_app() {
    print_status "Building application..."
    npm run build
    print_success "Build completed"
}

# Deploy to Vercel
deploy_app() {
    print_status "Deploying to Vercel..."
    
    if [ "$1" = "--prod" ]; then
        vercel --prod
        print_success "Production deployment completed!"
    else
        vercel
        print_success "Preview deployment completed!"
    fi
}

# Show deployment status
show_status() {
    print_status "Deployment status:"
    vercel ls
}

# Main deployment process
main() {
    echo ""
    print_status "Starting Vercel deployment..."
    echo ""
    
    # Step 1: Check Vercel CLI
    check_vercel_cli
    echo ""
    
    # Step 2: Check login status
    check_login
    echo ""
    
    # Step 3: Build application
    build_app
    echo ""
    
    # Step 4: Deploy
    if [ "$1" = "--prod" ]; then
        deploy_app --prod
    else
        deploy_app
    fi
    echo ""
    
    # Step 5: Show status
    show_status
    echo ""
    
    print_success "🎉 Deployment process completed!"
    echo ""
    print_status "Next steps:"
    echo "   1. Check your Vercel dashboard for deployment status"
    echo "   2. Set up environment variables in Vercel dashboard"
    echo "   3. Configure custom domain if needed"
    echo "   4. Set up monitoring and analytics"
    echo ""
    print_status "To view logs:"
    echo "   vercel logs"
    echo ""
    print_status "To open your app:"
    echo "   vercel open"
}

# Check command line arguments
case "${1:-}" in
    "prod"|"--prod")
        main --prod
        ;;
    "status")
        show_status
        ;;
    "help"|"--help"|"-h")
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  (no args)  - Deploy preview version"
        echo "  prod       - Deploy to production"
        echo "  status     - Show deployment status"
        echo "  help       - Show this help message"
        ;;
    *)
        main
        ;;
esac
