class MetadataValidator {
  static validateProfile(profile) {
    const errors = [];
    
    if (!profile.name) {
      errors.push('Profile name is required');
    }
    
    if (!profile.userLicense) {
      errors.push('User license is required');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateCustomObject(object) {
    const errors = [];
    
    if (!object.name) {
      errors.push('Object name is required');
    }
    
    if (!object.label) {
      errors.push('Object label is required');
    }
    
    if (object.name && !object.name.endsWith('__c')) {
      errors.push('Custom object name must end with __c');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateApexClass(apexClass) {
    const errors = [];
    
    if (!apexClass.name) {
      errors.push('Class name is required');
    }
    
    if (!apexClass.body) {
      errors.push('Class body is required');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateApexTrigger(trigger) {
    const errors = [];
    
    if (!trigger.name) {
      errors.push('Trigger name is required');
    }
    
    if (!trigger.body) {
      errors.push('Trigger body is required');
    }
    
    if (!trigger.object) {
      errors.push('Trigger object is required');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateLayout(layout) {
    const errors = [];
    
    if (!layout.name) {
      errors.push('Layout name is required');
    }
    
    if (!layout.object) {
      errors.push('Layout object is required');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateValidationRule(rule) {
    const errors = [];
    
    if (!rule.name) {
      errors.push('Rule name is required');
    }
    
    if (!rule.errorMessage) {
      errors.push('Error message is required');
    }
    
    if (!rule.errorConditionFormula) {
      errors.push('Error condition formula is required');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validate(metadata) {
    const errors = [];
    
    for (const [type, data] of Object.entries(metadata)) {
      const validator = this[`validate${type}`];
      if (validator) {
        const result = validator(data);
        if (!result.isValid) {
          errors.push({
            type,
            errors: result.errors
          });
        }
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

/**
 * Validates a Salesforce Aura component for required attributes, tag matching, value provider usage,
 * controller method usage, and general warnings.
 * @param {Object} parsedAura - The parsed Aura component object.
 * @returns {Object} An object containing validation warnings and complexity analysis.
 */
function validateAuraComponent(parsedAura) {
  const warnings = [];

  // 1. Required Attributes
  if (parsedAura.attributes) {
    parsedAura.attributes.forEach(attr => {
      if (!attr.name) warnings.push('Attribute missing name.');
      if (!attr.type) warnings.push(`Attribute '${attr.name || 'unknown'}' missing type.`);
      if (attr.type === 'Object' && !attr.description) {
        warnings.push(`Attribute '${attr.name}' of type Object should have a description.`);
      }
    });
  }

  // 2. Tag Matching (basic check for known tags)
  const knownTags = [
    'aura:component', 'aura:attribute', 'aura:if', 'aura:set', 'aura:iteration',
    'aura:handler', 'aura:unescapedHtml', 'div', 'span', 'img', 'template'
  ];
  Object.keys(parsedAura).forEach(key => {
    if (!['attributes','ifNodes','iterationNodes','setNodes','unescapedHtmlNodes','handlerNodes','sldsNodes','labels','resources'].includes(key)) {
      if (!knownTags.includes(key)) {
        warnings.push(`Unknown or unsupported tag/section: '${key}'`);
      }
    }
  });

  // 3. Value Provider Usage
  if (parsedAura.attributes) {
    parsedAura.attributes.forEach(attr => {
      if (attr.default && /\{!c\./.test(attr.default)) {
        warnings.push(`Attribute '${attr.name}' default value should not reference controller methods.`);
      }
    });
  }

  // 4. Controller Method Usage (basic: check handler actions)
  if (parsedAura.handlerNodes) {
    parsedAura.handlerNodes.forEach(handler => {
      if (!handler.action) {
        warnings.push(`Handler for event '${handler.name}' missing action property.`);
      } else if (!/^\{!c\.[^}]+\}$/.test(handler.action)) {
        warnings.push(`Handler action '${handler.action}' does not reference a controller method.`);
      }
    });
  }

  // 5. Event Handler Action Properties
  if (parsedAura.handlerNodes) {
    parsedAura.handlerNodes.forEach(handler => {
      if (!handler.action) {
        warnings.push(`Handler for event '${handler.name}' missing action property.`);
      }
    });
  }

  // 6. General Warnings
  if (parsedAura.ifNodes && parsedAura.ifNodes.length > 0) {
    parsedAura.ifNodes.forEach(ifNode => {
      if (!ifNode.isTrue) warnings.push('aura:if missing isTrue property.');
    });
  }
  if (parsedAura.iterationNodes && parsedAura.iterationNodes.length > 0) {
    parsedAura.iterationNodes.forEach(iterNode => {
      if (!iterNode.items) warnings.push('aura:iteration missing items property.');
      if (!iterNode.varName) warnings.push('aura:iteration missing var property.');
    });
  }

  // Integrate complexity analysis
  const complexity = analyzeAuraComplexity(parsedAura);

  return { warnings, complexity };
}

/**
 * Analyzes the complexity of a Salesforce Aura component based on various metrics.
 * @param {Object} parsedAura - The parsed Aura component object.
 * @returns {Object} An object containing complexity metrics, score, and level.
 */
function analyzeAuraComplexity(parsedAura) {
  // Basic metrics
  const numAttributes = parsedAura.attributes ? parsedAura.attributes.length : 0;
  const numHandlers = parsedAura.handlerNodes ? parsedAura.handlerNodes.length : 0;
  const numIfs = parsedAura.ifNodes ? parsedAura.ifNodes.length : 0;
  const numIterations = parsedAura.iterationNodes ? parsedAura.iterationNodes.length : 0;
  const numSets = parsedAura.setNodes ? parsedAura.setNodes.length : 0;
  const numUnescapedHtml = parsedAura.unescapedHtmlNodes ? parsedAura.unescapedHtmlNodes.length : 0;
  const numSLDS = parsedAura.sldsNodes ? parsedAura.sldsNodes.length : 0;
  const numLabels = parsedAura.labels ? parsedAura.labels.length : 0;
  const numResources = parsedAura.resources ? parsedAura.resources.length : 0;

  // Weighted scoring system (example weights)
  const score =
    numAttributes * 1 +
    numHandlers * 2 +
    numIfs * 3 +
    numIterations * 3 +
    numSets * 1 +
    numUnescapedHtml * 2 +
    numSLDS * 1 +
    numLabels * 1 +
    numResources * 1;

  // Complexity level
  let level = 'LOW';
  if (score > 10 && score <= 25) level = 'MEDIUM';
  else if (score > 25 && score <= 50) level = 'HIGH';
  else if (score > 50) level = 'EXTREME';

  return {
    metrics: {
      attributes: numAttributes,
      handlers: numHandlers,
      ifs: numIfs,
      iterations: numIterations,
      sets: numSets,
      unescapedHtml: numUnescapedHtml,
      slds: numSLDS,
      labels: numLabels,
      resources: numResources
    },
    score,
    level
  };
}

module.exports = { validateAuraComponent, analyzeAuraComplexity }; 