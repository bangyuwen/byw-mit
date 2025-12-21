import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Place, PlaceData } from '../src/types/place';

// File paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BASE_DIR = path.resolve(__dirname, '..');
const JSON_FILE = path.join(BASE_DIR, 'public', 'gluttony.json');

// Nominatim API
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/reverse";
const HEADERS = {
    "User-Agent": "GluttonyMap/1.0"
};

async function getLocation(lat: number, lng: number): Promise<any> {
    try {
        const params = new URLSearchParams({
            lat: lat.toString(),
            lon: lng.toString(),
            format: "json",
            "accept-language": "zh-TW"
        });
        const url = `${NOMINATIM_URL}?${params.toString()}`;
        
        const response = await fetch(url, { headers: HEADERS });
        if (!response.ok) {
            console.error(`Error: Status ${response.status}`);
            return null;
        }
        
        const data = await response.json();
        return data.address || {};
    } catch (error) {
        console.error(`Error fetching location for ${lat}, ${lng}:`, error);
        return null;
    }
}

async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
    try {
        const fileContent = await fs.readFile(JSON_FILE, 'utf-8');
        const data: PlaceData = JSON.parse(fileContent);

        if (!data.places) {
            console.error("Error: 'places' key not found in JSON root.");
            return;
        }

        let updatedCount = 0;
        const places = data.places;
        
        console.log(`Found ${places.length} places to process.`);

        for (let i = 0; i < places.length; i++) {
            const place = places[i];
            
            // Skip if already has county or city
            if (place.county || place.city) {
                continue;
            }

            const lat = place.lat;
            const lng = place.lng;

            if (lat !== undefined && lng !== undefined) {
                console.log(`[${i + 1}/${places.length}] Processing ${place.name} (${lat}, ${lng})...`);
                
                const address = await getLocation(Number(lat), Number(lng));
                
                if (address) {
                    const city = address.city;
                    const county = address.county;

                    if (county) place.county = county;
                    if (city) place.city = city;

                    updatedCount++;

                    if (updatedCount % 10 === 0) {
                        console.log(`Saving progress... (${updatedCount} updated)`);
                         await fs.writeFile(JSON_FILE, JSON.stringify(data, null, 2), 'utf-8');
                    }

                    // Rate limit 1.1s
                    await sleep(1100);
                } else {
                    console.log("  No address found.");
                }
            } else {
                console.log(`[${i + 1}/${places.length}] Skipping ${place.name} (no lat/lng)`);
            }
        }

        console.log(`Updated ${updatedCount} places.`);
        await fs.writeFile(JSON_FILE, JSON.stringify(data, null, 2), 'utf-8');
        console.log("Done.");

    } catch (error) {
        console.error("An error occurred:", error);
    }
}

main();
