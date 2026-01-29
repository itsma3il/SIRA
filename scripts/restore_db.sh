#!/bin/bash
#
# PostgreSQL Restore Script for SIRA
# Restores database from backup
#

set -e

# Configuration
BACKUP_DIR="/backups"
POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_DB="${POSTGRES_DB:-sira}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if backup file is provided
if [ -z "$1" ]; then
    echo -e "${RED}Usage: $0 <backup_file>${NC}"
    echo ""
    echo "Available backups:"
    ls -lh "${BACKUP_DIR}"/${POSTGRES_DB}_*.sql.gz
    exit 1
fi

BACKUP_FILE="$1"

# Check if backup file exists
if [ ! -f "${BACKUP_FILE}" ]; then
    echo -e "${RED}Error: Backup file not found: ${BACKUP_FILE}${NC}"
    exit 1
fi

echo -e "${YELLOW}WARNING: This will replace the current database!${NC}"
echo "Database: ${POSTGRES_DB}"
echo "Backup file: ${BACKUP_FILE}"
echo ""
read -p "Are you sure you want to continue? (yes/no): " -r
echo

if [[ ! $REPLY =~ ^yes$ ]]; then
    echo -e "${YELLOW}Restore cancelled.${NC}"
    exit 0
fi

# Create a safety backup before restore
SAFETY_BACKUP="${BACKUP_DIR}/${POSTGRES_DB}_pre_restore_$(date +"%Y%m%d_%H%M%S").sql.gz"
echo -e "${YELLOW}Creating safety backup first...${NC}"
pg_dump -U "${POSTGRES_USER}" -h db "${POSTGRES_DB}" | gzip > "${SAFETY_BACKUP}"
echo -e "${GREEN}Safety backup created: ${SAFETY_BACKUP}${NC}"

# Drop existing connections
echo -e "${YELLOW}Terminating existing connections...${NC}"
psql -U "${POSTGRES_USER}" -h db -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${POSTGRES_DB}' AND pid <> pg_backend_pid();"

# Restore database
echo -e "${YELLOW}Restoring database...${NC}"
if gunzip -c "${BACKUP_FILE}" | psql -U "${POSTGRES_USER}" -h db "${POSTGRES_DB}"; then
    echo -e "${GREEN}Database restored successfully!${NC}"
else
    echo -e "${RED}Restore failed!${NC}"
    echo -e "${YELLOW}You can restore the safety backup if needed:${NC}"
    echo "  ./scripts/restore_db.sh ${SAFETY_BACKUP}"
    exit 1
fi

echo -e "${GREEN}Restore completed successfully!${NC}"
