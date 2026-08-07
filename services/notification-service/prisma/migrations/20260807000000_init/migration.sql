-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "notif_svc";

-- CreateEnum
CREATE TYPE "notif_svc"."WaProvider" AS ENUM ('TWILIO', 'META');

-- CreateEnum
CREATE TYPE "notif_svc"."NotifChannel" AS ENUM ('EMAIL', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "notif_svc"."NotifStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- CreateTable
CREATE TABLE "notif_svc"."NotificationConfig" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "smtpHost" TEXT,
    "smtpPort" INTEGER,
    "smtpUser" TEXT,
    "smtpPassword" TEXT,
    "smtpFrom" TEXT,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT false,
    "waProvider" "notif_svc"."WaProvider",
    "waApiKey" TEXT,
    "waPhoneId" TEXT,
    "waEnabled" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notif_svc"."NotificationLog" (
    "id" TEXT NOT NULL,
    "storeId" TEXT,
    "channel" "notif_svc"."NotifChannel" NOT NULL,
    "event" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "status" "notif_svc"."NotifStatus" NOT NULL DEFAULT 'PENDING',
    "error" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationLog_pkey" PRIMARY KEY ("id")
);
