#!/usr/bin/env node
const fs = require('fs');
const { SourceMapConsumer } = require('source-map');
const path = require('path');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const prettier = require('prettier'); // Ensure prettier is installed

const argv = yargs(hideBin(process.argv))
    .usage('Usage: $0 [options]')
    .option('input', {
        description: 'The input path to the minified JavaScript file or a directory containing multiple files',
        alias: 'i',
        type: 'string',
        demandOption: true
    })
    .option('maxDepth', {
        description: 'The maximum depth of the directory tree to print',
        type: 'number',
        default: 3
    })
    .option('maxFiles', {
        description: 'The maximum number of files to display per directory',
        type: 'number',
        default: 5
    })
    .help()
    .alias('help', 'h')
    .argv;

// Array to store the recovered file paths
const recoveredFiles = [];

const handleFile = async (minifiedFilePath) => {
    // Check if the Source Map exists
    const sourceMapPath = minifiedFilePath + '.map';
    if (!fs.existsSync(sourceMapPath)) {
        console.error(`No source map found at ${sourceMapPath}`);
        return;
    }

    // Read the minified file and the Source Map
    const minifiedCode = fs.readFileSync(minifiedFilePath, 'utf8');
    const rawSourceMap = fs.readFileSync(sourceMapPath);
    try{
        const rawSourceMapJson = JSON.parse(rawSourceMap);
    
        await SourceMapConsumer.with(rawSourceMapJson, null, (sourceMapConsumer) => {
            const sources = sourceMapConsumer.sources;
    
            const sourceContents = sources.reduce((contents, source) => {
                contents[source] = sourceMapConsumer.sourceContentFor(source, true);
                return contents;
            }, {});
    
            if (Object.values(sourceContents).some(content => content !== null)) {
                // If sourcesContent exists, write it to the file
                for (const source in sourceContents) {
                    if (sourceContents[source] !== null) {
                        const originalFilePath = path.join(path.dirname(minifiedFilePath), source + '');
                        fs.mkdirSync(path.dirname(originalFilePath), { recursive: true });
                        fs.writeFileSync(originalFilePath, sourceContents[source]);
                        // Add to the list of recovered files
                        recoveredFiles.push(originalFilePath);
                    }
                }
            } else {
                // If sourcesContent doesn't exist, reconstruct the source code
                const lines = minifiedCode.split('\n');
                let reconstructedSource = '';
    
                lines.forEach((line, lineIndex) => {
                    const lineNum = lineIndex + 1;
                    const columnCount = line.length;
    
                    for (let column = 0; column < columnCount; column++) {
                        const pos = { line: lineNum, column: column };
                        const originalPosition = sourceMapConsumer.originalPositionFor(pos);
    
                        if (originalPosition.source === null) continue;
    
                        if (originalPosition.name) {
                            reconstructedSource += originalPosition.name;
                        } else {
                            reconstructedSource += minifiedCode.charAt(column);
                        }
                    }
    
                    reconstructedSource += '\n';
                });
    
                // prettify the code
                try {
                    reconstructedSource = prettier.format(reconstructedSource, { semi: false, parser: "babel" });
                } catch (error) {
                    console.error("An error occurred while prettifying the code:", error);
                }
    
                const originalFilePath = path.join(path.dirname(minifiedFilePath), path.basename(minifiedFilePath, '.js') + '-recovered.js');
                fs.mkdirSync(path.dirname(originalFilePath), { recursive: true });
                fs.writeFileSync(originalFilePath, reconstructedSource);
                // Add to the list of recovered files
                recoveredFiles.push(originalFilePath);
            }
        });
    }catch(e){
        console.log("This file doesn't have information");
    }
};

const handlePath = async (inputPath, currentDepth = 0) => {
    const files = fs.readdirSync(inputPath);

    // Keep track of how many files we've printed for each folder
    let fileCount = 0;

    for (const file of files) {
        const absolutePath = path.join(inputPath, file);

        if (fs.statSync(absolutePath).isDirectory()) {
            // Create the directory even if we're not printing it
            fs.mkdirSync(absolutePath, { recursive: true });

            // Don't process directories if we've hit max depth
            if (currentDepth < argv.maxDepth) {
                await handlePath(absolutePath, currentDepth + 1);
            }
        } else {
            // Process all files, even if we're not printing them in the tree
            await handleFile(absolutePath);

            // Only print files if we're not exceeding maxFiles
            if (fileCount < argv.maxFiles) {
                fileCount++;
            }
        }
    }
};

const printRecoveredFilesTree = (files) => {
    const grouped = files.reduce((acc, filePath) => {
        const parts = filePath.split(path.sep);
        let currentLevel = acc;

        parts.forEach((part, index) => {
            if (!currentLevel[part]) {
                currentLevel[part] = index === parts.length - 1 ? null : {};
            }
            currentLevel = currentLevel[part];
        });

        return acc;
    }, {});

    const printTree = (node, indent = '', depth = 0) => {
        if (depth > argv.maxDepth) return;

        Object.keys(node).forEach((key, index) => {
            const isLast = index === Object.keys(node).length - 1;

            if (node[key] === null) {
                console.log(`${indent}|-- ${key}`);
            } else {
                console.log(`${indent}${isLast ? '`-- ' : '|-- '}${key}/`);
                printTree(node[key], indent + (isLast ? '    ' : '|   '), depth + 1);
            }
        });
    };

    printTree(grouped);
};

const main = async () => {
    // Handle directory or file based on input type
    if (fs.statSync(argv.input).isDirectory()) {
        await handlePath(argv.input);
        printRecoveredFilesTree(recoveredFiles);
    } else {
        await handleFile(argv.input);
        printRecoveredFilesTree(recoveredFiles);
    }
};

main().catch(error => {
    console.error("An error occurred:", error);
});
