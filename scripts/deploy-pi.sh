#!/bin/bash
set -e
NS=ecom
PI_IP=$(hostname -I | awk '{print $1}')

echo "=== ecom deployment on Pi ==="
echo "Namespace: $NS | IP: $PI_IP"

cd /home/pi/ecom

# 1. Install npm deps for each service (needed for build)
echo "Installing dependencies..."
for svc in services/auth-service services/api-gateway services/platform-service services/store-service services/catalog-service services/order-service services/storefront-service; do
  (cd $svc && npm install --silent 2>/dev/null) &
done
wait
echo "✓ Dependencies installed"

# 2. Build all Docker images
echo "Building images (this takes a few minutes on Pi)..."
docker compose build 2>&1 | grep -E "(Built|ERROR|error)" | tail -20
echo "✓ Images built"

# 3. Import images into k3s containerd
echo "Importing images into k3s..."
for svc in auth-service api-gateway platform-service store-service catalog-service order-service storefront-service; do
  docker save ecom-$svc | sudo k3s ctr images import - 2>/dev/null && echo "  ✓ $svc" &
done
wait
echo "✓ Images imported"

# 4. Create namespace
sudo kubectl create namespace $NS 2>/dev/null || echo "Namespace $NS already exists"

# 5. Create postgres + redis as deployments (simpler than StatefulSet for Pi)
sudo kubectl apply -n $NS -f - <<'YAML'
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-pvc
spec:
  accessModes: [ReadWriteOnce]
  resources:
    requests:
      storage: 5Gi
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: postgres
spec:
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
        - name: postgres
          image: postgres:16-alpine
          env:
            - name: POSTGRES_USER
              value: ecom
            - name: POSTGRES_PASSWORD
              value: ecom_prod_2026
            - name: POSTGRES_DB
              value: ecom
          ports:
            - containerPort: 5432
          volumeMounts:
            - name: data
              mountPath: /var/lib/postgresql/data
      volumes:
        - name: data
          persistentVolumeClaim:
            claimName: postgres-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: postgres
spec:
  selector:
    app: postgres
  ports:
    - port: 5432
      targetPort: 5432
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: redis
spec:
  replicas: 1
  selector:
    matchLabels:
      app: redis
  template:
    metadata:
      labels:
        app: redis
    spec:
      containers:
        - name: redis
          image: redis:7-alpine
          ports:
            - containerPort: 6379
---
apiVersion: v1
kind: Service
metadata:
  name: redis
spec:
  selector:
    app: redis
  ports:
    - port: 6379
      targetPort: 6379
YAML
echo "✓ Postgres + Redis deployed"

# 6. Wait for postgres
echo "Waiting for postgres..."
sudo kubectl wait deployment/postgres -n $NS --for=condition=Available --timeout=120s

# 7. Deploy backend services
DB_URL="postgresql://ecom:ecom_prod_2026@postgres:5432/ecom"
JWT_SECRET="ecom_jwt_$(openssl rand -hex 16)"
JWT_REFRESH="ecom_refresh_$(openssl rand -hex 16)"

for svc in auth-service:3001 platform-service:3002 store-service:3003 catalog-service:3004 order-service:3005 storefront-service:3006 api-gateway:4000; do
  name="${svc%%:*}"
  port="${svc##*:}"

  EXTRA_ENV=""
  if [ "$name" = "order-service" ]; then
    EXTRA_ENV='- name: REDIS_URL
              value: redis://redis:6379'
  fi
  if [ "$name" = "api-gateway" ]; then
    EXTRA_ENV='- name: AUTH_SERVICE_URL
              value: http://auth-service:3001
            - name: PLATFORM_SERVICE_URL
              value: http://platform-service:3002
            - name: STORE_SERVICE_URL
              value: http://store-service:3003
            - name: CATALOG_SERVICE_URL
              value: http://catalog-service:3004
            - name: ORDER_SERVICE_URL
              value: http://order-service:3005
            - name: STOREFRONT_SERVICE_URL
              value: http://storefront-service:3006'
  fi

sudo kubectl apply -n $NS -f - <<YAML
apiVersion: apps/v1
kind: Deployment
metadata:
  name: $name
spec:
  replicas: 1
  selector:
    matchLabels:
      app: $name
  template:
    metadata:
      labels:
        app: $name
    spec:
      containers:
        - name: $name
          image: docker.io/library/ecom-$name:latest
          imagePullPolicy: Never
          ports:
            - containerPort: $port
          env:
            - name: PORT
              value: "$port"
            - name: DATABASE_URL
              value: "$DB_URL"
            - name: JWT_SECRET
              value: "$JWT_SECRET"
            - name: JWT_REFRESH_SECRET
              value: "$JWT_REFRESH"
            $EXTRA_ENV
---
apiVersion: v1
kind: Service
metadata:
  name: $name
spec:
  selector:
    app: $name
  ports:
    - port: $port
      targetPort: $port
YAML
  echo "  ✓ $name"
done
echo "✓ Backend services deployed"

# 8. Deploy frontend services
for app in platform-ui:3100 storefront:3200; do
  name="${app%%:*}"
  port="${app##*:}"
sudo kubectl apply -n $NS -f - <<YAML
apiVersion: apps/v1
kind: Deployment
metadata:
  name: $name
spec:
  replicas: 1
  selector:
    matchLabels:
      app: $name
  template:
    metadata:
      labels:
        app: $name
    spec:
      containers:
        - name: $name
          image: docker.io/library/ecom-$name:latest
          imagePullPolicy: Never
          ports:
            - containerPort: $port
          env:
            - name: NEXT_PUBLIC_API_URL
              value: http://$PI_IP:30400/api
            - name: NEXT_PUBLIC_STORE_SUBDOMAIN
              value: demoshop.ecom.app
---
apiVersion: v1
kind: Service
metadata:
  name: $name
spec:
  type: NodePort
  selector:
    app: $name
  ports:
    - port: $port
      targetPort: $port
      nodePort: $([ "$port" = "3100" ] && echo "30110" || echo "32200")
YAML
  echo "  ✓ $name"
done

# 9. Expose api-gateway via NodePort
sudo kubectl apply -n $NS -f - <<'YAML'
apiVersion: v1
kind: Service
metadata:
  name: api-gateway-ext
spec:
  type: NodePort
  selector:
    app: api-gateway
  ports:
    - port: 4000
      targetPort: 4000
      nodePort: 30400
YAML

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║          ecom deployed on k3s!               ║"
echo "╠══════════════════════════════════════════════╣"
echo "║  Admin Dashboard  → http://$PI_IP:30110      ║"
echo "║  Customer Store   → http://$PI_IP:32200      ║"
echo "║  API Gateway      → http://$PI_IP:30400      ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
echo "NOTE: After first boot, run DB migrations:"
echo "  sudo kubectl exec -n ecom deployment/auth-service -- npx prisma db push"
echo "  (and same for other services)"
