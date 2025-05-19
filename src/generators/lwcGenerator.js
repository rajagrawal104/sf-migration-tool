const fs = require('fs-extra');
const path = require('path');

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
}

module.exports = LWCGenerator; 