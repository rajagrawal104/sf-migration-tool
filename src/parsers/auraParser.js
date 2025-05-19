const fs = require('fs-extra');
const path = require('path');
const xml2js = require('xml2js');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const t = require('@babel/types');

class AuraParser {
  constructor() {
    this.xmlParser = new xml2js.Parser({
      explicitArray: false,
      mergeAttrs: true
    });
  }

  async parseComponent(componentPath) {
    const componentName = path.basename(componentPath, '.cmp');
    const files = await fs.readdir(componentPath);
    
    const component = {
      name: componentName,
      markup: null,
      controller: null,
      helper: null,
      style: null,
      design: null,
      documentation: null,
      svg: null,
      attributes: [],
      events: [],
      dependencies: []
    };

    for (const file of files) {
      const filePath = path.join(componentPath, file);
      const content = await fs.readFile(filePath, 'utf8');
      const ext = path.extname(file);

      switch (ext) {
        case '.cmp':
          component.markup = await this.parseMarkup(content);
          break;
        case '.js':
          if (file.endsWith('Controller.js')) {
            component.controller = this.parseJavaScript(content);
          } else if (file.endsWith('Helper.js')) {
            component.helper = this.parseJavaScript(content);
          }
          break;
        case '.css':
          component.style = content;
          break;
        case '.design':
          component.design = await this.parseDesign(content);
          break;
        case '.auradoc':
          component.documentation = content;
          break;
        case '.svg':
          component.svg = content;
          break;
      }
    }

    return component;
  }

  async parseMarkup(content) {
    const result = await this.xmlParser.parseStringPromise(content);
    const auraComponent = result.AuraDefinitionBundle;

    // Parse attributes
    if (auraComponent.attributes) {
      const attributes = Array.isArray(auraComponent.attributes) 
        ? auraComponent.attributes 
        : [auraComponent.attributes];
      
      for (const attr of attributes) {
        this.parseAttribute(attr);
      }
    }

    // Parse events
    if (auraComponent.events) {
      const events = Array.isArray(auraComponent.events)
        ? auraComponent.events
        : [auraComponent.events];
      
      for (const event of events) {
        this.parseEvent(event);
      }
    }

    return auraComponent;
  }

  parseJavaScript(content) {
    const ast = parser.parse(content, {
      sourceType: 'module',
      plugins: ['jsx']
    });

    const functions = [];
    const variables = [];
    const imports = [];

    traverse(ast, {
      FunctionDeclaration(path) {
        functions.push({
          name: path.node.id.name,
          params: path.node.params.map(p => p.name),
          body: content.slice(path.node.body.start, path.node.body.end)
        });
      },
      VariableDeclarator(path) {
        if (t.isIdentifier(path.node.id)) {
          variables.push({
            name: path.node.id.name,
            value: path.node.init ? content.slice(path.node.init.start, path.node.init.end) : null
          });
        }
      },
      ImportDeclaration(path) {
        imports.push({
          source: path.node.source.value,
          specifiers: path.node.specifiers.map(s => ({
            type: s.type,
            name: s.local.name,
            imported: s.imported ? s.imported.name : null
          }))
        });
      }
    });

    return {
      functions,
      variables,
      imports
    };
  }

  async parseDesign(content) {
    return await this.xmlParser.parseStringPromise(content);
  }

  parseAttribute(attr) {
    return {
      name: attr.name,
      type: attr.type,
      default: attr.default,
      description: attr.description,
      required: attr.required === 'true'
    };
  }

  parseEvent(event) {
    return {
      name: event.name,
      type: event.type,
      description: event.description
    };
  }
}

module.exports = AuraParser;
