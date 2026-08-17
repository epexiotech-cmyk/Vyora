#!/bin/bash
echo "===== ACCOUNTING SCHEMA ====="
grep -R "ledger" packages/database/src/schema -n

echo ""
echo "===== JOURNAL TYPES ====="
grep -R "voucherType" apps/desktop/electron/src -n

echo ""
echo "===== CHART OF ACCOUNTS ====="
find . -type d \( -name "node_modules" -o -name ".git" -o -name ".next" -o -name "dist" -o -name "build" \) -prune -o -type f -iname "*ChartOfAccounts*" -print

echo ""
echo "===== COMPANY BOOTSTRAP ====="
find . -type d \( -name "node_modules" -o -name ".git" -o -name ".next" -o -name "dist" -o -name "build" \) -prune -o -type f -iname "*Bootstrap*" -print

echo ""
echo "===== SALES INVOICE PRINTING ====="
find . -type d \( -name "node_modules" -o -name ".git" -o -name ".next" -o -name "dist" -o -name "build" \) -prune -o -type f -iname "*invoice*" -print | grep -Ei "template|print|adapter"

echo ""
echo "===== COMPANY DTO ====="
find . -type d \( -name "node_modules" -o -name ".git" -o -name ".next" -o -name "dist" -o -name "build" \) -prune -o -type f -iname "*company.dto*" -print

echo ""
echo "===== CUSTOMER DTO ====="
find . -type d \( -name "node_modules" -o -name ".git" -o -name ".next" -o -name "dist" -o -name "build" \) -prune -o -type f -iname "*customer.dto*" -print

echo ""
echo "===== IPC PRELOAD ====="
find . -type d \( -name "node_modules" -o -name ".git" -o -name ".next" -o -name "dist" -o -name "build" \) -prune -o -type f -iname "preload.ts" -print

echo ""
echo "===== DATABASE MIGRATIONS ====="
find . -type d \( -name "node_modules" -o -name ".git" -o -name ".next" -o -name "dist" -o -name "build" \) -prune -o -type f -iname "*.sql" -print
