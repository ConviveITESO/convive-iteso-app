#!/bin/bash
# =============================================================================
# ALB Testing Script - Test without DNS configuration
# =============================================================================

set -e

echo "🔍 Getting ALB DNS name..."
ALB_DNS=$(terraform output -raw alb_dns_name)
echo "ALB DNS: $ALB_DNS"
echo ""

echo "📡 Resolving ALB IP addresses..."
ALB_IPS=$(nslookup $ALB_DNS | grep "Address:" | tail -n +2 | awk '{print $2}')
echo "$ALB_IPS"
echo ""

echo "✅ Testing Frontend (default route)..."
echo "URL: http://$ALB_DNS"
curl -s -o /dev/null -w "Status: %{http_code}\n" http://$ALB_DNS || true
echo ""

echo "✅ Testing Frontend (with Host header)..."
curl -s -o /dev/null -w "Status: %{http_code}\n" -H "Host: conviveitesofront.ricardonavarro.mx" http://$ALB_DNS || true
echo ""

echo "✅ Testing Backend Health Endpoint..."
echo "URL: http://$ALB_DNS/health (with Host: conviveitesoback.ricardonavarro.mx)"
curl -s -H "Host: conviveitesoback.ricardonavarro.mx" http://$ALB_DNS/health | head -c 200
echo ""
echo ""

echo "✅ Testing Backend API Documentation..."
echo "URL: http://$ALB_DNS/api-docs (with Host: conviveitesoback.ricardonavarro.mx)"
curl -s -o /dev/null -w "Status: %{http_code}\n" -H "Host: conviveitesoback.ricardonavarro.mx" http://$ALB_DNS/api-docs || true
echo ""

echo "📝 To test in browser, add these lines to /etc/hosts:"
echo ""
for ip in $ALB_IPS; do
  echo "$ip    conviveitesofront.ricardonavarro.mx"
  echo "$ip    conviveitesoback.ricardonavarro.mx"
  echo ""
done

echo "💡 Then open in browser:"
echo "   Frontend: http://conviveitesofront.ricardonavarro.mx"
echo "   Backend:  http://conviveitesoback.ricardonavarro.mx/health"
echo "   Swagger:  http://conviveitesoback.ricardonavarro.mx/api-docs"
