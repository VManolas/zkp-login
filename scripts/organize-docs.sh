#!/bin/bash

# Script to automatically organize markdown files into docs directory
# Excludes README.md files to keep them in their original locations

DOCS_DIR="docs"
FIXES_DIR="$DOCS_DIR/fixes"
TECHNICAL_DIR="$DOCS_DIR/technical"
USER_GUIDES_DIR="$DOCS_DIR/user-guides"
EXAMPLES_DIR="$DOCS_DIR/examples"

# Create directories if they don't exist
mkdir -p "$FIXES_DIR" "$TECHNICAL_DIR" "$USER_GUIDES_DIR" "$EXAMPLES_DIR"

# Function to categorize and move markdown files
organize_md_files() {
    local file="$1"
    local basename=$(basename "$file")
    
    # Handle README.md files specially
    if [[ "$basename" == "README.md" ]]; then
        if [[ "$file" == "./README.md" ]]; then
            echo "Preserving main README.md: $file"
        elif [[ "$file" == *"README_OLD.md" ]] || [[ "$file" == *"README_NEW.md" ]]; then
            echo "Moving README variant to examples: $file -> $EXAMPLES_DIR/"
            mv "$file" "$EXAMPLES_DIR/"
        else
            echo "Moving README.md to examples: $file -> $EXAMPLES_DIR/"
            mv "$file" "$EXAMPLES_DIR/"
        fi
        return
    fi
    
    # Categorize based on filename patterns
    if [[ "$basename" == *"FIX"* ]] || [[ "$basename" == *"fix"* ]] || [[ "$basename" == *"ERROR"* ]] || [[ "$basename" == *"error"* ]]; then
        echo "Moving to fixes: $file -> $FIXES_DIR/"
        mv "$file" "$FIXES_DIR/"
    elif [[ "$basename" == *"TEST"* ]] || [[ "$basename" == *"test"* ]] || [[ "$basename" == *"USER"* ]] || [[ "$basename" == *"user"* ]] || [[ "$basename" == *"GUIDE"* ]] || [[ "$basename" == *"guide"* ]]; then
        echo "Moving to user-guides: $file -> $USER_GUIDES_DIR/"
        mv "$file" "$USER_GUIDES_DIR/"
    elif [[ "$basename" == *"TECHNICAL"* ]] || [[ "$basename" == *"technical"* ]] || [[ "$basename" == *"PROJECT"* ]] || [[ "$basename" == *"project"* ]] || [[ "$basename" == *"DEPLOYMENT"* ]] || [[ "$basename" == *"deployment"* ]]; then
        echo "Moving to technical: $file -> $TECHNICAL_DIR/"
        mv "$file" "$TECHNICAL_DIR/"
    else
        echo "Moving to examples: $file -> $EXAMPLES_DIR/"
        mv "$file" "$EXAMPLES_DIR/"
    fi
}

# Find and organize all markdown files in the root directory
echo "Organizing markdown files..."
find . -maxdepth 1 -name "*.md" -type f | while read -r file; do
    organize_md_files "$file"
done

echo "Documentation organization complete!"
echo "Files organized into:"
echo "  - Fixes: $FIXES_DIR/"
echo "  - Technical: $TECHNICAL_DIR/"
echo "  - User Guides: $USER_GUIDES_DIR/"
echo "  - Examples: $EXAMPLES_DIR/"
echo ""
echo "README.md files were preserved in their original locations."
