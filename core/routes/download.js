const express = require('express');
const {getResults, searchID, searchIDs} = require("./results");
const router = express.Router();

router.get('/', async (req, res) => {
    let searchResults = await getResults(req.query)

    let ids = searchResults.map((e=>e.common_id))
    let dictionaryResults = await searchIDs(ids)

    // Prepare the CSV data
    const headers = ["root", "meaning", "derivative", "derivative meaning", "language", "form", "dictionary"];
    const csvRows = [headers.join(',')]; // Add the headers as the first row

    for (const dictionary in dictionaryResults){
        for (const i in dictionaryResults[dictionary]) {
            let result = dictionaryResults[dictionary][i]
            // get the common id and find
            const root = result.root;
            const meaning = result.meaning;
            for (const reflexObj of result.reflexes) {
                const reflex = reflexObj.reflexes.join(", ");
                const gloss = reflexObj.gloss;
                const language = reflexObj.language.language_name;

                let form = undefined
                if (typeof reflexObj.pos !== "object"){
                    form = "NYI"
                } else {
                    form = reflexObj.pos.map(pos => pos.meaning).join(" ");
                }

                // Escape quotes, and surround each value with quotes
                const row = [root, meaning, reflex, gloss, language, form, dictionary].map(value => `"${String(value).replace(/"/g, '""')}"`);

                // Add the row to the CSV data
                csvRows.push(row.join(','));
            }
        }
    }

    // Convert the CSV data to a string
    const csv = csvRows.join('\n');

    let filenameQuery = Object.values(req.query)
        .filter((s) => s !== "")
        .join("_")
        .replace(/[\\/:*?"<>|]/g, '');

    if (filenameQuery === ""){
        filenameQuery = "data"
    }

    // Set response headers
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${filenameQuery}.csv`);

    // Send the CSV as the response
    res.end(csv);
});

module.exports = {downloadRouter: router}