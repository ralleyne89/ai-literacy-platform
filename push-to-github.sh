#!/bin/bash

# Push to GitHub Script
# This script helps you push commits to GitHub using a Personal Access Token

echo "🚀 Push to GitHub - LitmusAI Platform"
echo "======================================"
echo ""
echo "You have 8 commits ready to push:"
echo ""
git log --oneline -8
echo ""
echo "======================================"
echo ""
echo "To push these commits, you need to authenticate with GitHub."
echo ""
echo "Option 1: Use Personal Access Token (Recommended)"
echo "  1. Go to: https://github.com/settings/tokens"
echo "  2. Click 'Generate new token (classic)'"
echo "  3. Select scope: 'repo'"
echo "  4. Copy the token"
echo "  5. Run this command:"
echo ""
echo "     git push https://YOUR_TOKEN@github.com/ralleyne89/ai-literacy-platform.git feat/phase2-auth-dashboard"
echo ""
echo "Option 2: Install Git Credential Manager"
echo "  1. Run: brew install git-credential-manager"
echo "  2. Run: git config --global credential.helper manager"
echo "  3. Run: git push origin feat/phase2-auth-dashboard"
echo ""
echo "Option 3: Set up SSH Keys"
echo "  See PUSH_AND_DEPLOY_GUIDE.md for detailed instructions"
echo ""
echo "======================================"
echo ""
read -p "Do you want to push now using a Personal Access Token? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]
then
    echo ""
    read -p "Enter your GitHub Personal Access Token: " TOKEN
    echo ""
    echo "Pushing to GitHub..."
    git push https://$TOKEN@github.com/ralleyne89/ai-literacy-platform.git feat/phase2-auth-dashboard
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Successfully pushed to GitHub!"
        echo ""
        echo "Next steps:"
        echo "1. Check GitHub: https://github.com/ralleyne89/ai-literacy-platform/commits/feat/phase2-auth-dashboard"
        echo "2. Netlify should auto-deploy (check https://app.netlify.com/)"
        echo "3. Run database migrations on production"
        echo "4. Test the deployment"
        echo ""
        echo "See DEPLOYMENT_INSTRUCTIONS.md for details."
    else
        echo ""
        echo "❌ Push failed. Please check your token and try again."
        echo ""
        echo "Troubleshooting:"
        echo "- Make sure the token has 'repo' scope"
        echo "- Check that the token hasn't expired"
        echo "- Verify you copied the entire token"
    fi
else
    echo ""
    echo "No problem! When you're ready, use one of the options above."
    echo "See PUSH_AND_DEPLOY_GUIDE.md for detailed instructions."
fi

echo ""

