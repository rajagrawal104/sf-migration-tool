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

module.exports = MetadataValidator; 