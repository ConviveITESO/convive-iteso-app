#!/bin/bash
# =============================================================================
# Cleanup /etc/hosts - Remove ConviveITESO entries
# =============================================================================

set -e

echo "🧹 Removing ConviveITESO entries from /etc/hosts..."

# Backup /etc/hosts
echo "💾 Creating backup of /etc/hosts..."
sudo cp /etc/hosts /etc/hosts.backup.$(date +%Y%m%d_%H%M%S)
echo ""

# Remove ConviveITESO entries
sudo sed -i.tmp '/conviveitesofront.ricardonavarro.mx/d' /etc/hosts
sudo sed -i.tmp '/conviveitesoback.ricardonavarro.mx/d' /etc/hosts
sudo sed -i.tmp '/# ConviveITESO - Added by setup-hosts.sh/d' /etc/hosts
sudo rm /etc/hosts.tmp

echo "✅ ConviveITESO entries removed from /etc/hosts"
echo ""
echo "📝 Backups are available at: /etc/hosts.backup.*"
