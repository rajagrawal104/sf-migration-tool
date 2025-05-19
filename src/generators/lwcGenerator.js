const fs = require('fs-extra');
const path = require('path');

/**
 * LWCGenerator class for generating Lightning Web Components (LWC) from parsed Aura components.
 * This class provides methods to convert Aura component structures into LWC HTML and JS.
 */
class LWCGenerator {
  constructor() {
    this.template = {
      html: this.generateHTML.bind(this),
      js: this.generateJavaScript.bind(this),
      css: this.generateCSS.bind(this),
      meta: this.generateMeta.bind(this)
    };
  }

  async generateComponent(auraComponent, outputPath) {
    const componentName = this.convertToLWCName(auraComponent.name);
    const componentPath = path.join(outputPath, componentName);

    // Create component directory
    await fs.mkdir(componentPath, { recursive: true });

    // Generate files
    await Promise.all([
      this.generateHTML(auraComponent, componentPath),
      this.generateJavaScript(auraComponent, componentPath),
      this.generateCSS(auraComponent, componentPath),
      this.generateMeta(auraComponent, componentPath)
    ]);

    return {
      name: componentName,
      path: componentPath
    };
  }

  convertToLWCName(auraName) {
    // Convert camelCase to kebab-case and ensure proper LWC naming
    return auraName
      .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
      .toLowerCase();
  }

  async generateHTML(auraComponent, componentPath) {
    const html = this.convertMarkupToLWC(auraComponent.markup);
    await fs.writeFile(
      path.join(componentPath, `${this.convertToLWCName(auraComponent.name)}.html`),
      html
    );
  }

  async generateJavaScript(auraComponent, componentPath) {
    const js = this.convertJavaScriptToLWC(auraComponent);
    await fs.writeFile(
      path.join(componentPath, `${this.convertToLWCName(auraComponent.name)}.js`),
      js
    );
  }

  async generateCSS(auraComponent, componentPath) {
    const css = this.convertCSSToLWC(auraComponent.style);
    await fs.writeFile(
      path.join(componentPath, `${this.convertToLWCName(auraComponent.name)}.css`),
      css
    );
  }

  async generateMeta(auraComponent, componentPath) {
    const meta = this.generateMetaXML(auraComponent);
    await fs.writeFile(
      path.join(componentPath, `${this.convertToLWCName(auraComponent.name)}.js-meta.xml`),
      meta
    );
  }

  convertMarkupToLWC(markup) {
    let html = markup.template || '';
    
    // Convert Aura attributes to LWC
    html = html.replace(/aura:id="([^"]+)"/g, 'data-id="$1"');
    html = html.replace(/aura:iteration="([^"]+)"/g, 'for:each="$1" for:item="item"');
    html = html.replace(/aura:if="([^"]+)"/g, 'if:true="$1"');
    html = html.replace(/aura:elseif="([^"]+)"/g, 'if:false="$1"');
    html = html.replace(/aura:else/g, 'if:false');
    
    // Convert event handlers
    html = html.replace(/onclick="{!c\.([^}]+)}"/g, 'onclick="$1"');
    html = html.replace(/onchange="{!c\.([^}]+)}"/g, 'onchange="$1"');
    
    // Convert value bindings
    html = html.replace(/{!v\.([^}]+)}/g, '{$1}');
    
    return html;
  }

  convertJavaScriptToLWC(auraComponent) {
    const imports = new Set();
    const properties = new Set();
    const methods = new Set();

    // Convert attributes to properties
    if (auraComponent.attributes) {
      auraComponent.attributes.forEach(attr => {
        properties.add(`@api ${attr.name};`);
      });
    }

    // Convert controller and helper functions
    if (auraComponent.controller) {
      auraComponent.controller.functions.forEach(func => {
        methods.add(this.convertFunctionToLWC(func));
      });
    }

    if (auraComponent.helper) {
      auraComponent.helper.functions.forEach(func => {
        methods.add(this.convertFunctionToLWC(func));
      });
    }

    // Add standard imports
    imports.add("import { LightningElement, api } from 'lwc';");

    // Generate the JavaScript file
    return `${Array.from(imports).join('\n')}

export default class ${this.convertToLWCName(auraComponent.name)} extends LightningElement {
    ${Array.from(properties).join('\n    ')}

    ${Array.from(methods).join('\n    ')}
}`;
  }

  convertFunctionToLWC(func) {
    return `${func.name}(${func.params.join(', ')}) {
        ${func.body}
    }`;
  }

  convertCSSToLWC(css) {
    if (!css) return '';
    
    // Convert Aura-specific CSS to LWC
    return css
      .replace(/\.THIS/g, '')
      .replace(/\.THIS\./g, '.');
  }

  generateMetaXML(auraComponent) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<LightningComponentBundle xmlns="http://soap.sforce.com/2006/04/metadata">
    <apiVersion>57.0</apiVersion>
    <isExposed>false</isExposed>
</LightningComponentBundle>`;
  }

  /**
   * Generates LWC HTML and JS from a parsed Aura component.
   * @param {Object} parsedAura - The parsed Aura component object.
   * @returns {Object} An object containing the generated LWC HTML and JS.
   */
  generateLWC(parsedAura) {
    const html = this.generateLWCHTML(parsedAura);
    const js = this.generateLWCJS(parsedAura);
    return { html, js };
  }

  /**
   * Generates LWC HTML from a parsed Aura component.
   * @param {Object} parsedAura - The parsed Aura component object.
   * @returns {string} The generated LWC HTML.
   */
  generateLWCHTML(parsedAura) {
    let html = '';

    // Generate HTML for attributes
    if (parsedAura.attributes) {
      parsedAura.attributes.forEach(attr => {
        html += `<!-- ${attr.name}: ${attr.type} -->\n`;
      });
    }

    // Generate HTML for aura:if
    if (parsedAura.ifNodes) {
      parsedAura.ifNodes.forEach(ifNode => {
        html += `<template if:true={${ifNode.isTrue}}>\n  ${ifNode.trueContent}\n</template>\n`;
      });
    }

    // Generate HTML for aura:iteration
    if (parsedAura.iterationNodes) {
      parsedAura.iterationNodes.forEach(iterNode => {
        html += `<template for:each={${iterNode.items}} for:item="${iterNode.varName}">\n  <div key={${iterNode.varName}}>${iterNode.content}</div>\n</template>\n`;
      });
    }

    // Generate HTML for aura:set
    if (parsedAura.setNodes) {
      parsedAura.setNodes.forEach(setNode => {
        html += `<!-- aura:set attribute="${setNode.attribute}" -->\n`;
      });
    }

    // Generate HTML for aura:unescapedHtml
    if (parsedAura.unescapedHtmlNodes) {
      parsedAura.unescapedHtmlNodes.forEach(htmlNode => {
        html += `<div lwc:dom="manual" innerHTML={${htmlNode.value}}></div>\n`;
      });
    }

    // Generate HTML for SLDS nodes
    if (parsedAura.sldsNodes) {
      parsedAura.sldsNodes.forEach(sldsNode => {
        html += `<div class="${sldsNode.classes}"></div>\n`;
      });
    }

    // Generate HTML for labels
    if (parsedAura.labels) {
      parsedAura.labels.forEach(label => {
        html += `<span>{${label.value}}</span>\n`;
      });
    }

    // Generate HTML for resources
    if (parsedAura.resources) {
      parsedAura.resources.forEach(resource => {
        html += `<img src={${resource.value}} />\n`;
      });
    }

    return html;
  }

  /**
   * Generates LWC JS from a parsed Aura component.
   * @param {Object} parsedAura - The parsed Aura component object.
   * @returns {string} The generated LWC JS.
   */
  generateLWCJS(parsedAura) {
    let js = '';

    // Generate JS for labels
    if (parsedAura.labels) {
      parsedAura.labels.forEach(label => {
        js += `import ${label.value} from '@salesforce/label/c.${label.value}';\n`;
      });
    }

    // Generate JS for resources
    if (parsedAura.resources) {
      parsedAura.resources.forEach(resource => {
        js += `import ${resource.value} from '@salesforce/resourceUrl/${resource.value}';\n`;
      });
    }

    // Generate JS for handlers
    if (parsedAura.handlerNodes) {
      parsedAura.handlerNodes.forEach(handler => {
        js += `// TODO: Implement handle${handler.action} handler\n`;
      });
    }

    return js;
  }
}

function cleanValueBinding(str) {
    // Convert {!v.something} to {something}
    return str.replace(/\{!v\.(.*?)\}/g, '{$1}');
}

function cleanControllerReference(str) {
    // Convert {!c.method} to {handleMethod}
    return str.replace(/\{!c\.(.*?)\}/g, '{handle$1[0].toUpperCase() + $1.slice(1)}');
}

function cleanAll(str) {
    return cleanControllerReference(cleanValueBinding(str));
}

function generateLWC(auraParsed) {
    let lwcHTML = '';
    let jsImports = [];
    let jsHandlers = [];
    let jsLabels = [];
    let jsResources = [];

    // Handle $Label imports
    if (auraParsed.labels && auraParsed.labels.length > 0) {
        auraParsed.labels.forEach(label => {
            jsLabels.push(`import ${label.value} from '@salesforce/label/c.${label.value}';`);
        });
    }
    // Handle $Resource imports
    if (auraParsed.resources && auraParsed.resources.length > 0) {
        auraParsed.resources.forEach(resource => {
            jsResources.push(`import ${resource.value} from '@salesforce/resourceUrl/${resource.value}';`);
        });
    }

    // Generate attributes (for documentation/demo purposes)
    if (auraParsed.attributes) {
        lwcHTML += auraParsed.attributes.map(attr => `<!-- ${attr.name}: ${attr.type} -->`).join('\n');
    }

    // Generate aura:if
    if (auraParsed.ifNodes) {
        lwcHTML += auraParsed.ifNodes.map(ifNode => {
            const isTrue = cleanValueBinding(ifNode.isTrue || '');
            const trueContent = cleanAll(ifNode.trueContent || '');
            const elseContent = cleanAll(ifNode.elseContent || '');
            return `\n<template if:true=${isTrue}>\n  ${trueContent}\n</template>\n${elseContent ? `<template if:false=${isTrue}>\n  ${elseContent}\n</template>` : ''}\n`;
        }).join('');
    }

    // Generate aura:iteration
    if (auraParsed.iterationNodes) {
        lwcHTML += auraParsed.iterationNodes.map(iterNode => {
            const items = cleanValueBinding(iterNode.items || '');
            const varName = iterNode.varName || 'item';
            const content = cleanAll(iterNode.content || '');
            return `\n<template for:each=${items} for:item=\"${varName}\">\n  <div key={${varName}}>${content}</div>\n</template>\n`;
        }).join('');
    }

    // Generate aura:set
    if (auraParsed.setNodes) {
        lwcHTML += auraParsed.setNodes.map(setNode => {
            const content = cleanAll(setNode.content || '');
            return `\n<!-- aura:set attribute=\"${setNode.attribute}\" -->\n${content}\n`;
        }).join('');
    }

    // Generate aura:unescapedHtml
    if (auraParsed.unescapedHtmlNodes) {
        lwcHTML += auraParsed.unescapedHtmlNodes.map(unNode => {
            const value = cleanValueBinding(unNode.value || '');
            return `\n<div lwc:dom=\"manual\" innerHTML=${value}></div>\n`;
        }).join('');
    }

    // Generate aura:handler (as comments for now, and stub handler in JS)
    if (auraParsed.handlerNodes) {
        lwcHTML += auraParsed.handlerNodes.map(handlerNode => {
            let handlerName = handlerNode.action ? handlerNode.action.replace(/\{!c\.(.*?)\}/, 'handle$1') : '';
            if (handlerName) {
                jsHandlers.push(`// TODO: Implement ${handlerName} handler`);
            }
            return `\n<!-- aura:handler name=\"${handlerNode.name}\" value=\"${handlerNode.value}\" action=\"${handlerNode.action}\" -->\n`;
        }).join('');
    }

    // Generate SLDS classes
    if (auraParsed.sldsNodes) {
        lwcHTML += auraParsed.sldsNodes.map(sldsNode => {
            return `\n<div class=\"${sldsNode.classes}\"></div>\n`;
        }).join('');
    }

    // Generate $Label and $Resource usage in HTML
    if (auraParsed.labels) {
        lwcHTML += auraParsed.labels.map(labelNode => `\n<span>{${labelNode.value}}</span>\n`).join('');
    }
    if (auraParsed.resources) {
        lwcHTML += auraParsed.resources.map(resourceNode => `\n<img src={${resourceNode.value}} />\n`).join('');
    }

    // Compose JS output (imports + handler stubs)
    let jsOutput = '';
    if (jsLabels.length > 0 || jsResources.length > 0) {
        jsOutput += jsLabels.concat(jsResources).join('\n') + '\n';
    }
    jsOutput += jsHandlers.join('\n');

    return { html: lwcHTML.trim(), js: jsOutput.trim() };
}

module.exports = { generateLWC: (parsedAura) => new LWCGenerator().generateLWC(parsedAura) }; 