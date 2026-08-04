#!/bin/bash
# Deploy ecom to Google Cloud Run
# Usage: ./deploy/cloudrun/deploy.sh
#
# Required env vars (set in .env.cloudrun or export before running):
#   GCP_PROJECT      - your GCP project ID
#   GCP_REGION       - e.g. asia-south1 (Mumbai, closest to Kerala)
#   DATABASE_URL     - Neon postgres connection string
#   REDIS_URL        - Upstash redis URL
#   JWT_SECRET       - random secret (generate once)
#   JWT_REFRESH_SECRET - random secret

set -e

# ── Load config ──────────────────────────────────────────────────────────────
if [ -f deploy/cloudrun/.env.cloudrun ]; then
  set -a && source deploy/cloudrun/.env.cloudrun && set +a
fi

: "${GCP_PROJECT:?GCP_PROJECT required}"
: "${GCP_REGION:=asia-south1}"
: "${DATABASE_URL:?DATABASE_URL required (Neon postgres URL)}"
: "${REDIS_URL:?REDIS_URL required (Upstash redis URL)}"
: "${JWT_SECRET:?JWT_SECRET required}"
: "${JWT_REFRESH_SECRET:?JWT_REFRESH_SECRET required}"

REGISTRY="gcr.io/$GCP_PROJECT"

echo "=== ecom Cloud Run Deploy ==="
echo "Project: $GCP_PROJECT | Region: $GCP_REGION"
echo ""

# ── Build & push images ───────────────────────────────────────────────────────
echo "Building and pushing images..."

services=(
  "auth-service:services/auth-service"
  "platform-service:services/platform-service"
  "store-service:services/store-service"
  "catalog-service:services/catalog-service"
  "order-service:services/order-service"
  "storefront-service:services/storefront-service"
  "api-gateway:services/api-gateway"
  "platform-ui:platform-ui"
  "storefront:storefront"
)

for entry in "${services[@]}"; do
  name="${entry%%:*}"
  ctx="${entry##*:}"
  echo "  Building $name..."
  gcloud builds submit "$ctx" \
    --tag "$REGISTRY/ecom-$name:latest" \
    --project "$GCP_PROJECT" \
    --quiet
  echo "  ✓ $name pushed"
done

# ── Helper: deploy a Cloud Run service ───────────────────────────────────────
deploy_service() {
  local name=$1
  local port=$2
  shift 2
  local extra_env="$@"

  gcloud run deploy "ecom-$name" \
    --image "$REGISTRY/ecom-$name:latest" \
    --platform managed \
    --region "$GCP_REGION" \
    --allow-unauthenticated \
    --port "$port" \
    --min-instances 0 \
    --max-instances 3 \
    --memory 512Mi \
    --cpu 1 \
    --set-env-vars "PORT=$port,DATABASE_URL=$DATABASE_URL,JWT_SECRET=$JWT_SECRET,JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET$extra_env" \
    --project "$GCP_PROJECT" \
    --quiet 2>&1 | grep -E "Service URL|Deploying|OK|Error"
}

# ── Get Cloud Run URLs (services call each other) ─────────────────────────────
# Deploy stateless services first, get their URLs, then wire up gateway

echo ""
echo "Deploying backend services..."

deploy_service auth-service 3001
AUTH_URL=$(gcloud run services describe ecom-auth-service --region=$GCP_REGION --project=$GCP_PROJECT --format='value(status.url)')

deploy_service platform-service 3002
PLATFORM_URL=$(gcloud run services describe ecom-platform-service --region=$GCP_REGION --project=$GCP_PROJECT --format='value(status.url)')

deploy_service store-service 3003
STORE_URL=$(gcloud run services describe ecom-store-service --region=$GCP_REGION --project=$GCP_PROJECT --format='value(status.url)')

deploy_service catalog-service 3004
CATALOG_URL=$(gcloud run services describe ecom-catalog-service --region=$GCP_REGION --project=$GCP_PROJECT --format='value(status.url)')

deploy_service order-service 3005 ",REDIS_URL=$REDIS_URL"
ORDER_URL=$(gcloud run services describe ecom-order-service --region=$GCP_REGION --project=$GCP_PROJECT --format='value(status.url)')

deploy_service storefront-service 3006
STOREFRONT_SVC_URL=$(gcloud run services describe ecom-storefront-service --region=$GCP_REGION --project=$GCP_PROJECT --format='value(status.url)')

echo ""
echo "Deploying API gateway..."
gcloud run deploy ecom-api-gateway \
  --image "$REGISTRY/ecom-api-gateway:latest" \
  --platform managed \
  --region "$GCP_REGION" \
  --allow-unauthenticated \
  --port 4000 \
  --min-instances 0 \
  --max-instances 5 \
  --memory 512Mi \
  --set-env-vars "PORT=4000,JWT_SECRET=$JWT_SECRET,AUTH_SERVICE_URL=$AUTH_URL,PLATFORM_SERVICE_URL=$PLATFORM_URL,STORE_SERVICE_URL=$STORE_URL,CATALOG_SERVICE_URL=$CATALOG_URL,ORDER_SERVICE_URL=$ORDER_URL,STOREFRONT_SERVICE_URL=$STOREFRONT_SVC_URL" \
  --project "$GCP_PROJECT" \
  --quiet 2>&1 | grep -E "Service URL|OK|Error"

GATEWAY_URL=$(gcloud run services describe ecom-api-gateway --region=$GCP_REGION --project=$GCP_PROJECT --format='value(status.url)')

echo ""
echo "Deploying frontends..."

gcloud run deploy ecom-platform-ui \
  --image "$REGISTRY/ecom-platform-ui:latest" \
  --platform managed \
  --region "$GCP_REGION" \
  --allow-unauthenticated \
  --port 3001 \
  --min-instances 0 \
  --memory 512Mi \
  --set-env-vars "NEXT_PUBLIC_API_URL=$GATEWAY_URL/api" \
  --project "$GCP_PROJECT" \
  --quiet 2>&1 | grep -E "Service URL|OK|Error"

gcloud run deploy ecom-storefront \
  --image "$REGISTRY/ecom-storefront:latest" \
  --platform managed \
  --region "$GCP_REGION" \
  --allow-unauthenticated \
  --port 3000 \
  --min-instances 0 \
  --memory 512Mi \
  --set-env-vars "NEXT_PUBLIC_API_URL=$GATEWAY_URL/api,CATALOG_SERVICE_URL=$CATALOG_URL" \
  --project "$GCP_PROJECT" \
  --quiet 2>&1 | grep -E "Service URL|OK|Error"

PLATFORM_URL_FINAL=$(gcloud run services describe ecom-platform-ui --region=$GCP_REGION --project=$GCP_PROJECT --format='value(status.url)')
STOREFRONT_URL_FINAL=$(gcloud run services describe ecom-storefront --region=$GCP_REGION --project=$GCP_PROJECT --format='value(status.url)')

# ── Run DB migrations ─────────────────────────────────────────────────────────
echo ""
echo "Running DB migrations..."
for svc in auth-service platform-service store-service catalog-service order-service storefront-service; do
  gcloud run jobs create "ecom-migrate-$svc" \
    --image "$REGISTRY/ecom-$svc:latest" \
    --region "$GCP_REGION" \
    --set-env-vars "DATABASE_URL=$DATABASE_URL" \
    --command "npx" \
    --args "prisma,db,push,--accept-data-loss" \
    --project "$GCP_PROJECT" \
    --quiet 2>/dev/null || true

  gcloud run jobs execute "ecom-migrate-$svc" \
    --region "$GCP_REGION" \
    --project "$GCP_PROJECT" \
    --wait \
    --quiet 2>&1 | grep -E "succeeded|failed|Error" && echo "  ✓ $svc migrated"
done

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║           ecom deployed on Cloud Run!                ║"
echo "╠══════════════════════════════════════════════════════╣"
echo "║  Admin Dashboard  → $PLATFORM_URL_FINAL"
echo "║  Customer Store   → $STOREFRONT_URL_FINAL"
echo "║  API Gateway      → $GATEWAY_URL"
echo "╚══════════════════════════════════════════════════════╝"
echo ""
echo "Save these URLs! Login: superadmin@ecom.app / superadmin123"
