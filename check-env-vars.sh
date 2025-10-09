#!/bin/bash

# Script to check if required environment variables are set in Netlify
# Run this locally to verify your .env file has all required variables

echo "=== Checking Environment Variables ==="
echo ""

# Frontend variables (must start with VITE_)
echo "Frontend Variables (VITE_*):"
echo "----------------------------"

if [ -z "$VITE_SUPABASE_URL" ]; then
  echo "❌ VITE_SUPABASE_URL is NOT set"
else
  echo "✅ VITE_SUPABASE_URL is set: ${VITE_SUPABASE_URL:0:30}..."
fi

if [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
  echo "❌ VITE_SUPABASE_ANON_KEY is NOT set"
else
  echo "✅ VITE_SUPABASE_ANON_KEY is set: ${VITE_SUPABASE_ANON_KEY:0:30}..."
fi

echo ""
echo "Backend/Netlify Function Variables:"
echo "-----------------------------------"

if [ -z "$STRIPE_SECRET_KEY" ]; then
  echo "❌ STRIPE_SECRET_KEY is NOT set"
else
  echo "✅ STRIPE_SECRET_KEY is set: ${STRIPE_SECRET_KEY:0:15}..."
fi

if [ -z "$STRIPE_PUBLISHABLE_KEY" ]; then
  echo "❌ STRIPE_PUBLISHABLE_KEY is NOT set"
else
  echo "✅ STRIPE_PUBLISHABLE_KEY is set: ${STRIPE_PUBLISHABLE_KEY:0:15}..."
fi

if [ -z "$STRIPE_WEBHOOK_SECRET" ]; then
  echo "❌ STRIPE_WEBHOOK_SECRET is NOT set"
else
  echo "✅ STRIPE_WEBHOOK_SECRET is set: ${STRIPE_WEBHOOK_SECRET:0:15}..."
fi

if [ -z "$SUPABASE_URL" ]; then
  echo "❌ SUPABASE_URL is NOT set"
else
  echo "✅ SUPABASE_URL is set: ${SUPABASE_URL:0:30}..."
fi

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "❌ SUPABASE_SERVICE_ROLE_KEY is NOT set"
else
  echo "✅ SUPABASE_SERVICE_ROLE_KEY is set: ${SUPABASE_SERVICE_ROLE_KEY:0:30}..."
fi

echo ""
echo "=== Summary ==="
echo ""
echo "Make sure ALL variables are set in Netlify:"
echo "1. Go to https://app.netlify.com/sites/litmusai/configuration/env"
echo "2. Add any missing variables"
echo "3. Trigger a new deployment after adding variables"
echo ""

