const fs = require('fs-extra');
const path = require('path');
const xml2js = require('xml2js');

class XMLParser {
  constructor() {
    this.parser = new xml2js.Parser({
      explicitArray: false,
      mergeAttrs: true
    });
  }

  async parseFile(filePath) {
    try {
      const xmlContent = await fs.readFile(filePath, 'utf8');
      const result = await this.parser.parseStringPromise(xmlContent);
      return result;
    } catch (error) {
      throw new Error(`Error parsing XML file ${filePath}: ${error.message}`);
    }
  }

  async parseDirectory(directoryPath) {
    try {
      const files = await fs.readdir(directoryPath);
      const xmlFiles = files.filter(file => file.endsWith('.xml'));
      
      const results = {};
      for (const file of xmlFiles) {
        const filePath = path.join(directoryPath, file);
        const parsedData = await this.parseFile(filePath);
        results[file] = parsedData;
      }
      
      return results;
    } catch (error) {
      throw new Error(`Error parsing directory ${directoryPath}: ${error.message}`);
    }
  }

  async writeFile(filePath, data) {
    try {
      const builder = new xml2js.Builder();
      const xml = builder.buildObject(data);
      await fs.writeFile(filePath, xml);
    } catch (error) {
      throw new Error(`Error writing XML file ${filePath}: ${error.message}`);
    }
  }
}

module.exports = XMLParser; 