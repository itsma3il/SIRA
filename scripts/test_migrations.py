"""
Database Migration Testing Script
Tests all Alembic migrations in a safe environment
"""

import subprocess
import sys
import os
from pathlib import Path
from typing import List, Tuple

# Colors for output
RED = '\033[0;31m'
GREEN = '\033[0;32m'
YELLOW = '\033[1;33m'
NC = '\033[0m'  # No Color


def run_command(cmd: List[str]) -> Tuple[int, str, str]:
    """Run a shell command and return exit code, stdout, stderr."""
    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            check=False
        )
        return result.returncode, result.stdout, result.stderr
    except Exception as e:
        return 1, "", str(e)


def print_header(text: str):
    """Print a formatted header."""
    print(f"\n{YELLOW}{'=' * 60}{NC}")
    print(f"{YELLOW}{text.center(60)}{NC}")
    print(f"{YELLOW}{'=' * 60}{NC}\n")


def print_success(text: str):
    """Print success message."""
    print(f"{GREEN}✓ {text}{NC}")


def print_error(text: str):
    """Print error message."""
    print(f"{RED}✗ {text}{NC}")


def print_warning(text: str):
    """Print warning message."""
    print(f"{YELLOW}⚠ {text}{NC}")


def check_prerequisites() -> bool:
    """Check if all prerequisites are met."""
    print_header("Checking Prerequisites")
    
    # Check if we're in the backend directory
    if not Path("alembic.ini").exists():
        print_error("alembic.ini not found. Run this script from the backend directory.")
        return False
    print_success("Found alembic.ini")
    
    # Check database connection
    print("Testing database connection...")
    code, _, _ = run_command(["alembic", "current"])
    if code != 0:
        print_error("Cannot connect to database. Check DATABASE_URL.")
        return False
    print_success("Database connection successful")
    
    return True


def get_migration_versions() -> List[str]:
    """Get list of all migration versions."""
    code, stdout, stderr = run_command(["alembic", "history"])
    if code != 0:
        print_error(f"Failed to get migration history: {stderr}")
        return []
    
    versions = []
    for line in stdout.split('\n'):
        if '->' in line:
            # Extract version hash (format: <hash> -> <hash>)
            parts = line.split('->')
            if len(parts) >= 2:
                version = parts[1].strip().split()[0]
                versions.append(version)
    
    return list(reversed(versions))  # Return in chronological order


def test_upgrade(target: str = "head") -> bool:
    """Test upgrading to a specific version."""
    print(f"\nUpgrading to {target}...")
    code, stdout, stderr = run_command(["alembic", "upgrade", target])
    
    if code != 0:
        print_error(f"Upgrade failed: {stderr}")
        print(stdout)
        return False
    
    print_success(f"Upgraded to {target}")
    return True


def test_downgrade(target: str) -> bool:
    """Test downgrading to a specific version."""
    print(f"\nDowngrading to {target}...")
    code, stdout, stderr = run_command(["alembic", "downgrade", target])
    
    if code != 0:
        print_error(f"Downgrade failed: {stderr}")
        print(stdout)
        return False
    
    print_success(f"Downgraded to {target}")
    return True


def get_current_version() -> str:
    """Get current migration version."""
    code, stdout, _ = run_command(["alembic", "current"])
    if code != 0:
        return "unknown"
    
    for line in stdout.split('\n'):
        if line.strip():
            return line.split()[0]
    
    return "base"


def test_migrations():
    """Run comprehensive migration tests."""
    print_header("SIRA Migration Testing Suite")
    
    # Prerequisites
    if not check_prerequisites():
        sys.exit(1)
    
    # Get initial state
    initial_version = get_current_version()
    print(f"Initial version: {initial_version}")
    
    # Get all migrations
    print_header("Discovering Migrations")
    versions = get_migration_versions()
    if not versions:
        print_error("No migrations found!")
        sys.exit(1)
    
    print(f"Found {len(versions)} migrations:")
    for v in versions:
        print(f"  - {v}")
    
    # Test 1: Full upgrade
    print_header("Test 1: Full Upgrade to Head")
    if not test_upgrade("head"):
        print_error("Full upgrade test failed!")
        sys.exit(1)
    
    # Test 2: Downgrade one step
    print_header("Test 2: Downgrade One Step")
    if len(versions) > 1:
        target = versions[-2]  # Previous version
        if not test_downgrade(target):
            print_error("Downgrade test failed!")
            sys.exit(1)
        
        # Upgrade back
        if not test_upgrade("head"):
            print_error("Re-upgrade test failed!")
            sys.exit(1)
    else:
        print_warning("Only one migration, skipping downgrade test")
    
    # Test 3: Full downgrade and upgrade
    print_header("Test 3: Full Downgrade and Re-upgrade")
    print_warning("This will reset the database to base state!")
    
    response = input("Continue with full reset test? (yes/no): ")
    if response.lower() == 'yes':
        if not test_downgrade("base"):
            print_error("Full downgrade test failed!")
            sys.exit(1)
        
        if not test_upgrade("head"):
            print_error("Full re-upgrade test failed!")
            sys.exit(1)
    else:
        print_warning("Skipping full reset test")
    
    # Summary
    print_header("Migration Test Summary")
    print_success("All migration tests passed!")
    print(f"Final version: {get_current_version()}")
    print(f"Expected version: head")
    
    print("\nMigration tests completed successfully!")


if __name__ == "__main__":
    try:
        test_migrations()
    except KeyboardInterrupt:
        print(f"\n{YELLOW}Test interrupted by user{NC}")
        sys.exit(1)
    except Exception as e:
        print_error(f"Unexpected error: {str(e)}")
        sys.exit(1)
