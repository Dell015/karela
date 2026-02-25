export const GhostEngine = {
  getGhostPosition: (data: any[], elapsedSeconds: number) => {
    if (!data || data.length === 0) return null;

    // Find the segment the ghost is currently in
    const nextPointIndex = data.findIndex((p) => p.timestamp > elapsedSeconds);
    
    if (nextPointIndex === -1) return data[data.length - 1];
    if (nextPointIndex === 0) return data[0];

    const prevPoint = data[nextPointIndex - 1];
    const nextPoint = data[nextPointIndex];

    // Linear Interpolation (LERP) ratio
    const duration = nextPoint.timestamp - prevPoint.timestamp;
    const progress = elapsedSeconds - prevPoint.timestamp;
    const ratio = progress / duration;

    return {
      latitude: prevPoint.latitude + (nextPoint.latitude - prevPoint.latitude) * ratio,
      longitude: prevPoint.longitude + (nextPoint.longitude - prevPoint.longitude) * ratio,
    };
  },
};