-- CreateTable
CREATE TABLE "contacts" (
    "id" TEXT NOT NULL,
    "hastaneAdi" TEXT NOT NULL,
    "il" TEXT NOT NULL,
    "hastaneTuru" TEXT NOT NULL,
    "altTur" TEXT,
    "telefonDoktor" TEXT,
    "telefonSatinalma" TEXT,
    "telefonBiyomedikal" TEXT,
    "mailDoktor" TEXT,
    "mailSatinalma" TEXT,
    "mailBiyomedikal" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "raw_datas" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "list_name" TEXT NOT NULL,
    "short_url" TEXT,
    "full_url" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "raw_datas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "contacts_hastaneAdi_key" ON "contacts"("hastaneAdi");
