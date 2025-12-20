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
    [key: string]: any;
}

interface IslandData {
    title: string;
    count: number;
    extracted_at: string;
    places: Place[];
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

        console.log(`Found ${data.places.length} places. Cleaning descriptions...`);

        let cleanedCount = 0;
        for (const place of data.places) {
            // Check if description is not already empty
            if (place.description !== "") {
                place.description = "";
                cleanedCount++;
            }
        }

        console.log(`Cleaned descriptions for ${cleanedCount} places.`);

        // Determine if we should format it nicely or minify? The previous file was pretty-printed.
        await fs.writeFile(JSON_FILE, JSON.stringify(data, null, 2), 'utf-8');
        console.log("Successfully regenerated island.json.");

    } catch (error) {
        console.error("An error occurred:", error);
    }
}

main();
