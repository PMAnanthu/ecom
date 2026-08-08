-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "payment_svc";

-- CreateEnum
CREATE TYPE "payment_svc"."PaymentType" AS ENUM ('PRODUCT', 'SUBSCRIPTION');

-- CreateEnum
CREATE TYPE "payment_svc"."PaymentStatus" AS ENUM ('CREATED', 'PAID', 'FAILED');

-- CreateTable
CREATE TABLE "payment_svc"."PlatformPaymentConfig" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "razorpayKeyId" TEXT,
    "razorpayKeySecret" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PlatformPaymentConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_svc"."StorePaymentConfig" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "razorpayKeyId" TEXT,
    "razorpayKeySecret" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "StorePaymentConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_svc"."PaymentOrder" (
    "id" TEXT NOT NULL,
    "razorpayOrderId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "type" "payment_svc"."PaymentType" NOT NULL,
    "referenceId" TEXT NOT NULL,
    "storeId" TEXT,
    "userId" TEXT,
    "status" "payment_svc"."PaymentStatus" NOT NULL DEFAULT 'CREATED',
    "razorpayPaymentId" TEXT,
    "razorpaySignature" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PaymentOrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StorePaymentConfig_storeId_key" ON "payment_svc"."StorePaymentConfig"("storeId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentOrder_razorpayOrderId_key" ON "payment_svc"."PaymentOrder"("razorpayOrderId");
