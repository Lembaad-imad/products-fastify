import * as villeService from "../service/ville.service.js";

export const listVilles = async (request, reply) => {
  const { partenaireId } = request.params;

  const villes = await villeService.listVilles(partenaireId);
  if (villes === null) {
    return reply.code(404).send({ error: "Partenaire not found" });
  }

  return reply.send(villes);
};

export const getVille = async (request, reply) => {
  const { partenaireId, villeId } = request.params;

  const ville = await villeService.getVilleById(partenaireId, villeId);
  if (!ville) {
    return reply.code(404).send({ error: "Ville not found" });
  }

  return reply.send(ville);
};

export const createVille = async (request, reply) => {
  const { partenaireId } = request.params;
  const { name } = request.body || {};

  if (!name) {
    return reply.code(400).send({ error: "name is required" });
  }

  try {
    const ville = await villeService.createVille(partenaireId, request.body);
    if (ville === null) {
      return reply.code(404).send({ error: "Partenaire not found" });
    }
    return reply.code(201).send(ville);
  } catch (err) {
    request.log.error(err);
    return reply.code(400).send({ error: err.message });
  }
};

export const updateVille = async (request, reply) => {
  const { partenaireId, villeId } = request.params;

  try {
    const ville = await villeService.updateVille(partenaireId, villeId, request.body);
    if (!ville) {
      return reply.code(404).send({ error: "Ville not found" });
    }
    return reply.send(ville);
  } catch (err) {
    request.log.error(err);
    return reply.code(400).send({ error: err.message });
  }
};

export const toggleVille = async (request, reply) => {
  const { partenaireId, villeId } = request.params;

  try {
    const ville = await villeService.toggleVilleActive(partenaireId, villeId);
    if (!ville) {
      return reply.code(404).send({ error: "Ville not found" });
    }
    return reply.send(ville);
  } catch (err) {
    request.log.error(err);
    return reply.code(400).send({ error: err.message });
  }
};

export const deleteVille = async (request, reply) => {
  const { partenaireId, villeId } = request.params;

  const deleted = await villeService.deleteVille(partenaireId, villeId);
  if (!deleted) {
    return reply.code(404).send({ error: "Ville not found" });
  }

  return reply.code(204).send();
};

export default {
  listVilles,
  getVille,
  createVille,
  updateVille,
  toggleVille,
  deleteVille,
};