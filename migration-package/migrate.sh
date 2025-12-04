#!/bin/bash

# Projects Structure Migration Script
# This script helps copy files from migration-package to your litecoin-fund project

set -e

echo "🚀 Projects Structure Migration Script"
echo "========================================"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from your project root."
    exit 1
fi

# Get project root (assuming script is in migration-package/)
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
MIGRATION_DIR="$SCRIPT_DIR"
PROJECT_ROOT="$(dirname "$MIGRATION_DIR")"

echo "📦 Migration package: $MIGRATION_DIR"
echo "📁 Project root: $PROJECT_ROOT"
echo ""

# Confirm migration
read -p "This will copy files to your project. Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Migration cancelled."
    exit 1
fi

# Create directories if they don't exist
echo "📂 Creating directories..."
mkdir -p "$PROJECT_ROOT/pages/projects"
mkdir -p "$PROJECT_ROOT/components"
mkdir -p "$PROJECT_ROOT/utils"
mkdir -p "$PROJECT_ROOT/contexts"
mkdir -p "$PROJECT_ROOT/pages/api/webflow"

# Copy pages
echo "📄 Copying pages..."
cp -r "$MIGRATION_DIR/pages/projects/"* "$PROJECT_ROOT/pages/projects/" 2>/dev/null || echo "⚠️  Some page files may not exist"

# Copy components
echo "🧩 Copying components..."
cp "$MIGRATION_DIR/components/"*.tsx "$PROJECT_ROOT/components/" 2>/dev/null || echo "⚠️  Some component files may not exist"

# Copy utils
echo "🔧 Copying utilities..."
cp "$MIGRATION_DIR/utils/"*.ts "$PROJECT_ROOT/utils/" 2>/dev/null || echo "⚠️  Some utility files may not exist"

# Copy contexts
echo "🔄 Copying contexts..."
cp "$MIGRATION_DIR/contexts/"*.tsx "$PROJECT_ROOT/contexts/" 2>/dev/null || echo "⚠️  Some context files may not exist"

# Copy API routes
echo "🌐 Copying API routes..."
cp "$MIGRATION_DIR/api/"*.ts "$PROJECT_ROOT/pages/api/" 2>/dev/null || echo "⚠️  Some API files may not exist"
cp "$MIGRATION_DIR/api/webflow/"*.ts "$PROJECT_ROOT/pages/api/webflow/" 2>/dev/null || echo "⚠️  Some Webflow API files may not exist"

echo ""
echo "✅ Files copied successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Update import paths in copied files"
echo "2. Adapt utils/webflow.ts to your CMS"
echo "3. Update API endpoints"
echo "4. Configure Tailwind and fonts"
echo "5. Install dependencies: npm install axios @fortawesome/react-fontawesome @fortawesome/free-solid-svg-icons"
echo "6. Test the application"
echo ""
echo "📚 See MIGRATION_INSTRUCTIONS.md for detailed steps"

