/**
 * Test script for validating and analyzing Aura components.
 * This script reads Aura component files from the test-aura/patterns directory,
 * parses them, validates them, and generates LWC output.
 * It also prints validation warnings and complexity analysis for each component.
 */
const fs = require('fs-extra');
const path = require('path');
const AuraParser = require('../src/parsers/auraParser');
const { generateLWC } = require('../src/generators/lwcGenerator');
const { validateAuraComponent } = require('../src/validators/metadataValidator');
const xml2js = require('xml2js');

async function testPatterns() {
  const patternsDir = path.join(__dirname, '../test-aura/patterns');
  const files = await fs.readdir(patternsDir);
  const parser = new AuraParser();
  const xmlParser = new xml2js.Parser({ explicitArray: false, mergeAttrs: true });

  let first = true;
  for (const file of files) {
    if (file.endsWith('.cmp')) {
      const filePath = path.join(patternsDir, file);
      const content = await fs.readFile(filePath, 'utf8');
      console.log(`\n=== Testing: ${file} ===`);
      try {
        if (first) {
          const raw = await xmlParser.parseStringPromise(content);
          console.log('Raw xml2js output:', JSON.stringify(raw, null, 2));
          first = false;
        }
        // Parse the Aura component
        const parsed = parser.parseAuraComponent ? await parser.parseAuraComponent(content) : await parser.parseMarkup(content);
        console.log('Parsed Output:', JSON.stringify(parsed, null, 2));
        // Validate
        const { warnings, complexity } = validateAuraComponent(parsed);
        if (warnings.length > 0) {
          console.log('Validation Warnings/Errors:');
          warnings.forEach(w => console.log('  -', w));
        } else {
          console.log('Validation: No issues found.');
        }
        // Print complexity analysis
        if (complexity) {
          console.log('Complexity Analysis:');
          console.log('  Metrics:', JSON.stringify(complexity.metrics, null, 2));
          console.log('  Score:', complexity.score);
          console.log('  Level:', complexity.level);
        }
        // Generate LWC HTML and JS
        const lwcResult = generateLWC(parsed);
        console.log('Generated LWC HTML:\n', lwcResult.html);
        if (lwcResult.js) {
          console.log('Generated LWC JS:\n', lwcResult.js);
        }
      } catch (err) {
        console.error(`Error processing ${file}:`, err);
      }
    }
  }
}

testPatterns(); 