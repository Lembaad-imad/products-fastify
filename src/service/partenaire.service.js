import models from "../models/index.js";

const { Partenaire, Ville, Zone } = models;

export const listPartenaires = async () => {
  return Partenaire.findAll({
    include: [
      {
        model: Ville,
        as: "villes",
        include: [{ model: Zone, as: "zones" }],
      },
    ],
    order: [["name", "ASC"]],
  });
};

export const getPartenaireById = async (id) => {
  return Partenaire.findByPk(id, {
    include: [
      {
        model: Ville,
        as: "villes",
        include: [{ model: Zone, as: "zones" }],
      },
    ],
  });
};
export const togglePartenaireActive = async (id) => {
  const partenaire = await Partenaire.findByPk(id);
  if (!partenaire) return null;

  partenaire.status = partenaire.status === "actif" ? "inactif" : "actif";
  await partenaire.save();

  return partenaire;
};

export const createPartenaire = async (data) => {
  const { name, contact, email, phone, status } = data;
  return Partenaire.create({
    name,
    contact,
    email,
    phone,
    status: status || 'actif',
  });
};

export const updatePartenaire = async (id, data) => {
  const partenaire = await Partenaire.findByPk(id);
  if (!partenaire) return null;

  const { name, contact, email, phone } = data;
  return partenaire.update({ name, contact, email, phone });
};

export const deletePartenaire = async (id) => {
  const partenaire = await Partenaire.findByPk(id, {
    include: [{ model: Ville, as: 'villes', include: [{ model: Zone, as: 'zones' }] }],
  });
  if (!partenaire) return false;

  for (const ville of partenaire.villes) {
    await Zone.destroy({ where: { villeId: ville.id }, force: true });
  }
  await Ville.destroy({ where: { partenaireId: partenaire.id }, force: true });
  await partenaire.destroy({ force: true });

  return true;
};