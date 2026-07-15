import * as partenaireService from "../service/partenaire.service.js";

export const listPartenaires = async (request, reply) => {
  const partenaires = await partenaireService.listPartenaires();
  return reply.send(partenaires);
};

export const getPartenaire = async (request, reply) => {
  const { partenaireId } = request.params;

  const partenaire = await partenaireService.getPartenaireById(partenaireId);
  if (!partenaire) {
    return reply.code(404).send({ error: "Partenaire not found" });
  }

  return reply.send(partenaire);
};

export const createPartenaire = async (request, reply) => {
  const { name } = request.body || {};
  if (!name) {
    return reply.code(400).send({ error: "name is required" });
  }

  try {
    const partenaire = await partenaireService.createPartenaire(request.body);
    return reply.code(201).send(partenaire);
  } catch (err) {
    request.log.error(err);
    return reply.code(400).send({ error: err.message });
  }
};

export const updatePartenaire = async (request, reply) => {
  const { partenaireId } = request.params;

  try {
    const partenaire = await partenaireService.updatePartenaire(
      partenaireId,
      request.body
    );
    if (!partenaire) {
      return reply.code(404).send({ error: "Partenaire not found" });
    }
    return reply.send(partenaire);
  } catch (err) {
    request.log.error(err);
    return reply.code(400).send({ error: err.message });
  }
};

export const togglePartenaire = async (request, reply) => {
  const { partenaireId } = request.params;

  try {
    const partenaire = await partenaireService.togglePartenaireActive(partenaireId);
    if (!partenaire) {
      return reply.code(404).send({ error: "Partenaire not found" });
    }
    return reply.send(partenaire);
  } catch (err) {
    request.log.error(err);
    return reply.code(400).send({ error: err.message });
  }
};

export const deletePartenaire = async (request, reply) => {
  const { partenaireId } = request.params;

  const deleted = await partenaireService.deletePartenaire(partenaireId);
  if (!deleted) {
    return reply.code(404).send({ error: "Partenaire not found" });
  }

  return reply.code(204).send();
};

export default {
  listPartenaires,
  getPartenaire,
  createPartenaire,
  updatePartenaire,
  togglePartenaire,
  deletePartenaire,
};