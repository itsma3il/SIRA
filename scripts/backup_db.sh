#!/bin/bash
#
# PostgreSQL Backup Script for SIRA
# Automates database backups with rotation
#

set -e

# Configuration
BACKUP_DIR="/backups"
POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_DB="${POSTGRES_DB:-sira}"
RETENTION_DAYS=7
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/${POSTGRES_DB}_${TIMESTAMP}.sql.gz"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting SIRA database backup...${NC}"
echo "Database: ${POSTGRES_DB}"
echo "Timestamp: ${TIMESTAMP}"

# Create backup directory if it doesn't exist
mkdir -p "${BACKUP_DIR}"

# Perform backup
echo -e "${YELLOW}Creating backup...${NC}"
if pg_dump -U "${POSTGRES_USER}" -h db "${POSTGRES_DB}" | gzip > "${BACKUP_FILE}"; then
    echo -e "${GREEN}Backup created successfully: ${BACKUP_FILE}${NC}"
    
    # Get backup size
    BACKUP_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
    echo "Backup size: ${BACKUP_SIZE}"
else
    echo -e "${RED}Backup failed!${NC}"
    exit 1
fi

# Remove old backups
echo -e "${YELLOW}Cleaning up old backups (keeping last ${RETENTION_DAYS} days)...${NC}"
find "${BACKUP_DIR}" -name "${POSTGRES_DB}_*.sql.gz" -type f -mtime +${RETENTION_DAYS} -delete

# List remaining backups
echo -e "${GREEN}Available backups:${NC}"
ls -lh "${BACKUP_DIR}"/${POSTGRES_DB}_*.sql.gz

# Verify backup
echo -e "${YELLOW}Verifying backup integrity...${NC}"
if gzip -t "${BACKUP_FILE}"; then
    echo -e "${GREEN}Backup verification successful!${NC}"
else
    echo -e "${RED}Backup verification failed!${NC}"
    exit 1
fi

echo -e "${GREEN}Backup completed successfully!${NC}"
