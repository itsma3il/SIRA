#!/usr/bin/env python3
"""
Environment Validation Script
Validates that all required environment variables are set before deployment.
"""

import os
import sys
from typing import List, Tuple

# Required environment variables for production
REQUIRED_VARS = {
    "database": [
        "POSTGRES_USER",
        "POSTGRES_PASSWORD",
        "POSTGRES_DB",
        "DATABASE_URL",
    ],
    "authentication": [
        "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
        "CLERK_SECRET_KEY",
        "CLERK_JWKS_URL",
    ],
    "api": [
        "NEXT_PUBLIC_API_BASE_URL",
    ],
    "ai_services": [
        "PINECONE_API_KEY",
        "PINECONE_ENVIRONMENT",
        "PINECONE_INDEX_NAME",
    ],
    "security": [
        "SECRET_KEY",
    ],
}

# Variables that should NOT contain default/example values
FORBIDDEN_VALUES = {
    "POSTGRES_PASSWORD": ["postgres", "password", "CHANGE_ME"],
    "SECRET_KEY": ["secret", "CHANGE_ME", "your-secret-key"],
    "MISTRAL_API_KEY": ["your_mistral_api_key", "CHANGE_ME"],
    "DEEPSEEK_API_KEY": ["your_deepseek_api_key", "CHANGE_ME"],
    "GEMINI_API_KEY": ["your_gemini_api_key", "CHANGE_ME"],
    "PINECONE_API_KEY": ["your_pinecone_api_key", "CHANGE_ME"],
}

# Minimum lengths for sensitive values
MIN_LENGTHS = {
    "POSTGRES_PASSWORD": 12,
    "SECRET_KEY": 32,
    "MISTRAL_API_KEY": 20,
    "DEEPSEEK_API_KEY": 20,
    "GEMINI_API_KEY": 20,
    "PINECONE_API_KEY": 20,
    "CLERK_SECRET_KEY": 20,
}



def validate_environment() -> Tuple[bool, List[str]]:
    """Validate environment variables."""
    errors = []
    warnings = []
    
    print("=" * 60)
    print("SIRA Environment Validation")
    print("=" * 60)
    
    # Get environment type
    env_type = os.getenv("ENVIRONMENT", "development")
    print(f"\nEnvironment: {env_type}")
    
    if env_type == "development":
        print("\nSkipping strict validation for development environment.")
        return True, []
    
    print(f"\nValidating {env_type} environment...\n")
    
    # Check required variables
    llm_prov = os.getenv("LLM_PROVIDER", "mistral").lower()
    emb_prov = os.getenv("EMBEDDING_PROVIDER", "mistral").lower()

    for category, vars_list in REQUIRED_VARS.items():
        print(f"\n[{category.upper()}]")
        category_vars = list(vars_list)
        if category == "ai_services":
            if llm_prov == "mistral" or emb_prov == "mistral":
                category_vars.append("MISTRAL_API_KEY")
            if llm_prov == "deepseek" or emb_prov == "deepseek":
                category_vars.append("DEEPSEEK_API_KEY")
            if llm_prov == "gemini" or emb_prov == "gemini":
                category_vars.append("GEMINI_API_KEY")

        for var in category_vars:
            value = os.getenv(var)

            
            if value is None:
                errors.append(f"  ✗ {var}: MISSING (required)")
                print(f"  ✗ {var}: MISSING")
            else:
                # Check if value is a forbidden default
                if var in FORBIDDEN_VALUES:
                    if any(forbidden in value for forbidden in FORBIDDEN_VALUES[var]):
                        errors.append(f"  ✗ {var}: Contains forbidden default value")
                        print(f"  ✗ {var}: Contains forbidden default value")
                        continue
                
                # Check minimum length
                if var in MIN_LENGTHS:
                    if len(value) < MIN_LENGTHS[var]:
                        errors.append(f"  ✗ {var}: Too short (min {MIN_LENGTHS[var]} chars)")
                        print(f"  ✗ {var}: Too short (min {MIN_LENGTHS[var]} chars)")
                        continue
                
                # Check URL format
                if "URL" in var and not value.startswith(("http://", "https://", "postgresql")):
                    warnings.append(f"  ⚠ {var}: May not be a valid URL")
                    print(f"  ⚠ {var}: May not be a valid URL")
                else:
                    print(f"  ✓ {var}: OK")
    
    # Additional checks for production
    if env_type == "production":
        print("\n[PRODUCTION CHECKS]")
        
        # Check DEBUG is false
        debug = os.getenv("DEBUG", "false").lower()
        if debug == "true":
            warnings.append("  ⚠ DEBUG: Should be false in production")
            print("  ⚠ DEBUG: Should be false in production")
        else:
            print("  ✓ DEBUG: false")
        
        # Check HTTPS for API URL
        api_url = os.getenv("NEXT_PUBLIC_API_BASE_URL", "")
        if not api_url.startswith("https://"):
            errors.append("  ✗ NEXT_PUBLIC_API_BASE_URL: Must use HTTPS in production")
            print("  ✗ NEXT_PUBLIC_API_BASE_URL: Must use HTTPS")
        else:
            print("  ✓ NEXT_PUBLIC_API_BASE_URL: HTTPS")
        
        # Check Clerk is using live keys
        clerk_key = os.getenv("CLERK_SECRET_KEY", "")
        if clerk_key.startswith("sk_test_"):
            warnings.append("  ⚠ CLERK_SECRET_KEY: Using test key in production")
            print("  ⚠ CLERK_SECRET_KEY: Using test key")
        elif clerk_key.startswith("sk_live_"):
            print("  ✓ CLERK_SECRET_KEY: Live key")
    
    # Print summary
    print("\n" + "=" * 60)
    print("VALIDATION SUMMARY")
    print("=" * 60)
    
    if errors:
        print(f"\n❌ ERRORS: {len(errors)}")
        for error in errors:
            print(error)
    
    if warnings:
        print(f"\n⚠️  WARNINGS: {len(warnings)}")
        for warning in warnings:
            print(warning)
    
    if not errors and not warnings:
        print("\n✅ All checks passed!")
    elif not errors:
        print("\n✅ No critical errors, but please review warnings.")
    else:
        print("\n❌ Critical errors found. Please fix before deployment.")
    
    print("\n" + "=" * 60)
    
    return len(errors) == 0, errors


if __name__ == "__main__":
    success, errors = validate_environment()
    
    if not success:
        print("\n💡 TIP: Copy .env.production.example to .env.production and fill in values.")
        sys.exit(1)
    
    sys.exit(0)
