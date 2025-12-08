const fs = require('fs');
const yaml = require('js-yaml');

// --- CONFIGURATION ---
const ENGLISH_FILE = 'translations/en_US.yml';
const TARGET_FILES = [
    'translations/es-419.yml', 
    'translations/fr.yml', 
    'translations/pt-BR.yml', 
    'translations/sv-SE.yml'
];

/**
 * Loads a YAML file but preserves the first line if it is a comment (starts with #).
 * Returns { header: string, data: object }
 */
function loadFileWithHeader(filepath) {
    if (!fs.existsSync(filepath)) {
        // If target file doesn't exist, return empty so we can create it
        return { header: '', data: {} };
    }

    const content = fs.readFileSync(filepath, 'utf8');
    
    // Check if the file is empty
    if (!content) return { header: '', data: {} };

    // Check if first line is a comment
    const firstLineEnd = content.indexOf('\n');
    const firstLine = (firstLineEnd !== -1) ? content.substring(0, firstLineEnd).trim() : content.trim();

    if (firstLine.startsWith('#')) {
        // Extract content after the first line
        const yamlContent = content.substring(firstLineEnd + 1);
        return { 
            header: firstLine, 
            data: yaml.load(yamlContent) || {} 
        };
    }

    // No header found, treat whole file as YAML
    return { header: '', data: yaml.load(content) || {} };
}

/**
 * Writes the file: Header + Sorted Keys + Double Quoted Values
 */
function writeCustomYaml(filepath, header, data) {
    const stream = fs.createWriteStream(filepath);
    
    // 1. Write the preserved header (if it exists)
    if (header) {
        stream.write(`${header}\n`);
    }

    // 2. Sort keys alphabetically
    const sortedKeys = Object.keys(data).sort();

    // 3. Write "key": "value" format
    sortedKeys.forEach(key => {
        const value = data[key];
        // JSON.stringify adds surrounding quotes and escapes internal quotes
        stream.write(`${key}: ${JSON.stringify(value)}\n`);
    });

    stream.end();
}

function main() {
    if (!fs.existsSync(ENGLISH_FILE)) {
        console.error(`English file not found: ${ENGLISH_FILE}`);
        process.exit(1);
    }

    // 1. Load English Source
    const enSource = loadFileWithHeader(ENGLISH_FILE);
    
    // Immediately rewrite English (to ensure sorting)
    writeCustomYaml(ENGLISH_FILE, enSource.header, enSource.data);

    let orphanReport = '';

    // 2. Process Targets
    TARGET_FILES.forEach(targetPath => {
        const targetSource = loadFileWithHeader(targetPath);
        const targetMap = targetSource.data;
        let modified = false;

        // A. Sync: Add missing keys from English
        Object.entries(enSource.data).forEach(([enKey, enValue]) => {
            if (!Object.prototype.hasOwnProperty.call(targetMap, enKey)) {
                console.log(`[${targetPath}] Adding missing key: ${enKey}`);
                targetMap[enKey] = enValue; // Use English text as placeholder
                modified = true;
            }
        });

        // B. Check for Orphans
        let orphansInFile = [];
        Object.keys(targetMap).forEach(tKey => {
            if (!Object.prototype.hasOwnProperty.call(enSource.data, tKey)) {
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

        // C. Save (Always save to ensure sorting and format consistency)
        writeCustomYaml(targetPath, targetSource.header, targetMap);
    });

    // 3. Generate Report
    if (orphanReport) {
        console.log("Orphans found. Generating report.");
        const header = "## Orphaned Translation Keys Detected\n\nThe following keys exist in non-English files but are missing from the source (English):\n\n";
        fs.writeFileSync('orphan_report.md', header + orphanReport);
    }
}

main();