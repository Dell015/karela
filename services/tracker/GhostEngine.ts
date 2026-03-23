export const GhostEngine = {
  getGhostPosition: (data: any[], currentTime: number) => {
    if (!data || data.length === 0) return null;

    // 1. Check if we are using absolute timestamps (like 1711...) 
    // or relative seconds (like 0, 1, 2...). 
    // We normalize everything to the first point's time.
    const startTime = data[0].timestamp;
    
    // 2. Find where the ghost should be right now
    const nextPointIndex = data.findIndex((p) => p.timestamp > currentTime);
    
    // If the time has passed the last recorded point, ghost stays at the finish line
    if (nextPointIndex === -1) return data[data.length - 1];
    
    // If we haven't even reached the first point yet, ghost stays at the start
    if (nextPointIndex === 0) return data[0];

    const prevPoint = data[nextPointIndex - 1];
    const nextPoint = data[nextPointIndex];

    // 3. Linear Interpolation (LERP) logic
    const segmentDuration = nextPoint.timestamp - prevPoint.timestamp;
    const timeIntoSegment = currentTime - prevPoint.timestamp;
    
    // Prevent division by zero if two points have the same timestamp
    const ratio = segmentDuration > 0 ? timeIntoSegment / segmentDuration : 0;

    return {
      latitude: prevPoint.latitude + (nextPoint.latitude - prevPoint.latitude) * ratio,
      longitude: prevPoint.longitude + (nextPoint.longitude - prevPoint.longitude) * ratio,
    };
  },
};