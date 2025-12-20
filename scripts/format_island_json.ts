import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// File paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BASE_DIR = path.resolve(__dirname, '..');
const JSON_FILE = path.join(BASE_DIR, 'public', 'island.json');

interface Place {
    name: string;
    url: string;
    place_id: string;
    image_url: string | null;
    description: string;
    lat?: number;
    lng?: number;
    category?: string;
    city?: string;
    county?: string;
    permanently_closed?: boolean;
    [key: string]: any;
}

interface IslandData {
    title: string;
    count: number;
    extracted_at: string;
    places: Place[];
}

function extractCoordsFromUrl(url: string): { lat: number, lng: number } | null {
    // Attempt to find @lat,lng,zoom pattern
    const match = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (match) {
        return {
            lat: parseFloat(match[1]),
            lng: parseFloat(match[2])
        };
    }
    return null;
}

async function main() {
    try {
        console.log(`Reading ${JSON_FILE}...`);
        const fileContent = await fs.readFile(JSON_FILE, 'utf-8');
        const data: IslandData = JSON.parse(fileContent);

        if (!data.places) {
            console.error("Error: 'places' key not found in JSON root.");
            return;
        }

        console.log(`Found ${data.places.length} places. Formatting...`);

        let updatedCount = 0;
        for (const place of data.places) {
            let changed = false;

            // Add missing fields
            if (place.lat === undefined) {
                const coords = extractCoordsFromUrl(place.url);
                place.lat = coords ? coords.lat : 0;
                changed = true;
            }
            if (place.lng === undefined) {
                const coords = extractCoordsFromUrl(place.url);
                place.lng = coords ? coords.lng : 0;
                changed = true;
            }
            if (place.category === undefined) {
                place.category = "島國"; // Default category
                changed = true;
            }
            if (place.city === undefined) {
                place.city = "";
                changed = true;
            }
            if (place.county === undefined) {
                place.county = "";
                changed = true;
            }
             // Ensure permanently_closed is absent if false, or present if true. Gluttony usually skips it if false.
             // We won't add it unless we know.

            if (changed) {
                updatedCount++;
            }
        }

        console.log(`Updated format for ${updatedCount} places.`);

        await fs.writeFile(JSON_FILE, JSON.stringify(data, null, 2), 'utf-8');
        console.log("Successfully formatted island.json.");

    } catch (error) {
        console.error("An error occurred:", error);
    }
}

main();
