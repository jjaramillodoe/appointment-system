#!/bin/bash

# Quick Migration Script
# This script automates the entire migration process

set -e

echo "🚀 Quick Migration Script for Appointment System"
echo "================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if .env.production exists
check_env_file() {
    if [ ! -f ".env.production" ]; then
        print_error ".env.production file not found!"
        echo ""
        print_status "Please create it first:"
        echo "   cp env.production.template .env.production"
        echo "   nano .env.production"
        echo ""
        print_status "Make sure to set your MONGODB_URI and other variables"
        exit 1
    fi
    
    # Check if MONGODB_URI is set
    if ! grep -q "MONGODB_URI=" .env.production; then
        print_error "MONGODB_URI not found in .env.production!"
        echo ""
        print_status "Please add your production MongoDB connection string"
        exit 1
    fi
    
    print_success "Environment file found and configured"
}

# Backup local database
backup_database() {
    print_status "Creating backup of local database..."
    
    if [ -f "./scripts/backup.sh" ]; then
        ./scripts/backup.sh
    else
        print_warning "Backup script not found, creating manual backup..."
        BACKUP_DIR="./database-backups"
        mkdir -p "$BACKUP_DIR"
        TIMESTAMP=$(date +%Y%m%d_%H%M%S)
        
        mongodump --uri="mongodb://localhost:27017/appointment-system" --out="$BACKUP_DIR/backup_$TIMESTAMP"
        print_success "Manual backup created: backup_$TIMESTAMP"
    fi
}

# Test production connection
test_connection() {
    print_status "Testing connection to production database..."
    
    # Load environment variables
    export $(grep -v '^#' .env.production | xargs)
    
    # Test connection
    if mongosh "$MONGODB_URI" --eval "db.adminCommand('ping')" --quiet > /dev/null 2>&1; then
        print_success "Successfully connected to production database"
    else
        print_error "Failed to connect to production database"
        print_status "Please check your MONGODB_URI and network connectivity"
        exit 1
    fi
}

# Run migration
run_migration() {
    print_status "Starting migration process..."
    
    # Load environment variables
    export $(grep -v '^#' .env.production | xargs)
    
    # Run the migration script
    npm run migrate:to-production
}

# Verify migration
verify_migration() {
    print_status "Verifying migration..."
    
    # Load environment variables
    export $(grep -v '^#' .env.production | xargs)
    
    # Check a few key collections
    print_status "Checking collection counts..."
    
    USER_COUNT=$(mongosh "$MONGODB_URI" --eval "db.users.countDocuments()" --quiet)
    APPOINTMENT_COUNT=$(mongosh "$MONGODB_URI" --eval "db.appointments.countDocuments()" --quiet)
    HUB_COUNT=$(mongosh "$MONGODB_URI" --eval "db.hubs.countDocuments()" --quiet)
    
    echo "   Users: $USER_COUNT"
    echo "   Appointments: $APPOINTMENT_COUNT"
    echo "   Hubs: $HUB_COUNT"
    
    print_success "Migration verification completed"
}

# Main migration process
main() {
    echo ""
    print_status "Starting migration process..."
    echo ""
    
    # Step 1: Check environment
    check_env_file
    echo ""
    
    # Step 2: Backup local database
    backup_database
    echo ""
    
    # Step 3: Test production connection
    test_connection
    echo ""
    
    # Step 4: Run migration
    run_migration
    echo ""
    
    # Step 5: Verify migration
    verify_migration
    echo ""
    
    print_success "🎉 Migration completed successfully!"
    echo ""
    print_status "Next steps:"
    echo "   1. Test your application with the production database"
    echo "   2. Update your deployment configuration"
    echo "   3. Monitor performance and set up alerts"
    echo ""
    print_status "To test locally with production DB:"
    echo "   NODE_ENV=production npm run dev"
    echo ""
    print_status "To check health endpoint:"
    echo "   curl http://localhost:3000/api/health"
}

# Check if running in interactive mode
if [ "$1" = "--non-interactive" ]; then
    main
else
    echo "This script will migrate your local MongoDB to production."
    echo ""
    echo "⚠️  IMPORTANT: Make sure you have:"
    echo "   - Created .env.production with your production MONGODB_URI"
    echo "   - Backed up your local database"
    echo "   - Verified your production MongoDB is accessible"
    echo ""
    read -p "Are you ready to proceed? (y/N): " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        main
    else
        print_status "Migration cancelled. Please prepare and run again when ready."
        exit 0
    fi
fi
