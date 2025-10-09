#!/usr/bin/env python3
"""Generate random secret keys for deployment"""
import secrets
import string

def generate_secret_key(length=50):
    """Generate a random secret key"""
    alphabet = string.ascii_letters + string.digits + string.punctuation
    return ''.join(secrets.choice(alphabet) for _ in range(length))

if __name__ == '__main__':
    print("=== Generated Secret Keys for Render Deployment ===\n")
    print(f"SECRET_KEY={generate_secret_key()}")
    print(f"JWT_SECRET_KEY={generate_secret_key()}")
    print("\n=== Copy these to Render Environment Variables ===")

