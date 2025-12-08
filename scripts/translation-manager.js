const fs = require('fs');
const yaml = require('js-yaml'); // Standard parser

// --- CONFIGURATION ---
const ENGLISH_FILE = 'translations/en_US.yml';
const TARGET_FILES = ['translations/es-419.yml', 'translations/fr.yml', 'translations/pt-BR.yml', 'translations/sv-SE.yml'];

// Helper to write file with enforced "key": "value" formatting
function writeCustomYaml(filepath, data) {
    const stream = fs.createWriteStream(filepath);
    
    // Sort keys alphabetically
    const sortedKeys = Object.keys(data).sort();

    sortedKeys.forEach(key => {
        const value = data[key];
        
        // JSON.stringify adds the surrounding quotes and escapes internal quotes safely
        // e.g. converts string 'hello' to '"hello"'
        // e.g. converts string 'say "hi"' to '"say \"hi\""'
        const formattedValue = JSON.stringify(value);
        
        stream.write(`${key}: ${formattedValue}\n`);
    });

    stream.end();
}

function main() {
    if (!fs.existsSync(ENGLISH_FILE)) {
        console.error(`English file not found: ${ENGLISH_FILE}`);
        process.exit(1);
    }

    // 1. Load English Source
    const enContent = fs.readFileSync(ENGLISH_FILE, 'utf8');
    const enMap = yaml.load(enContent) || {};

    // Immediately rewrite English to ensure it is sorted
    writeCustomYaml(ENGLISH_FILE, enMap);

    let orphanReport = '';

    // 2. Process Targets
    TARGET_FILES.forEach(targetPath => {
        if (!fs.existsSync(targetPath)) {
            console.log(`Creating missing file: ${targetPath}`);
            fs.writeFileSync(targetPath, '');
        }

        const targetContent = fs.readFileSync(targetPath, 'utf8');
        const targetMap = yaml.load(targetContent) || {};
        let orphansInFile = [];

        // A. Sync: Add missing keys from English
        Object.entries(enMap).forEach(([enKey, enValue]) => {
            if (!Object.prototype.hasOwnProperty.call(targetMap, enKey)) {
                console.log(`[${targetPath}] Adding missing key: ${enKey}`);
                targetMap[enKey] = enValue; // Use English text as placeholder
            }
        });

        // B. Check for Orphans (Keys in Target that are NOT in English)
        Object.keys(targetMap).forEach(tKey => {
            if (!Object.prototype.hasOwnProperty.call(enMap, tKey)) {
                orphansInFile.push(tKey);
            }
        });

        if (orphansInFile.length > 0) {
            orphanReport += `### ${targetPath}\n`;
            orphansInFile.forEach(key => {
                orphanReport += `- \`${key}\`\n`;
            });
            orphanReport += '\n';
        }

        // C. Save Sorted & Synced File
        writeCustomYaml(targetPath, targetMap);
    });

    // 3. Generate Report
    if (orphanReport) {
        console.log("Orphans found. Generating report.");
        const header = "## Orphaned Translation Keys Detected\n\nThe following keys exist in non-English files but are missing from the source (English):\n\n";
        fs.writeFileSync('orphan_report.md', header + orphanReport);
    } else {
        console.log("No orphans found.");
    }
}

main();