import models from "../models/index.js";

const { Zone, Ville } = models;

export const listZones = async (partenaireId, villeId) => {
  const ville = await Ville.findOne({ where: { id: villeId, partenaireId } });
  if (!ville) return null;

  return Zone.findAll({
    where: { villeId },
    order: [["name", "ASC"]],
  });
};

export const getZoneById = async (partenaireId, villeId, zoneId) => {
  const ville = await Ville.findOne({ where: { id: villeId, partenaireId } });
  if (!ville) return null;

  return Zone.findOne({ where: { id: zoneId, villeId } });
};

export const createZone = async (partenaireId, villeId, data) => {
  const ville = await Ville.findOne({ where: { id: villeId, partenaireId } });
  if (!ville) return null;

  const { name, endpoint, status, integrationType, productType } = data;
  return Zone.create({
    name,
    endpoint,
    villeId,
    status: status || "actif",
    integrationType: integrationType || "api",
    productType,
  });
};

export const updateZone = async (partenaireId, villeId, zoneId, data) => {
  const ville = await Ville.findOne({ where: { id: villeId, partenaireId } });
  if (!ville) return null;

  const zone = await Zone.findOne({ where: { id: zoneId, villeId } });
  if (!zone) return null;

  // endpoint is intentionally excluded here — the frontend edit form
  // disables that field and never sends it, per its own UI note.
  const { name, integrationType, productType } = data;
  return zone.update({ name, integrationType, productType });
};

export const toggleZoneActive = async (partenaireId, villeId, zoneId) => {
  const ville = await Ville.findOne({ where: { id: villeId, partenaireId } });
  if (!ville) return null;

  const zone = await Zone.findOne({ where: { id: zoneId, villeId } });
  if (!zone) return null;

  zone.status = zone.status === "actif" ? "inactif" : "actif";
  await zone.save();

  return zone;
};

export const deleteZone = async (partenaireId, villeId, zoneId) => {
  const ville = await Ville.findOne({ where: { id: villeId, partenaireId } });
  if (!ville) return false;

  const zone = await Zone.findOne({ where: { id: zoneId, villeId } });
  if (!zone) return false;

  await zone.destroy({ force: true });
  return true;
};

export default {
  listZones,
  getZoneById,
  createZone,
  updateZone,
  toggleZoneActive,
  deleteZone,
};