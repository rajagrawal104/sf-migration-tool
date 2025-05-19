class MetadataMapper {
  constructor() {
    this.mappings = new Map();
    this.initializeDefaultMappings();
  }

  initializeDefaultMappings() {
    this.addMapping('Profile', 'Profile', MetadataMapper.transformProfile);
    this.addMapping('CustomObject', 'CustomObject', MetadataMapper.transformCustomObject);
    this.addMapping('ApexClass', 'ApexClass', MetadataMapper.transformApexClass);
    this.addMapping('ApexTrigger', 'ApexTrigger', MetadataMapper.transformApexTrigger);
    this.addMapping('Layout', 'Layout', MetadataMapper.transformLayout);
    this.addMapping('ValidationRule', 'ValidationRule', MetadataMapper.transformValidationRule);
  }

  addMapping(sourceType, targetType, transformFn) {
    this.mappings.set(sourceType, {
      targetType,
      transform: transformFn
    });
  }

  async transform(metadata) {
    const result = {};
    
    for (const [key, value] of Object.entries(metadata)) {
      const mapping = this.mappings.get(key);
      if (mapping) {
        result[key] = await mapping.transform(value);
      } else {
        // If no mapping exists, copy as is
        result[key] = value;
      }
    }
    
    return result;
  }

  // Common transformation functions
  static async transformProfile(profile) {
    const transformed = { ...profile };
    
    // Remove sensitive or unnecessary fields
    delete transformed.passwordPolicies;
    delete transformed.loginHours;
    delete transformed.sessionSettings;
    
    // Ensure required fields
    if (!transformed.userLicense) {
      transformed.userLicense = 'Salesforce';
    }
    
    return transformed;
  }

  static async transformCustomObject(object) {
    const transformed = { ...object };
    
    // Ensure required fields
    if (!transformed.label) {
      transformed.label = transformed.name;
    }
    
    // Remove deployment-specific fields
    delete transformed.deploymentStatus;
    delete transformed.sharingModel;
    
    return transformed;
  }

  static async transformApexClass(apexClass) {
    const transformed = { ...apexClass };
    
    // Remove deployment-specific fields
    delete transformed.status;
    delete transformed.apiVersion;
    
    return transformed;
  }

  static async transformApexTrigger(trigger) {
    const transformed = { ...trigger };
    
    // Remove deployment-specific fields
    delete transformed.status;
    delete transformed.apiVersion;
    
    return transformed;
  }

  static async transformLayout(layout) {
    const transformed = { ...layout };
    
    // Remove deployment-specific fields
    delete transformed.showEmailCheckbox;
    delete transformed.showHighlightsPanel;
    
    return transformed;
  }

  static async transformValidationRule(rule) {
    const transformed = { ...rule };
    
    // Ensure required fields
    if (!transformed.active) {
      transformed.active = true;
    }
    
    return transformed;
  }
}

module.exports = MetadataMapper; 