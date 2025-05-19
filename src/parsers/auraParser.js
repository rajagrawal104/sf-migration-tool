const fs = require('fs-extra');
const path = require('path');
const xml2js = require('xml2js');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const t = require('@babel/types');

/**
 * AuraParser class for parsing Salesforce Aura components.
 * This class provides methods to parse Aura component XML content into a structured object.
 */
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

  // Parse aura:if
  parseAuraIf(node) {
    const isTrue = node.getAttribute('isTrue');
    const children = Array.from(node.children);
    let elseContent = null;
    let trueContent = null;

    for (const child of children) {
      if (child.tagName === 'aura:set' && child.getAttribute('attribute') === 'else') {
        elseContent = child.innerHTML;
      } else {
        trueContent = child.outerHTML;
      }
    }

    return {
      type: 'aura:if',
      isTrue,
      trueContent,
      elseContent
    };
  }

  // Parse aura:iteration
  parseAuraIteration(node) {
    const items = node.getAttribute('items');
    const varName = node.getAttribute('var');
    const content = node.innerHTML;
    return {
      type: 'aura:iteration',
      items,
      varName,
      content
    };
  }

  // Parse aura:set
  parseAuraSet(node) {
    const attribute = node.getAttribute('attribute');
    const content = node.innerHTML;
    return {
      type: 'aura:set',
      attribute,
      content
    };
  }

  // Parse aura:unescapedHtml
  parseAuraUnescapedHtml(node) {
    const value = node.getAttribute('value');
    return {
      type: 'aura:unescapedHtml',
      value
    };
  }

  // Parse $Label
  parseLabel(text) {
    const labelMatch = text.match(/\{\!\$Label\.c\.([^}]+)\}/);
    if (labelMatch) {
      return {
        type: 'label',
        value: labelMatch[1]
      };
    }
    return null;
  }

  // Parse $Resource
  parseResource(text) {
    const resourceMatch = text.match(/\{\!\$Resource\.([^}]+)\}/);
    if (resourceMatch) {
      return {
        type: 'resource',
        value: resourceMatch[1]
      };
    }
    return null;
  }

  // Parse aura:handler
  parseAuraHandler(node) {
    const name = node.getAttribute('name');
    const value = node.getAttribute('value');
    const action = node.getAttribute('action');
    return {
      type: 'aura:handler',
      name,
      value,
      action
    };
  }

  // Parse SLDS classes
  parseSLDSClasses(node) {
    const classAttr = node.getAttribute('class');
    if (classAttr && classAttr.includes('slds-')) {
      return {
        type: 'slds',
        classes: classAttr
      };
    }
    return null;
  }

  /**
   * Parses an Aura component XML content into a structured object.
   * @param {string} auraComponentContent - The XML content of the Aura component.
   * @returns {Object} The parsed Aura component object.
   */
  async parseAuraComponent(auraComponentContent) {
    // Use xml2js to parse the XML content
    const result = await this.xmlParser.parseStringPromise(auraComponentContent);
    // The root element is usually 'aura:component'
    const root = result['aura:component'] || result['Aura:component'] || result['component'] || result['AuraDefinitionBundle'] || result;
    const output = {};

    // Parse attributes
    output.attributes = [];
    if (root['aura:attribute']) {
      const attrs = Array.isArray(root['aura:attribute']) ? root['aura:attribute'] : [root['aura:attribute']];
      output.attributes = attrs.map(attr => ({
        name: attr.name,
        type: attr.type,
        default: attr.default
      }));
    }

    // Parse aura:if
    output.ifNodes = [];
    if (root['aura:if']) {
      const ifs = Array.isArray(root['aura:if']) ? root['aura:if'] : [root['aura:if']];
      output.ifNodes = ifs.map(ifNode => ({
        type: 'aura:if',
        isTrue: ifNode.isTrue,
        trueContent: ifNode._ || '',
        elseContent: ifNode['aura:set'] && ifNode['aura:set'].attribute === 'else' ? (ifNode['aura:set']._ || '') : null
      }));
    }

    // Parse aura:iteration
    output.iterationNodes = [];
    if (root['aura:iteration']) {
      const iters = Array.isArray(root['aura:iteration']) ? root['aura:iteration'] : [root['aura:iteration']];
      output.iterationNodes = iters.map(iterNode => ({
        type: 'aura:iteration',
        items: iterNode.items,
        varName: iterNode.var,
        content: iterNode._ || ''
      }));
    }

    // Parse aura:set
    output.setNodes = [];
    if (root['aura:set']) {
      const sets = Array.isArray(root['aura:set']) ? root['aura:set'] : [root['aura:set']];
      output.setNodes = sets.map(setNode => ({
        type: 'aura:set',
        attribute: setNode.attribute,
        content: setNode._ || ''
      }));
    }

    // Parse aura:unescapedHtml
    output.unescapedHtmlNodes = [];
    if (root['aura:unescapedHtml']) {
      const unescapedHtmls = Array.isArray(root['aura:unescapedHtml']) ? root['aura:unescapedHtml'] : [root['aura:unescapedHtml']];
      output.unescapedHtmlNodes = unescapedHtmls.map(htmlNode => ({
        type: 'aura:unescapedHtml',
        value: htmlNode.value
      }));
    }

    // Parse aura:handler
    output.handlerNodes = [];
    if (root['aura:handler']) {
      const handlers = Array.isArray(root['aura:handler']) ? root['aura:handler'] : [root['aura:handler']];
      output.handlerNodes = handlers.map(handlerNode => ({
        type: 'aura:handler',
        name: handlerNode.name,
        value: handlerNode.value,
        action: handlerNode.action
      }));
    }

    // Parse SLDS nodes
    output.sldsNodes = [];
    if (root['div'] && root['div'].class) {
      output.sldsNodes.push({
        type: 'slds',
        classes: root['div'].class
      });
    }

    // Parse labels
    output.labels = [];
    if (root['div'] && root['div']._) {
      const labelMatch = root['div']._.match(/\{\!\$Label\.c\.([^}]+)\}/);
      if (labelMatch) {
        output.labels.push({
          type: 'label',
          value: labelMatch[1]
        });
      }
    }

    // Parse resources
    output.resources = [];
    if (root['img'] && root['img'].src) {
      const resourceMatch = root['img'].src.match(/\{\!\$Resource\.([^}]+)\}/);
      if (resourceMatch) {
        output.resources.push({
          type: 'resource',
          value: resourceMatch[1]
        });
      }
    }

    return output;
  }
}

module.exports = AuraParser;
