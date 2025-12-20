import fs from 'node:fs/promises';

async function main() {
    const url = "https://www.google.com/maps/place/%E9%81%8E%E5%8E%BB%E7%8F%88%E7%90%B2/data=!4m2!3m1!1s0x346e63caafb53e7d:0xd2bd3d1ec134c314";
    const response = await fetch(url, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36"
        }
    });
    const text = await response.text();
    console.log(text.substring(0, 5000)); // Print first 5000 chars

    // Check for og:image
    const ogImage = text.match(/meta\s+property="og:image"\s+content="([^"]+)"/);
    if (ogImage) {
        console.log("Found og:image:", ogImage[1]);
    } else {
        console.log("No og:image found");
    }
}

main();
