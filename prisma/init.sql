-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ADMIN', 'OPTOMETRISTA', 'RECEPCIONISTA');

-- CreateEnum
CREATE TYPE "SeccionMedicion" AS ENUM ('LENTES_USO', 'RETINOSCOPIA', 'RECETA_FINAL');

-- CreateEnum
CREATE TYPE "Ojo" AS ENUM ('OD', 'OI');

-- CreateTable
CREATE TABLE "Paciente" (
    "id" TEXT NOT NULL,
    "cedula" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "fechaNacimiento" TIMESTAMP(3) NOT NULL,
    "telefono" TEXT,
    "direccion" TEXT,
    "ocupacion" TEXT,
    "email" TEXT,
    "createdById" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Paciente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FichaExamen" (
    "id" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "edadSnapshot" INTEGER,
    "ultimoExamenVisual" TEXT,
    "realizadoById" TEXT NOT NULL,
    "motivoControl" BOOLEAN NOT NULL DEFAULT false,
    "motivoNoVeLejos" BOOLEAN NOT NULL DEFAULT false,
    "motivoNoVeCerca" BOOLEAN NOT NULL DEFAULT false,
    "motivoCefalea" BOOLEAN NOT NULL DEFAULT false,
    "motivoHiperemia" BOOLEAN NOT NULL DEFAULT false,
    "motivoOtros" TEXT,
    "pterigiumOD" TEXT,
    "pterigiumOI" TEXT,
    "pingueculaOD" TEXT,
    "pingueculaOI" TEXT,
    "hiperemia" BOOLEAN NOT NULL DEFAULT false,
    "resequedad" BOOLEAN NOT NULL DEFAULT false,
    "secrecion" BOOLEAN NOT NULL DEFAULT false,
    "examenExternoOtros" TEXT,
    "antDiabetes" BOOLEAN NOT NULL DEFAULT false,
    "antHipertension" BOOLEAN NOT NULL DEFAULT false,
    "antGlaucoma" BOOLEAN NOT NULL DEFAULT false,
    "antCirugia" BOOLEAN NOT NULL DEFAULT false,
    "lentesDesde" INTEGER,
    "antecedentesOtros" TEXT,
    "oftalmoscopia" TEXT,
    "queratometria" TEXT,
    "otros" TEXT,
    "proximoControl" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FichaExamen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Medicion" (
    "id" TEXT NOT NULL,
    "fichaId" TEXT NOT NULL,
    "seccion" "SeccionMedicion" NOT NULL,
    "ojo" "Ojo" NOT NULL,
    "esfera" TEXT,
    "cilindro" TEXT,
    "eje" TEXT,
    "adicion" TEXT,
    "av" TEXT,
    "avSinLentes" TEXT,
    "avConLentes" TEXT,
    "binocular" TEXT,
    "dp" TEXT,

    CONSTRAINT "Medicion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#3B82F6',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PacienteTag" (
    "pacienteId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "PacienteTag_pkey" PRIMARY KEY ("pacienteId","tagId")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accion" TEXT NOT NULL,
    "entidad" TEXT NOT NULL,
    "entidadId" TEXT,
    "fichaId" TEXT,
    "cambios" JSONB,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Paciente_cedula_key" ON "Paciente"("cedula");

-- CreateIndex
CREATE INDEX "Paciente_cedula_idx" ON "Paciente"("cedula");

-- CreateIndex
CREATE INDEX "Paciente_nombre_apellido_idx" ON "Paciente"("nombre", "apellido");

-- CreateIndex
CREATE INDEX "Paciente_deletedAt_idx" ON "Paciente"("deletedAt");

-- CreateIndex
CREATE INDEX "FichaExamen_pacienteId_idx" ON "FichaExamen"("pacienteId");

-- CreateIndex
CREATE INDEX "FichaExamen_fecha_idx" ON "FichaExamen"("fecha");

-- CreateIndex
CREATE INDEX "FichaExamen_proximoControl_idx" ON "FichaExamen"("proximoControl");

-- CreateIndex
CREATE INDEX "Medicion_fichaId_idx" ON "Medicion"("fichaId");

-- CreateIndex
CREATE UNIQUE INDEX "Medicion_fichaId_seccion_ojo_key" ON "Medicion"("fichaId", "seccion", "ojo");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_nombre_key" ON "Tag"("nombre");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_entidad_entidadId_idx" ON "AuditLog"("entidad", "entidadId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "FichaExamen" ADD CONSTRAINT "FichaExamen_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Medicion" ADD CONSTRAINT "Medicion_fichaId_fkey" FOREIGN KEY ("fichaId") REFERENCES "FichaExamen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PacienteTag" ADD CONSTRAINT "PacienteTag_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PacienteTag" ADD CONSTRAINT "PacienteTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_fichaId_fkey" FOREIGN KEY ("fichaId") REFERENCES "FichaExamen"("id") ON DELETE SET NULL ON UPDATE CASCADE;
