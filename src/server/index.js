const express = require('express');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');
const AuraParser = require('../parsers/auraParser');
const LWCGenerator = require('../generators/lwcGenerator');
const app = express();
const port = process.env.PORT || 3001;

// Custom validation rules
const customValidationRules = {
  // Component structure rules
  componentStructure: {
    name: 'Component Structure',
    validate: (code) => {
      const errors = [];
      if (!code.includes('<aura:component')) {
        errors.push('Missing <aura:component> tag');
      }
      if (!code.includes('</aura:component>')) {
        errors.push('Missing closing </aura:component> tag');
      }
      return errors;
    }
  },
  
  // Attribute rules
  attributeRules: {
    name: 'Attribute Rules',
    validate: (code) => {
      const errors = [];
      const attributeRegex = /<aura:attribute[^>]*>/g;
      const matches = code.match(attributeRegex) || [];
      
      matches.forEach(match => {
        if (!match.includes('name=')) {
          errors.push('Attribute missing required "name" property');
        }
        if (!match.includes('type=')) {
          errors.push('Attribute missing required "type" property');
        }
        if (match.includes('type="Object"') && !match.includes('description=')) {
          errors.push('Object type attributes should include a description');
        }
      });
      
      return errors;
    }
  },
  
  // Event handling rules
  eventRules: {
    name: 'Event Handling Rules',
    validate: (code) => {
      const errors = [];
      const handlerRegex = /<aura:handler[^>]*>/g;
      const matches = code.match(handlerRegex) || [];
      
      matches.forEach(match => {
        if (!match.includes('name=')) {
          errors.push('Handler missing required "name" property');
        }
        if (!match.includes('value=')) {
          errors.push('Handler missing required "value" property');
        }
        if (match.includes('value="{!c.') && !match.includes('action=')) {
          errors.push('Controller method handlers should include an "action" property');
        }
      });
      
      return errors;
    }
  },
  
  // Value provider rules
  valueProviderRules: {
    name: 'Value Provider Rules',
    validate: (code) => {
      const errors = [];
      const valueRegex = /{!v\.[^}]+}/g;
      const matches = code.match(valueRegex) || [];
      
      matches.forEach(match => {
        if (!code.includes('aura:attribute') && !code.includes('aura:value')) {
          errors.push(`Value provider ${match} used without corresponding attribute or value definition`);
        }
      });
      
      return errors;
    }
  }
};

// Complexity analysis utilities
const calculateComplexity = (code, patterns) => {
  const metrics = {
    // Basic metrics
    attributes: patterns['aura:attribute'] || 0,
    handlers: patterns['aura:handler'] || 0,
    events: patterns['aura:event'] || 0,
    methods: patterns['aura:method'] || 0,
    valueProviders: patterns['aura:value'] || 0,
    
    // Advanced metrics
    iterations: patterns['aura:iteration'] || 0,
    conditionals: (patterns['aura:if'] || 0) + (patterns['aura:renderIf'] || 0),
    expressions: patterns['aura:expression'] || 0,
    dependencies: (patterns['aura:dependency'] || 0) + (patterns['aura:require'] || 0),
    
    // UI complexity
    uiElements: (patterns['aura:html'] || 0) + (patterns['aura:unescapedHtml'] || 0),
    loadingStates: (patterns['aura:waiting'] || 0) + (patterns['aura:loading'] || 0),
    
    // Advanced features
    urlAddressable: patterns['aura:isUrlAddressable'] || 0,
    renderers: patterns['aura:renderer'] || 0,
    clientLibraries: patterns['aura:clientLibrary'] || 0
  };

  // Calculate weighted scores
  const weights = {
    attributes: 1,
    handlers: 2,
    events: 2,
    methods: 2,
    valueProviders: 1,
    iterations: 3,
    conditionals: 2,
    expressions: 2,
    dependencies: 1,
    uiElements: 1,
    loadingStates: 1,
    urlAddressable: 1,
    renderers: 3,
    clientLibraries: 1
  };

  // Calculate weighted scores
  const weightedScores = {};
  let totalWeightedScore = 0;
  for (const [metric, value] of Object.entries(metrics)) {
    weightedScores[metric] = value * weights[metric];
    totalWeightedScore += weightedScores[metric];
  }

  // Calculate complexity levels
  const complexityLevels = {
    LOW: { max: 10, description: 'Simple component with basic functionality' },
    MEDIUM: { max: 25, description: 'Moderate complexity with some advanced features' },
    HIGH: { max: 50, description: 'Complex component with many features and interactions' },
    EXTREME: { max: Infinity, description: 'Very complex component requiring careful review' }
  };

  // Determine complexity level
  let complexityLevel = 'LOW';
  for (const [level, { max, description }] of Object.entries(complexityLevels)) {
    if (totalWeightedScore <= max) {
      complexityLevel = level;
      break;
    }
  }

  // Calculate risk factors
  const riskFactors = [];
  if (metrics.attributes > 10) riskFactors.push('High number of attributes may indicate tight coupling');
  if (metrics.handlers > 5) riskFactors.push('Many event handlers may indicate complex event flow');
  if (metrics.iterations > 3) riskFactors.push('Multiple iterations may impact performance');
  if (metrics.conditionals > 5) riskFactors.push('Many conditionals may indicate complex business logic');
  if (metrics.dependencies > 3) riskFactors.push('Multiple dependencies may increase maintenance burden');
  if (patterns['aura:unescapedHtml']) riskFactors.push('Using unescapedHtml may pose security risks');

  // Calculate maintainability score (0-100)
  const maintainabilityScore = Math.max(0, 100 - (totalWeightedScore * 2));

  // Generate recommendations
  const recommendations = [];
  if (metrics.attributes > 10) {
    recommendations.push('Consider splitting into smaller components');
  }
  if (metrics.handlers > 5) {
    recommendations.push('Consider consolidating event handlers');
  }
  if (metrics.iterations > 3) {
    recommendations.push('Consider using virtual scrolling for large lists');
  }
  if (patterns['aura:unescapedHtml']) {
    recommendations.push('Replace aura:unescapedHtml with aura:html for better security');
  }
  if (metrics.dependencies > 3) {
    recommendations.push('Review component dependencies for potential optimization');
  }

  return {
    metrics,
    weightedScores,
    totalWeightedScore,
    complexityLevel,
    complexityDescription: complexityLevels[complexityLevel].description,
    riskFactors,
    maintainabilityScore,
    recommendations
  };
};

// Enhanced validation utilities
const validateAuraCode = (code) => {
  const errors = [];
  const warnings = [];
  const statistics = {
    patterns: {},
    validations: {},
    complexity: {
      attributes: 0,
      handlers: 0,
      events: 0,
      methods: 0,
      valueProviders: 0
    }
  };
  
  if (!code) {
    errors.push('Aura code is required');
    return { errors, warnings, statistics };
  }

  // Run custom validation rules
  for (const [ruleName, rule] of Object.entries(customValidationRules)) {
    const ruleErrors = rule.validate(code);
    if (ruleErrors.length > 0) {
      errors.push(...ruleErrors.map(err => `${rule.name}: ${err}`));
    }
    statistics.validations[ruleName] = {
      passed: ruleErrors.length === 0,
      errors: ruleErrors
    };
  }

  // Enhanced pattern detection with statistics
  const patterns = {
    // Component structure
    'aura:component': /<aura:component[^>]*>/g,
    'aura:application': /<aura:application[^>]*>/g,
    'aura:interface': /<aura:interface[^>]*>/g,
    
    // Attributes and properties
    'aura:attribute': /<aura:attribute[^>]*>/g,
    'aura:set': /<aura:set[^>]*>/g,
    'aura:iteration': /<aura:iteration[^>]*>/g,
    
    // Events and handlers
    'aura:handler': /<aura:handler[^>]*>/g,
    'aura:registerEvent': /<aura:registerEvent[^>]*>/g,
    'aura:event': /<aura:event[^>]*>/g,
    'aura:method': /<aura:method[^>]*>/g,
    
    // Value providers
    'aura:value': /<aura:value[^>]*>/g,
    'aura:unescapedHtml': /<aura:unescapedHtml[^>]*>/g,
    
    // Dependencies
    'aura:dependency': /<aura:dependency[^>]*>/g,
    'aura:require': /<aura:require[^>]*>/g,
    
    // Advanced features
    'aura:if': /<aura:if[^>]*>/g,
    'aura:renderIf': /<aura:renderIf[^>]*>/g,
    'aura:expression': /<aura:expression[^>]*>/g,
    'aura:html': /<aura:html[^>]*>/g,
    
    // Additional patterns
    'aura:isUrlAddressable': /<aura:isUrlAddressable[^>]*>/g,
    'aura:renderer': /<aura:renderer[^>]*>/g,
    'aura:clientLibrary': /<aura:clientLibrary[^>]*>/g,
    'aura:waiting': /<aura:waiting[^>]*>/g,
    'aura:loading': /<aura:loading[^>]*>/g
  };

  // Pattern detection and validation with statistics
  for (const [pattern, regex] of Object.entries(patterns)) {
    const matches = code.match(regex) || [];
    statistics.patterns[pattern] = matches.length;
    
    // Update complexity metrics
    if (pattern === 'aura:attribute') statistics.complexity.attributes = matches.length;
    if (pattern === 'aura:handler') statistics.complexity.handlers = matches.length;
    if (pattern === 'aura:event') statistics.complexity.events = matches.length;
    if (pattern === 'aura:method') statistics.complexity.methods = matches.length;
    if (pattern === 'aura:value') statistics.complexity.valueProviders = matches.length;
    
    // Pattern-specific validations
    switch (pattern) {
      case 'aura:attribute':
        matches.forEach(match => {
          if (!match.includes('name=') || !match.includes('type=')) {
            errors.push(`Invalid ${pattern}: Missing required attributes (name, type)`);
          }
          if (match.includes('type="Object"') && !match.includes('description=')) {
            warnings.push(`Object type attribute should include a description`);
          }
        });
        break;
        
      case 'aura:handler':
        matches.forEach(match => {
          if (!match.includes('name=') || !match.includes('value=')) {
            errors.push(`Invalid ${pattern}: Missing required attributes (name, value)`);
          }
          if (match.includes('value="{!c.') && !match.includes('action=')) {
            warnings.push(`Controller method handler should include an action property`);
          }
        });
        break;
        
      case 'aura:method':
        matches.forEach(match => {
          if (!match.includes('name=') || !match.includes('action=')) {
            errors.push(`Invalid ${pattern}: Missing required attributes (name, action)`);
          }
        });
        break;
        
      case 'aura:unescapedHtml':
        warnings.push('Using aura:unescapedHtml may pose security risks. Consider using aura:html instead.');
        break;
    }
  }

  // Check for deprecated patterns
  const deprecatedPatterns = {
    'aura:unescapedHtml': 'Consider using aura:html instead for better security',
    'aura:expression': 'Consider using aura:if or aura:renderIf instead',
    'aura:renderer': 'Consider using aura:if or aura:renderIf instead',
    'aura:waiting': 'Consider using aura:loading instead'
  };

  for (const [pattern, warning] of Object.entries(deprecatedPatterns)) {
    if (statistics.patterns[pattern] > 0) {
      warnings.push(warning);
    }
  }

  // Check for common issues
  if (code.includes('{!v.') && !code.includes('aura:value')) {
    warnings.push('Using value providers without aura:value may cause issues');
  }

  if (code.includes('{!c.') && !code.includes('aura:method')) {
    warnings.push('Using controller methods without aura:method may cause issues');
  }

  // Calculate enhanced complexity analysis
  const complexityAnalysis = calculateComplexity(code, statistics.patterns);
  statistics.complexity = {
    ...statistics.complexity,
    ...complexityAnalysis
  };

  return { errors, warnings, statistics };
};

// Enhanced conversion utilities
const convertSingleFile = async (auraCode, fileName) => {
  const auraParser = new AuraParser();
  const lwcGenerator = new LWCGenerator();

  try {
    // Validate before conversion
    const { errors, warnings, statistics } = validateAuraCode(auraCode);
    if (errors.length > 0) {
      return {
        fileName,
        success: false,
        errors,
        warnings,
        statistics
      };
    }

    const parsedAura = await auraParser.parse(auraCode);
    const lwcCode = await lwcGenerator.generate(parsedAura);
    
    return {
      fileName,
      success: true,
      lwcCode,
      warnings,
      statistics
    };
  } catch (err) {
    return {
      fileName,
      success: false,
      error: err.message,
      stack: err.stack
    };
  }
};

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello from Express server with cors, fs-extra, path, AuraParser, and LWCGenerator!');
});

app.get('/fs-check', async (req, res) => {
  try {
    const files = await fs.readdir(path.resolve(__dirname));
    res.json({ files });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/aura-check', (req, res) => {
  try {
    const auraParser = new AuraParser();
    res.json({ message: 'AuraParser instantiated successfully!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/lwc-check', (req, res) => {
  try {
    const lwcGenerator = new LWCGenerator();
    res.json({ message: 'LWCGenerator instantiated successfully!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/convert', async (req, res) => {
  try {
    const { files, singleFile } = req.body;
    
    // Handle single file conversion
    if (singleFile) {
      const result = await convertSingleFile(singleFile, 'component');
      return res.json(result);
    }
    
    // Handle multiple files
    if (!files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ 
        success: false,
        error: 'No files provided for conversion' 
      });
    }

    const results = [];
    const errors = [];
    const warnings = [];
    const allStatistics = {};

    // Process each file
    for (const file of files) {
      const result = await convertSingleFile(file.content, file.name);
      results.push(result);
      
      if (!result.success) {
        errors.push({
          fileName: file.name,
          errors: result.errors
        });
      }
      
      if (result.warnings) {
        warnings.push({
          fileName: file.name,
          warnings: result.warnings
        });
      }

      if (result.statistics) {
        allStatistics[file.name] = result.statistics;
      }
    }

    // Calculate overall statistics
    const overallStatistics = {
      totalFiles: files.length,
      successfulConversions: results.filter(r => r.success).length,
      failedConversions: results.filter(r => !r.success).length,
      totalWarnings: warnings.reduce((sum, w) => sum + w.warnings.length, 0),
      complexity: {
        average: Object.values(allStatistics).reduce((sum, stats) => sum + stats.complexity.score, 0) / files.length,
        highest: Math.max(...Object.values(allStatistics).map(stats => stats.complexity.score)),
        lowest: Math.min(...Object.values(allStatistics).map(stats => stats.complexity.score))
      }
    };

    // Return combined results
    res.json({
      success: errors.length === 0,
      convertedFiles: results,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
      statistics: {
        files: allStatistics,
        overall: overallStatistics
      }
    });

  } catch (err) {
    console.error('Conversion error:', err);
    res.status(500).json({ 
      success: false,
      error: 'Failed to convert Aura to LWC',
      details: err.message,
      stack: err.stack
    });
  }
});

// Enhanced status endpoint
app.get('/api/convert/status', (req, res) => {
  res.json({
    status: 'ready',
    supportedPatterns: [
      // Component structure
      'aura:component',
      'aura:application',
      'aura:interface',
      
      // Attributes and properties
      'aura:attribute',
      'aura:set',
      'aura:iteration',
      
      // Events and handlers
      'aura:handler',
      'aura:registerEvent',
      'aura:event',
      'aura:method',
      
      // Value providers
      'aura:value',
      'aura:unescapedHtml',
      
      // Dependencies
      'aura:dependency',
      'aura:require',
      
      // Advanced features
      'aura:if',
      'aura:renderIf',
      'aura:expression',
      'aura:html',
      
      // Additional patterns
      'aura:isUrlAddressable',
      'aura:renderer',
      'aura:clientLibrary',
      'aura:waiting',
      'aura:loading'
    ],
    deprecatedPatterns: {
      'aura:unescapedHtml': 'Consider using aura:html instead for better security',
      'aura:expression': 'Consider using aura:if or aura:renderIf instead',
      'aura:renderer': 'Consider using aura:if or aura:renderIf instead',
      'aura:waiting': 'Consider using aura:loading instead'
    },
    validationRules: [
      'Basic component structure',
      'Required attributes for patterns',
      'Tag matching',
      'Value provider usage',
      'Controller method usage',
      'Object type attribute descriptions',
      'Event handler action properties',
      'Component complexity scoring'
    ],
    complexityAnalysis: {
      metrics: [
        'Basic metrics (attributes, handlers, events, methods)',
        'Advanced metrics (iterations, conditionals, expressions)',
        'UI complexity (HTML elements, loading states)',
        'Advanced features (URL addressable, renderers, client libraries)'
      ],
      scoring: {
        weights: {
          attributes: 1,
          handlers: 2,
          events: 2,
          methods: 2,
          valueProviders: 1,
          iterations: 3,
          conditionals: 2,
          expressions: 2,
          dependencies: 1,
          uiElements: 1,
          loadingStates: 1,
          urlAddressable: 1,
          renderers: 3,
          clientLibraries: 1
        },
        levels: {
          LOW: '0-10: Simple component with basic functionality',
          MEDIUM: '11-25: Moderate complexity with some advanced features',
          HIGH: '26-50: Complex component with many features and interactions',
          EXTREME: '50+: Very complex component requiring careful review'
        }
      },
      riskFactors: [
        'High number of attributes',
        'Many event handlers',
        'Multiple iterations',
        'Complex conditionals',
        'Multiple dependencies',
        'Security risks'
      ],
      recommendations: [
        'Component splitting',
        'Event handler consolidation',
        'Performance optimization',
        'Security improvements',
        'Dependency optimization'
      ]
    }
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 