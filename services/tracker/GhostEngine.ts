// services/tracker/GhostEngine.ts

export const GhostEngine = {
  /**
   * Finds where the Ghost should be based on the current race time.
   * @param ghostPath - The array of saved {lat, lng, timestamp} from the previous run.
   * @param elapsedSeconds - How many seconds have passed in the current race.
   */
  getGhostPosition: (ghostPath: any[], elapsedSeconds: number) => {
    if (!ghostPath || ghostPath.length === 0) return null;

    // 1. Find the two points in the recording that "sandwich" our current time
    const nextPointIndex = ghostPath.findIndex(p => p.timestamp >= elapsedSeconds);

    // If the race has outlasted the ghost recording, the ghost stays at the finish line
    if (nextPointIndex === -1) return ghostPath[ghostPath.length - 1];
    if (nextPointIndex === 0) return ghostPath[0];

    const pointA = ghostPath[nextPointIndex - 1];
    const pointB = ghostPath[nextPointIndex];

    // 2. Linear Interpolation (Math to make the Ghost glide smoothly between points)
    const timeDiff = pointB.timestamp - pointA.timestamp;
    const progress = (elapsedSeconds - pointA.timestamp) / timeDiff;

    return {
      latitude: pointA.latitude + (pointB.latitude - pointA.latitude) * progress,
      longitude: pointA.longitude + (pointB.longitude - pointA.longitude) * progress,
      isGhost: true
    };
  },

  /**
   * Calculates the distance (Time Delta) between Player and Ghost
   * Returns positive if Player is leading, negative if Ghost is leading.
   */
  calculateTimeDelta: (playerDist: number, ghostDist: number) => {
    // This will eventually be used for the HUD (e.g., "-00:12")
    return playerDist - ghostDist;
  }
};