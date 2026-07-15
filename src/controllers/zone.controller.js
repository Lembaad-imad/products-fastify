import * as zoneService from "../service/zone.service.js";

export const listZones = async (request, reply) => {
  const { partenaireId, villeId } = request.params;

  const zones = await zoneService.listZones(partenaireId, villeId);
  if (zones === null) {
    return reply.code(404).send({ error: "Partenaire or Ville not found" });
  }

  return reply.send(zones);
};

export const getZone = async (request, reply) => {
  const { partenaireId, villeId, zoneId } = request.params;

  const zone = await zoneService.getZoneById(partenaireId, villeId, zoneId);
  if (!zone) {
    return reply.code(404).send({ error: "Zone not found" });
  }

  return reply.send(zone);
};

export const createZone = async (request, reply) => {
  const { partenaireId, villeId } = request.params;
  const { name } = request.body || {};

  if (!name) {
    return reply.code(400).send({ error: "name is required" });
  }

  try {
    const zone = await zoneService.createZone(partenaireId, villeId, request.body);
    if (zone === null) {
      return reply.code(404).send({ error: "Partenaire or Ville not found" });
    }
    return reply.code(201).send(zone);
  } catch (err) {
    request.log.error(err);
    return reply.code(400).send({ error: err.message });
  }
};

export const updateZone = async (request, reply) => {
  const { partenaireId, villeId, zoneId } = request.params;

  try {
    const zone = await zoneService.updateZone(partenaireId, villeId, zoneId, request.body);
    if (!zone) {
      return reply.code(404).send({ error: "Zone not found" });
    }
    return reply.send(zone);
  } catch (err) {
    request.log.error(err);
    return reply.code(400).send({ error: err.message });
  }
};

export const toggleZone = async (request, reply) => {
  const { partenaireId, villeId, zoneId } = request.params;

  try {
    const zone = await zoneService.toggleZoneActive(partenaireId, villeId, zoneId);
    if (!zone) {
      return reply.code(404).send({ error: "Zone not found" });
    }
    return reply.send(zone);
  } catch (err) {
    request.log.error(err);
    return reply.code(400).send({ error: err.message });
  }
};

export const deleteZone = async (request, reply) => {
  const { partenaireId, villeId, zoneId } = request.params;

  const deleted = await zoneService.deleteZone(partenaireId, villeId, zoneId);
  if (!deleted) {
    return reply.code(404).send({ error: "Zone not found" });
  }

  return reply.code(204).send();
};

export default {
  listZones,
  getZone,
  createZone,
  updateZone,
  toggleZone,
  deleteZone,
};