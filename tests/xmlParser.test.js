const XMLParser = require('../src/parsers/xmlParser');
const fs = require('fs-extra');
const path = require('path');

jest.mock('fs-extra');

describe('XMLParser', () => {
  let parser;
  const mockXmlContent = `
    <CustomObject>
      <label>Test Object</label>
      <name>Test__c</name>
    </CustomObject>
  `;

  beforeEach(() => {
    parser = new XMLParser();
    fs.readFile.mockResolvedValue(mockXmlContent);
    fs.readdir.mockResolvedValue(['test.xml']);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('parseFile should parse XML content correctly', async () => {
    const result = await parser.parseFile('test.xml');
    expect(result.CustomObject).toBeDefined();
    expect(result.CustomObject.label).toBe('Test Object');
    expect(result.CustomObject.name).toBe('Test__c');
  });

  test('parseDirectory should parse all XML files', async () => {
    const result = await parser.parseDirectory('./test-dir');
    expect(Object.keys(result)).toHaveLength(1);
    expect(result['test.xml']).toBeDefined();
  });

  test('writeFile should write XML content correctly', async () => {
    const testData = {
      CustomObject: {
        label: 'Test Object',
        name: 'Test__c'
      }
    };
    await parser.writeFile('test.xml', testData);
    expect(fs.writeFile).toHaveBeenCalled();
  });
}); 