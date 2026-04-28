export const GhostEngine = {
  /**
   * @param data The array of saved ghost points (must have timestamps)
   * @param userElapsedMs How many ms have passed since the CURRENT user started
   */
  getGhostPosition: (data: any[], userElapsedMs: number) => {
    if (!data || data.length === 0) return null;

    // 1. Define the Ghost's start time from its own data
    const ghostStartTime = Number(data[0].timestamp);
    
    // 2. The target time we are looking for in the ghost's timeline
    const targetInGhostTimeline = ghostStartTime + userElapsedMs;

    // 3. Find where the ghost should be at this relative time
    const nextPointIndex = data.findIndex((p) => Number(p.timestamp) > targetInGhostTimeline);

    // If time is past the ghost's total run duration, stay at finish
    if (nextPointIndex === -1) return data[data.length - 1];
    
    // If we haven't reached the first point's relative time yet
    if (nextPointIndex === 0) return data[0];

    const prevPoint = data[nextPointIndex - 1];
    const nextPoint = data[nextPointIndex];

    // 4. LERP (Linear Interpolation) for smooth movement between recorded points
    const segmentDuration = Number(nextPoint.timestamp) - Number(prevPoint.timestamp);
    const timeIntoSegment = targetInGhostTimeline - Number(prevPoint.timestamp);

    const ratio = segmentDuration > 0 ? timeIntoSegment / segmentDuration : 0;

    return {
      latitude: prevPoint.latitude + (nextPoint.latitude - prevPoint.latitude) * ratio,
      longitude: prevPoint.longitude + (nextPoint.longitude - prevPoint.longitude) * ratio,
    };
  },
};