import type { Place, PlaceData } from '../types/place';

export type { Place };
export type GluttonyData = PlaceData;

export class FetchError extends Error {
    constructor(public originalError: unknown) {
        super("Failed to fetch gluttony data");
        this.name = "FetchError";
    }
}

// Fetch the data using standard fetch API
export async function fetchAllShops(): Promise<GluttonyData> {
    try {
        const [gluttonyRes, islandRes] = await Promise.all([
            fetch('/byw-mit/gluttony.json'),
            fetch('/byw-mit/island.json')
        ]);

        if (!gluttonyRes.ok) throw new Error(`Failed to fetch gluttony data: ${gluttonyRes.statusText}`);
        if (!islandRes.ok) console.warn(`Failed to fetch island data: ${islandRes.statusText}`);

        const gluttonyData = (await gluttonyRes.json()) as GluttonyData;
        const islandData = islandRes.ok ? (await islandRes.json()) as GluttonyData : { title: "島國", places: [] };

        const placeMap = new Map<string, Place>();
    
        // Helper to add/merge places (later sources override earlier ones)
        const addPlaces = (places: Place[], sourceTitle: string) => {
            places.forEach(p => {
                const key = p.place_id || p.name;
                const placeWithSource = { ...p, source: sourceTitle };
                if (placeMap.has(key)) {
                    placeMap.set(key, { ...placeMap.get(key)!, ...placeWithSource });
                } else {
                    placeMap.set(key, placeWithSource);
                }
            });
        };

        addPlaces(gluttonyData.places, gluttonyData.title);
        addPlaces(islandData.places, islandData.title);

        return {
            title: gluttonyData.title,
            places: Array.from(placeMap.values())
        };
    } catch (error) {
        throw new FetchError(error);
    }
}
