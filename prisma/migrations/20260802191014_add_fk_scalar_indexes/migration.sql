-- CreateIndex
CREATE INDEX "Bairro_distritoId_idx" ON "Bairro"("distritoId");

-- CreateIndex
CREATE INDEX "BairroVizinho_bairroBId_idx" ON "BairroVizinho"("bairroBId");

-- CreateIndex
CREATE INDEX "Distrito_provinciaId_idx" ON "Distrito"("provinciaId");

-- CreateIndex
CREATE INDEX "Quarteirao_bairroId_idx" ON "Quarteirao"("bairroId");

-- CreateIndex
CREATE INDEX "Shelter_quarteiraoId_idx" ON "Shelter"("quarteiraoId");

-- CreateIndex
CREATE INDEX "Shelter_uploadedById_idx" ON "Shelter"("uploadedById");
