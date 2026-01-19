// services/tracker/comparison.logic.ts

/**
 * THESIS LOGIC: Mirror Comparison
 * Compares the user's current distance to the ghost's distance
 * at the exact same timestamp.
 */

export const getGhostGap = (
    userDistance: number,
    ghostDistance: number
): {distanceGap: number; status: 'ahead' | 'behind' | 'equal'} => {

    const gap = userDistance - ghostDistance;

    let status: 'ahead' | 'behind' | 'equal' = 'equal';
    if (gap > 0.5) {
        status = 'ahead';
    }
    else if (gap < -0.5) {
        status = 'behind';
    }

    return {
        distanceGap: Math.abs(gap),
        status: status
    }

}