class Formatter {
  static format(data) {
    throw new Error('format method must be implemented by subclass');
  }
}

class XMLFormatter extends Formatter {
  static format(data) {
    const xml2js = require('xml2js');
    const builder = new xml2js.Builder();
    return builder.buildObject(data);
  }
}

class JSONFormatter extends Formatter {
  static format(data) {
    return JSON.stringify(data, null, 2);
  }
}

class YAMLFormatter extends Formatter {
  static format(data) {
    const yaml = require('js-yaml');
    return yaml.dump(data);
  }
}

class FormatterFactory {
  static getFormatter(format) {
    switch (format.toLowerCase()) {
      case 'xml':
        return XMLFormatter;
      case 'json':
        return JSONFormatter;
      case 'yaml':
        return YAMLFormatter;
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }
}

module.exports = {
  Formatter,
  XMLFormatter,
  JSONFormatter,
  YAMLFormatter,
  FormatterFactory
}; 