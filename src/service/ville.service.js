import models from "../models/index.js";

const { Ville, Zone, Partenaire } = models;

export const listVilles = async (partenaireId) => {
  const partenaire = await Partenaire.findByPk(partenaireId);
  if (!partenaire) return null;

  return Ville.findAll({
    where: { partenaireId },
    include: [{ model: Zone, as: "zones" }],
    order: [["name", "ASC"]],
  });
};

export const getVilleById = async (partenaireId, villeId) => {
  return Ville.findOne({
    where: { id: villeId, partenaireId },
    include: [{ model: Zone, as: "zones" }],
  });
};

export const createVille = async (partenaireId, data) => {
  const partenaire = await Partenaire.findByPk(partenaireId);
  if (!partenaire) return null;

  const { name, status } = data;
  return Ville.create({
    name,
    partenaireId,
    status: status || "actif",
  });
};

export const updateVille = async (partenaireId, villeId, data) => {
  const ville = await Ville.findOne({ where: { id: villeId, partenaireId } });
  if (!ville) return null;

  const { name } = data;
  return ville.update({ name });
};

export const toggleVilleActive = async (partenaireId, villeId) => {
  const ville = await Ville.findOne({ where: { id: villeId, partenaireId } });
  if (!ville) return null;

  ville.status = ville.status === "actif" ? "inactif" : "actif";
  await ville.save();

  return ville;
};

export const deleteVille = async (partenaireId, villeId) => {
  const ville = await Ville.findOne({
    where: { id: villeId, partenaireId },
    include: [{ model: Zone, as: 'zones' }],
  });
  if (!ville) return false;

  await Zone.destroy({ where: { villeId: ville.id }, force: true });
  await ville.destroy({ force: true });

  return true;
};

export default {
  listVilles,
  getVilleById,
  createVille,
  updateVille,
  toggleVilleActive,
  deleteVille,
};