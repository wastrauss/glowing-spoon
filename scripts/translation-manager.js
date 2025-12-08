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

function loadFileWithHeader(filepath) {
    if (!fs.existsSync(filepath)) return { header: '', data: {} };
    const content = fs.readFileSync(filepath, 'utf8');
    if (!content) return { header: '', data: {} };

    const firstLineEnd = content.indexOf('\n');
    const firstLine = (firstLineEnd !== -1) ? content.substring(0, firstLineEnd).trim() : content.trim();

    if (firstLine.startsWith('#')) {
        const yamlContent = content.substring(firstLineEnd + 1);
        return { header: firstLine, data: yaml.load(yamlContent) || {} };
    }
    return { header: '', data: yaml.load(content) || {} };
}

function writeCustomYaml(filepath, header, data) {
    const stream = fs.createWriteStream(filepath);
    if (header) stream.write(`${header}\n`);
    
    const sortedKeys = Object.keys(data).sort();
    sortedKeys.forEach(key => {
        stream.write(`${key}: ${JSON.stringify(data[key])}\n`);
    });
    stream.end();
}

function main() {
    if (!fs.existsSync(ENGLISH_FILE)) {
        console.error(`English file not found: ${ENGLISH_FILE}`);
        process.exit(1);
    }

    const enSource = loadFileWithHeader(ENGLISH_FILE);
    writeCustomYaml(ENGLISH_FILE, enSource.header, enSource.data);

    let orphanReport = '';

    TARGET_FILES.forEach(targetPath => {
        const targetSource = loadFileWithHeader(targetPath);
        const targetMap = targetSource.data;
        
        Object.entries(enSource.data).forEach(([enKey, enValue]) => {
            if (!Object.prototype.hasOwnProperty.call(targetMap, enKey)) {
                console.log(`[${targetPath}] Adding missing key: ${enKey}`);
                targetMap[enKey] = enValue; 
            }
        });

        let orphansInFile = [];
        Object.keys(targetMap).forEach(tKey => {
            if (!Object.prototype.hasOwnProperty.call(enSource.data, tKey)) {
                orphansInFile.push(tKey);
            }
        });

        if (orphansInFile.length > 0) {
            orphanReport += `### ${targetPath}\n`;
            orphansInFile.forEach(key => orphanReport += `- \`${key}\`\n`);
            orphanReport += '\n';
        }

        writeCustomYaml(targetPath, targetSource.header, targetMap);
    });

    if (orphanReport) {
        const header = "## Orphaned Translation Keys Detected\n\nThe following keys exist in non-English files but are missing from the source (English):\n\n";
        fs.writeFileSync('orphan_report.md', header + orphanReport);
    }
}

main();