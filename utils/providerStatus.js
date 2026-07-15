const statusMap = new Map();

export function updateProviderStatus(providerId, patch) {
  const current = statusMap.get(providerId) || {
    id: providerId,
    status: 'idle',
    totalProducts: 0,
    lastAdded: 0,
    lastChanged: 0,
    lastRemoved: 0,
    lastError: null,
    lastPolledAt: null,
  };

  statusMap.set(providerId, { ...current, ...patch, lastPolledAt: new Date().toISOString() });
}

export function getAllProviderStatuses(activeProviderIds = null) {
  const all = Array.from(statusMap.values());

  if (!activeProviderIds) return all;

  const activeSet = new Set(activeProviderIds.map(id => id.toUpperCase()));
  return all.filter(p => activeSet.has(p.id.toUpperCase()));
}