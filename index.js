import * as cheerio from 'cheerio';
import * as fs from 'fs';
import axios from 'axios';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Initialize JSON content array
let jsonContent = [];

// Function to process a single HTML file
function processHtmlFile(filePath) {
    const html = fs.readFileSync(filePath, 'utf-8');
    const $ = cheerio.load(html);

    // Find the table and iterate through rows
    $('.medalist-rating-table tbody tr').each((i, row) => {
        const cells = $(row).find('td');
        
        // Extract data from each cell
        const fundName = $(cells[0]).find('.identity-cell-value').text().trim();
        const fundUrl = $(cells[0]).find('.identity-cell-value').attr('href');
        const category = $(cells[1]).text().replace('Category :', '').trim();

        // Check for all medalist ratings
        let medalistRating = '';
        const ratingClasses = [
            { class: 'analyst-rating-icon-gold', value: 'Gold' },
            { class: 'analyst-rating-icon-silver', value: 'Silver' },
            { class: 'analyst-rating-icon-bronze', value: 'Bronze' },
            { class: 'analyst-rating-icon-neutral', value: 'Neutral' },
            { class: 'analyst-rating-icon-negative', value: 'Negative' },
            { class: 'analyst-rating-icon-under-review', value: 'Under Review' },
            { class: 'analyst-rating-icon-not-ratable', value: 'Not Ratable' },
        ];
        for (const rating of ratingClasses) {
            if ($(cells[2]).find(`.${rating.class}`).length) {
                medalistRating = rating.value;
                break;
            }
        }

        const equityStylebox = $(cells[3]).find('img').attr('alt').replace('Equity Stylebox for ', '');
        const fixedIncomeStylebox = $(cells[4]).find('img').attr('alt').replace('Fixed Income Stylebox for ', '');
        const starRating = $(cells[5]).find('img').attr('alt').replace('Star Rating ', '');
        const medalistRatingDate = $(cells[6]).text().replace('Medalist Rating Date :', '').trim();

        jsonContent.push({
            fundName,
            fundUrl,
            category,
            medalistRating,
            equityStylebox,
            fixedIncomeStylebox,
            starRating,
            medalistRatingDate
        });
    });
}

// Process all HTML files in the files directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const filesDir = path.join(__dirname, 'files');
const htmlFiles = fs.readdirSync(filesDir).filter(file => file.endsWith('.html'));

for (const file of htmlFiles) {
    const filePath = path.join(filesDir, file);
    console.log(`Processing file: ${file}`);
    processHtmlFile(filePath);
}

console.log('Initial JSON content:', jsonContent);

// Make API calls to each fund URL
async function fetchISINs() {
    for (const item of jsonContent) {
        if (item.fundUrl) {
            try {
                const response = await axios.get(item.fundUrl);
                console.log(`Successfully fetched data for ${item.fundName}`);
                
                // Parse the response HTML using Cheerio
                const $ = cheerio.load(response.data);
                
                // Extract ISIN number from the span
                const isinNumber = $('#ctl00_ContentPlaceHolder1_ucQuoteHeader_lblISIN').text().trim();
                
                // Add ISIN to the item in jsonContent
                item.isin = isinNumber;
                
            } catch (error) {
                console.error(`Error fetching data for ${item.fundName}:`, error.message);
                item.isin = 'Error fetching ISIN';
            }
        }
    }
}

// Execute the ISIN fetching process
fetchISINs().then(() => {
    console.log('Updated JSON with ISIN numbers:', jsonContent);
    // Optionally save the final JSON to a file
    fs.writeFileSync('funds_data.json', JSON.stringify(jsonContent, null, 2));
});


// const $ = cheerio.loadBuffer(buffer);
// // Read the HTML file
// const html = fs.readFileSync('index.html', 'utf-8');
// const $cheerio = cheerio.load(html);

// // Initialize CSV content with headers
// let jsonContent = []

// // Find the table and iterate through rows
// $cheerio('.medalist-rating-table tbody tr').each((i, row) => {
//     const cells = $(row).find('td');
    
//     // Extract data from each cell
//     const fundName = $(cells[0]).find('.identity-cell-value').text().trim();
//     const fundUrl = $(cells[0]).find('.identity-cell-value').attr('href');
//     const category = $(cells[1]).text().replace('Category :', '').trim();

//     // Check for all medalist ratings
//     let medalistRating = '';
//     const ratingClasses = [
//         { class: 'analyst-rating-icon-gold', value: 'Gold' },
//         { class: 'analyst-rating-icon-silver', value: 'Silver' },
//         { class: 'analyst-rating-icon-bronze', value: 'Bronze' },
//         { class: 'analyst-rating-icon-neutral', value: 'Neutral' },
//         { class: 'analyst-rating-icon-negative', value: 'Negative' },
//         { class: 'analyst-rating-icon-under-review', value: 'Under Review' },
//         { class: 'analyst-rating-icon-not-ratable', value: 'Not Ratable' },
//     ];
//     for (const rating of ratingClasses) {
//         if ($(cells[2]).find(`.${rating.class}`).length) {
//             medalistRating = rating.value;
//             break;
//         }
//     }

//     const equityStylebox = $(cells[3]).find('img').attr('alt').replace('Equity Stylebox for ', '');
//     const fixedIncomeStylebox = $(cells[4]).find('img').attr('alt').replace('Fixed Income Stylebox for ', '');
//     const starRating = $(cells[5]).find('img').attr('alt').replace('Star Rating ', '');
//     const medalistRatingDate = $(cells[6]).text().replace('Medalist Rating Date :', '').trim();

//     jsonContent = [...jsonContent, {
//         fundName,
//         fundUrl,
//         medalistRating,
//     }];

//     // Add row to CSV
//     csvContent += `"${fundName}","${category}","${medalistRating}","${equityStylebox}","${fixedIncomeStylebox}","${starRating}","${medalistRatingDate}","${fundUrl}"\n`;
// });

// console.log(jsonContent)

// // Make API calls to each fund URL
// for(const item of jsonContent){
//     if(item.fundUrl) {
//         try {
//             const response = await axios.get(item.fundUrl);
//             console.log(`Successfully fetched data for ${item.fundName}`);
            
//             // Parse the response HTML using Cheerio
//             const $ = cheerio.load(response.data);
            
//             // Extract ISIN number from the span
//             const isinNumber = $('#ctl00_ContentPlaceHolder1_ucQuoteHeader_lblISIN').text().trim();
            
//             // Add ISIN to the item in jsonContent
//             item.isin = isinNumber;
            
//         } catch (error) {
//             console.error(`Error fetching data for ${item.fundName}:`, error.message);
//             item.isin = 'Error fetching ISIN';
//         }
//     }
// }

// // Log the updated jsonContent with ISIN numbers
// console.log('Updated JSON with ISIN numbers:', jsonContent);

