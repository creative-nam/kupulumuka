-- CreateEnum
CREATE TYPE "CapacityStatus" AS ENUM ('AVAILABLE', 'NEARLY_FULL', 'FULL');

-- CreateEnum
CREATE TYPE "ShelterTier" AS ENUM ('OFFICIAL', 'COMMUNITY');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('CITIZEN', 'ADMIN');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('UNVERIFIED', 'PENDING', 'VERIFIED');

-- CreateTable
CREATE TABLE "Provincia" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Provincia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Distrito" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "provinciaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Distrito_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bairro" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "distritoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bairro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quarteirao" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "bairroId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quarteirao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BairroVizinho" (
    "bairroAId" TEXT NOT NULL,
    "bairroBId" TEXT NOT NULL,

    CONSTRAINT "BairroVizinho_pkey" PRIMARY KEY ("bairroAId","bairroBId")
);

-- CreateTable
CREATE TABLE "Shelter" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tier" "ShelterTier" NOT NULL,
    "capacityStatus" "CapacityStatus" NOT NULL,
    "routeDescription" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "photoUrl" TEXT,
    "uploadedById" TEXT,
    "quarteiraoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shelter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "role" "UserRole" NOT NULL,
    "verificationStatus" "VerificationStatus" NOT NULL,
    "homeQuarteiraoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Distrito" ADD CONSTRAINT "Distrito_provinciaId_fkey" FOREIGN KEY ("provinciaId") REFERENCES "Provincia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bairro" ADD CONSTRAINT "Bairro_distritoId_fkey" FOREIGN KEY ("distritoId") REFERENCES "Distrito"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quarteirao" ADD CONSTRAINT "Quarteirao_bairroId_fkey" FOREIGN KEY ("bairroId") REFERENCES "Bairro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BairroVizinho" ADD CONSTRAINT "BairroVizinho_bairroAId_fkey" FOREIGN KEY ("bairroAId") REFERENCES "Bairro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BairroVizinho" ADD CONSTRAINT "BairroVizinho_bairroBId_fkey" FOREIGN KEY ("bairroBId") REFERENCES "Bairro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shelter" ADD CONSTRAINT "Shelter_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shelter" ADD CONSTRAINT "Shelter_quarteiraoId_fkey" FOREIGN KEY ("quarteiraoId") REFERENCES "Quarteirao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_homeQuarteiraoId_fkey" FOREIGN KEY ("homeQuarteiraoId") REFERENCES "Quarteirao"("id") ON DELETE SET NULL ON UPDATE CASCADE;
