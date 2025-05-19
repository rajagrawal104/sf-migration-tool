#!/usr/bin/env node

const { program } = require('commander');
const path = require('path');
const fs = require('fs-extra');
const XMLParser = require('../parsers/xmlParser');
const MetadataMapper = require('../mappers/metadataMapper');
const MetadataValidator = require('../validators/metadataValidator');
const { FormatterFactory } = require('../output/formatters');

program
  .name('sf-migration-tool')
  .description('A tool to migrate Salesforce metadata between orgs')
  .version('1.0.0');

program
  .command('migrate')
  .description('Migrate metadata from source to target org')
  .requiredOption('-s, --source <path>', 'Source metadata directory')
  .requiredOption('-t, --target <path>', 'Target metadata directory')
  .option('-f, --format <format>', 'Output format (default: "xml")', 'xml')
  .option('-v, --verbose', 'Enable verbose logging')
  .action(async (options) => {
    try {
      const sourcePath = path.resolve(options.source);
      const targetPath = path.resolve(options.target);

      // Validate paths
      if (!fs.existsSync(sourcePath)) {
        console.error(`Source directory does not exist: ${sourcePath}`);
        process.exit(1);
      }

      if (!fs.existsSync(targetPath)) {
        console.log(`Creating target directory: ${targetPath}`);
        fs.mkdirSync(targetPath, { recursive: true });
      }

      console.log('Starting migration...');
      console.log(`Source: ${sourcePath}`);
      console.log(`Target: ${targetPath}`);
      console.log(`Format: ${options.format}`);

      // Initialize components
      const parser = new XMLParser();
      const mapper = new MetadataMapper();
      const formatter = FormatterFactory.getFormatter(options.format);

      // Parse source metadata
      console.log('\nParsing source metadata...');
      const sourceMetadata = await parser.parseDirectory(sourcePath);
      if (options.verbose) {
        console.log(`Found ${Object.keys(sourceMetadata).length} metadata files`);
      }

      // Validate source metadata
      console.log('\nValidating metadata...');
      const validationResult = MetadataValidator.validate(sourceMetadata);
      if (!validationResult.isValid) {
        console.error('\nValidation errors found:');
        validationResult.errors.forEach(({ type, errors }) => {
          console.error(`\n${type}:`);
          errors.forEach(error => console.error(`  - ${error}`));
        });
        process.exit(1);
      }
      console.log('Validation successful');

      // Transform metadata
      console.log('\nTransforming metadata...');
      const transformedMetadata = await mapper.transform(sourceMetadata);
      if (options.verbose) {
        console.log('Transformation completed');
      }

      // Write transformed metadata
      console.log('\nWriting transformed metadata...');
      for (const [filename, data] of Object.entries(transformedMetadata)) {
        const targetFile = path.join(targetPath, filename);
        const formattedData = formatter.format(data);
        await fs.writeFile(targetFile, formattedData);
        if (options.verbose) {
          console.log(`Wrote ${filename}`);
        }
      }

      console.log('\nMigration completed successfully!');
      
    } catch (error) {
      console.error('\nError during migration:', error);
      process.exit(1);
    }
  });

program.parse();
