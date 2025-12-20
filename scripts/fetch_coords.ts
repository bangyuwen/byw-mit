import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// File paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BASE_DIR = path.resolve(__dirname, '..');
const JSON_FILE = path.join(BASE_DIR, 'public', 'island.json');

// Nominatim API
const NOMINATIM_SEARCH_URL = "https://nominatim.openstreetmap.org/search";
const HEADERS = {
    "User-Agent": "GluttonyMap/1.0 (contact@example.com)"
};

async function searchLocation(query: string): Promise<any> {
    try {
        const params = new URLSearchParams({
            q: query,
            format: "json",
            limit: "1",
            addressdetails: "1",
            countrycodes: "tw"
        });
        const url = `${NOMINATIM_SEARCH_URL}?${params.toString()}`;
        
        const response = await fetch(url, { headers: HEADERS });
        if (!response.ok) return null;
        
        const data = await response.json();
        return data.length > 0 ? data[0] : null;
    } catch (error) {
        return null; // Ignore connection errors
    }
}

async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
    try {
        const fileContent = await fs.readFile(JSON_FILE, 'utf-8');
        const data = JSON.parse(fileContent);

        if (!data.places) return;

        let updatedCount = 0;
        const places = data.places;
        
        console.log(`Processing ${places.length} places with Nominatim Search (Refined)...`);

        for (let i = 0; i < places.length; i++) {
            const place = places[i];

            // If already has lat/lng, skip
            if (place.lat !== 0 && place.lng !== 0) {
                 continue;
            }

            // Clean name for search
            // Split by common delimiters and take the first part
            let searchName = place.name.split(/[|｜(（/\\-]/)[0].trim();
            
            // Remove emojis?
            // searchName = searchName.replace(/[\u{1F600}-\u{1F6FF}]/gu, ''); 

            // If name is too long, maybe take first 2-3 words?
            // "芭達泰美容美體舒活館" is fine.
            
            if (searchName.length < 2) searchName = place.name;

            console.log(`[${i + 1}/${places.length}] Searching for "${searchName}"...`);
            
            const result = await searchLocation(searchName);
            
            if (result) {
                const lat = parseFloat(result.lat);
                const lng = parseFloat(result.lon);
                const address = result.address;

                place.lat = lat;
                place.lng = lng;
                
                if (address) {
                     if (address.city || address.town || address.village) place.city = address.city || address.town || address.village || "";
                     if (address.county) place.county = address.county || "";
                }
                
                console.log(`  Found: ${lat}, ${lng} -> ${place.city} ${place.county}`);
                updatedCount++;
            } else {
                console.log(`  Not found.`);
            }

            // Save periodically
            if (updatedCount > 0 && updatedCount % 5 === 0) {
                 await fs.writeFile(JSON_FILE, JSON.stringify(data, null, 2), 'utf-8');
            }
            
            // Rate limit (1 request per 1.5 second)
            await sleep(1500);
        }

        console.log(`Updated ${updatedCount} places.`);
        await fs.writeFile(JSON_FILE, JSON.stringify(data, null, 2), 'utf-8');
        console.log("Done.");

    } catch (error) {
        console.error("An error occurred:", error);
    }
}

main();
