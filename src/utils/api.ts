export interface Place {
    place_id: string;
    name: string;
    category: string;
    description: string;
    url: string;
    lat: string;
    lng: string;
    recent_visitors?: string;
    county?: string;
    city?: string;
    permanently_closed?: boolean;
}

export interface GluttonyData {
    title: string;
    places: Place[];
}

export class FetchError extends Error {
    constructor(public originalError: unknown) {
        super("Failed to fetch gluttony data");
        this.name = "FetchError";
    }
}

// Fetch the data using standard fetch API
export async function fetchGluttonyData(): Promise<GluttonyData> {
    try {
        const response = await fetch('/byw-mit/gluttony.json');
        if (!response.ok) {
            throw new Error(`Failed to fetch data: ${response.statusText}`);
        }
        return (await response.json()) as GluttonyData;
    } catch (error) {
        throw new FetchError(error);
    }
}
