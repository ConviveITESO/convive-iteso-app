#!/bin/bash
# =============================================================================
# Setup /etc/hosts for local testing
# =============================================================================

set -e

echo "🔍 Getting ALB DNS name..."
ALB_DNS=$(terraform output -raw alb_dns_name)

echo "📡 Resolving ALB IP addresses..."
ALB_IP=$(nslookup $ALB_DNS | grep "Address:" | tail -n 1 | awk '{print $2}')
echo "Using IP: $ALB_IP"
echo ""

# Backup /etc/hosts
echo "💾 Creating backup of /etc/hosts..."
sudo cp /etc/hosts /etc/hosts.backup.$(date +%Y%m%d_%H%M%S)
echo "Backup created: /etc/hosts.backup.$(date +%Y%m%d_%H%M%S)"
echo ""

# Remove old ConviveITESO entries (if any)
echo "🧹 Removing old ConviveITESO entries..."
sudo sed -i.tmp '/conviveitesofront.ricardonavarro.mx/d' /etc/hosts
sudo sed -i.tmp '/conviveitesoback.ricardonavarro.mx/d' /etc/hosts
sudo rm /etc/hosts.tmp
echo ""

# Add new entries
echo "✍️  Adding new ConviveITESO entries..."
echo "" | sudo tee -a /etc/hosts > /dev/null
echo "# ConviveITESO - Added by setup-hosts.sh on $(date)" | sudo tee -a /etc/hosts > /dev/null
echo "$ALB_IP    conviveitesofront.ricardonavarro.mx" | sudo tee -a /etc/hosts > /dev/null
echo "$ALB_IP    conviveitesoback.ricardonavarro.mx" | sudo tee -a /etc/hosts > /dev/null
echo ""

echo "✅ /etc/hosts updated successfully!"
echo ""
echo "📝 Added entries:"
echo "$ALB_IP    conviveitesofront.ricardonavarro.mx"
echo "$ALB_IP    conviveitesoback.ricardonavarro.mx"
echo ""
echo "🌐 You can now open in your browser:"
echo "   Frontend: http://conviveitesofront.ricardonavarro.mx"
echo "   Backend:  http://conviveitesoback.ricardonavarro.mx/health"
echo "   Swagger:  http://conviveitesoback.ricardonavarro.mx/api-docs"
echo ""
echo "⚠️  Note: If infrastructure restarts, run this script again to update IPs"
