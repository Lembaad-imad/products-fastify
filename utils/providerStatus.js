const statusMap = new Map(); 

export function updateProviderStatus(providerId, patch) {
  const current = statusMap.get(providerId) || {
    id: providerId,
    status: 'idle', // 'idle' | 'ok' | 'error'
    totalProducts: 0,
    lastAdded: 0,
    lastChanged: 0,
    lastRemoved: 0,
    lastError: null,
    lastPolledAt: null,
  };

  statusMap.set(providerId, { ...current, ...patch, lastPolledAt: new Date().toISOString() });
}

export function getAllProviderStatuses() {
  return Array.from(statusMap.values());
}