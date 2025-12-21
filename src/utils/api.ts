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
        const [gluttonyRes, islandRes, supportRes, babyRes] = await Promise.all([
            fetch('/byw-mit/lists/gluttony.json'),
            fetch('/byw-mit/lists/island.json'),
            fetch('/byw-mit/lists/support.json'),
            fetch('/byw-mit/lists/baby.json')
        ]);

        if (!gluttonyRes.ok) throw new Error(`Failed to fetch gluttony data: ${gluttonyRes.statusText}`);
        if (!islandRes.ok) console.warn(`Failed to fetch island data: ${islandRes.statusText}`);
        if (!supportRes.ok) console.warn(`Failed to fetch support data: ${supportRes.statusText}`);
        if (!babyRes.ok) console.warn(`Failed to fetch baby data: ${babyRes.statusText}`);

        const gluttonyData = (await gluttonyRes.json()) as GluttonyData;
        const islandData = islandRes.ok ? (await islandRes.json()) as GluttonyData : { title: "島國", places: [] };
        const supportData = supportRes.ok ? (await supportRes.json()) as GluttonyData : { title: "支持", places: [] };
        const babyData = babyRes.ok ? (await babyRes.json()) as GluttonyData : { title: "寶寶", places: [] };

        const placeMap = new Map<string, Place>();
        const coordMap = new Map<string, string>(); // "lat,lng" -> place key (name or ID)
    
        // Helper to add/merge places (later sources override earlier ones)
        const addPlaces = (places: Place[], sourceTitle: string) => {
            places.forEach(p => {
                let key = p.place_id || p.name;
                
                // Try to find existing place by coordinates if available
                if (p.lat && p.lng) {
                    // Use 4 decimal places for approx 11m precision, sufficient for shop deduplication
                    const coordKey = `${Number(p.lat).toFixed(4)},${Number(p.lng).toFixed(4)}`;
                    if (coordMap.has(coordKey)) {
                        key = coordMap.get(coordKey)!;
                    } else {
                        coordMap.set(coordKey, key);
                    }
                }

                if (placeMap.has(key)) {
                    const existingPlace = placeMap.get(key)!;
                    
                    // Check if source already included to avoid "A · A"
                    const currentSources = existingPlace.source ? existingPlace.source.split(' · ') : [];
                    let newSource = existingPlace.source;
                    
                    if (!currentSources.includes(sourceTitle)) {
                        newSource = `${existingPlace.source} · ${sourceTitle}`;
                    }
                    
                    // Merge properties. 
                    placeMap.set(key, { ...existingPlace, ...p, source: newSource });
                } else {
                    placeMap.set(key, { ...p, source: sourceTitle });
                }
            });
        };

        addPlaces(gluttonyData.places, gluttonyData.title);
        addPlaces(islandData.places, islandData.title);
        addPlaces(supportData.places, supportData.title);
        addPlaces(babyData.places, babyData.title);

        return {
            title: gluttonyData.title,
            places: Array.from(placeMap.values())
        };
    } catch (error) {
        throw new FetchError(error);
    }
}
