// This is the bnlueprint for a single moment in a race.
export interface GhostPoint {
    latitude: number;           // Where you are (North/South)
    longitude:  number;        // Where you are (East/West)
    timestamp: number;          // Exactly when you were there
    distanceFromStart: number;  // How many meters you have traveled so far
 }