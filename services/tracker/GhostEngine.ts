// GhostEngine.ts

/**
 * 1. DATA MODELS
 * These interfaces define exactly what a "Ghost Point" and a "Race Result" look like.
 */
export interface GhostPoint {
    latitude: number;           // The GPS latitude recorded
    longitude: number;          // The GPS longitude recorded
    timestamp: number;          // When the point was recorded (ms)
    distanceFromStart: number;  // Cumulative distance from the start line (meters)
}

export interface RaceComparison {
    distanceGap: number;        // How many meters separate the user and the ghost
    status: "ahead" | "behind" | "finished"; // Visual indicator for the UI
    ghostCurrentLat: number;    // The calculated (interpolated) latitude of the ghost
    ghostCurrentLon: number;    // The calculated (interpolated) longitude of the ghost
}

/**
 * 2. THE COMPARE ENGINE
 * This is the "Brain" that calculates the ghost's position in real-time.
 */
export const compareToGhost = (
    userDistance: number,     // How far the user has run (meters)
    ghostPath: GhostPoint[]   // The array of points from the ghost's previous run
): RaceComparison => {
    
    // SAFETY CHECK: If there is no ghost data, we cannot race against it.
    if (ghostPath.length === 0) {
        throw new Error("Ghost path is empty. Ensure data is loaded before comparing.");
    }

    // A. FIND THE SEGMENT
    // We look for the index of the first point in the ghost's path that is 
    // further than the user's current distance. This tells us which "gap" the user is in.
    const nextPointIndex = ghostPath.findIndex(p => p.distanceFromStart > userDistance);

    // B. BOUNDARY CASE: THE START
    // If nextPointIndex is 0, the user hasn't even reached the ghost's first recorded point.
    if (nextPointIndex === 0) {
        return {
            distanceGap: ghostPath[0].distanceFromStart - userDistance,
            status: "behind",
            ghostCurrentLat: ghostPath[0].latitude,
            ghostCurrentLon: ghostPath[0].longitude
        };
    }

    // C. BOUNDARY CASE: THE FINISH
    // If findIndex returns -1, it means no points are ahead of the user. The user has finished!
    if (nextPointIndex === -1) {
        const lastPoint = ghostPath[ghostPath.length - 1];
        return {
            distanceGap: userDistance - lastPoint.distanceFromStart,
            status: "finished",
            ghostCurrentLat: lastPoint.latitude,
            ghostCurrentLon: lastPoint.longitude
        };
    }

    // D. LINEAR INTERPOLATION (The "Smooth Slider")
    // To avoid the ghost icon "teleporting," we find the points immediately behind (A) 
    // and immediately ahead (B) of the user's current position.
    const pointA = ghostPath[nextPointIndex - 1]; 
    const pointB = ghostPath[nextPointIndex];     

    // Calculate the percentage of progress the user has made between Point A and Point B.
    const segmentTotalDist = pointB.distanceFromStart - pointA.distanceFromStart;
    const progressInSegment = (userDistance - pointA.distanceFromStart) / segmentTotalDist;

    // We use that percentage to find the exact Latitude/Longitude between A and B.
    // Formula: StartValue + (Difference * ProgressPercentage)
    const interpolatedLat = pointA.latitude + (pointB.latitude - pointA.latitude) * progressInSegment;
    const interpolatedLon = pointA.longitude + (pointB.longitude - pointA.longitude) * progressInSegment;

    // E. CALCULATE THE GAP
    // We determine where the ghost "should be" on the map based on the interpolation.
    const ghostProgressDistance = pointA.distanceFromStart + (segmentTotalDist * progressInSegment);
    
    // If distDiff is positive, user is winning. If negative, user is losing.
    const distDiff = userDistance - ghostProgressDistance;

    return {
        distanceGap: Math.abs(distDiff), // We return the absolute number (always positive)
        status: distDiff >= 0 ? "ahead" : "behind",
        ghostCurrentLat: interpolatedLat,
        ghostCurrentLon: interpolatedLon
    };
};