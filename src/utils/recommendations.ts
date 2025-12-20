import type { Place } from "./api";



/**
 * Extended interface with pre-parsed data to avoid repeated string splitting.
 * Kept for specific UI compatibility.
 */
export interface ProcessedPlace extends Place {
    /** Set of visitor IDs for O(1) lookups */
    visitorSet: Set<string>;
    /** Total number of visitors */
    visitorCount: number;
    /** Array of visitor IDs */
    visitors: string[];
}

/**
 * Tracks similarity between a recommended shop and a shop the user visited.
 * Kept for interface compatibility but will likely be empty.
 */
export interface SimilarShop {
    visitedId: string;
    visitedName: string;
    /** Similarity score between 0 and 1 */
    similarity: number;
}

/**
 * Helper interface for recommendation with score and explanation.
 */
export interface RecommendedPlace extends ProcessedPlace {
    /** Combined Collaborative Filtering score - effectively 0 or random now */
    cfScore: number;
    /** List of visited shops that contributed to this recommendation */
    similarTo: SimilarShop[];
}

/**
 * Pre-process places to parse visitor strings once.
 * Converts comma-separated visitor strings into Sets and Arrays.
 */
export function preprocessPlaces(places: Place[]): ProcessedPlace[] {
    return places.map(place => {
        const visitors = place.recent_visitors
            ? place.recent_visitors.split(',').map(v => v.trim()).filter(v => v)
            : [];
        return {
            ...place,
            visitorSet: new Set(visitors),
            visitorCount: visitors.length,
            visitors: visitors
        };
    });
}

/**
 * Simple random recommendation since we lack user data for CF.
 * Returns a shuffled list of unvisited shops.
 */
export function getRecommendations(allShops: ProcessedPlace[], visitedShops: string[]): (ProcessedPlace | RecommendedPlace)[] {
    const visitedSet = new Set(visitedShops);
    
    // Filter out visited shops
    const candidates = allShops.filter(shop => !visitedSet.has(shop.place_id));

    // Fisher-Yates Shuffle
    for (let i = candidates.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }

    // Return top N
    return candidates.slice(0, 10).map(start => ({
        ...start,
        cfScore: 0,
        similarTo: []
    }));
}

