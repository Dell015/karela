// This is the blueprint for a single moment in a race.
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
