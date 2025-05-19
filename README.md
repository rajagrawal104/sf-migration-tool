# Salesforce Aura to LWC Migration Tool

A powerful tool for converting Salesforce Aura components to Lightning Web Components (LWC) with advanced analysis and validation capabilities.

## Features

- **Component Conversion**: Convert Aura components to LWC with high accuracy
- **Advanced Analysis**: Detailed complexity analysis and maintainability scoring
- **Pattern Detection**: Automatic detection of Aura patterns and features
- **Validation Rules**: Comprehensive validation of Aura component structure
- **Risk Assessment**: Identification of potential issues and security risks
- **Smart Recommendations**: Actionable suggestions for component optimization

## Prerequisites

- Node.js 16.x or later
- npm 7.x or later
- macOS (for building the application)
- ImageMagick (for icon generation)
- create-dmg (for DMG creation)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/rajagrawal104/sf-migration-tool.git
cd sf-migration-tool
```

2. Install dependencies:
```bash
npm install
```

3. Install global dependencies:
```bash
npm install -g create-dmg
```

4. Install ImageMagick (macOS):
```bash
brew install imagemagick
```

## Building the Application

1. Make the build script executable:
```bash
chmod +x scripts/build-macos.sh
```

2. Run the build script:
```bash
./scripts/build-macos.sh
```

The build process will:
- Create application icons
- Build the React client
- Package the server
- Create a DMG installer

## Running the Application

### Development Mode

1. Start the server:
```bash
npm run dev
```

2. Start the client (in a new terminal):
```bash
cd client
npm start
```

The application will be available at `http://localhost:3000`

### Production Mode

1. Run the packaged application:
```bash
./dist/aura-lwc-converter
```

## API Endpoints

### Convert Aura to LWC
```http
POST /api/convert
Content-Type: application/json

{
  "singleFile": "<aura:component>...</aura:component>"
}
```

or

```http
POST /api/convert
Content-Type: application/json

{
  "files": [
    {
      "name": "component1",
      "content": "<aura:component>...</aura:component>"
    }
  ]
}
```

### Check Server Status
```http
GET /api/convert/status
```

## Complexity Analysis

The tool provides detailed complexity analysis including:

- Basic metrics (attributes, handlers, events, methods)
- Advanced metrics (iterations, conditionals, expressions)
- UI complexity (HTML elements, loading states)
- Advanced features (URL addressable, renderers, client libraries)

### Complexity Levels

- **LOW** (0-10): Simple component with basic functionality
- **MEDIUM** (11-25): Moderate complexity with some advanced features
- **HIGH** (26-50): Complex component with many features and interactions
- **EXTREME** (50+): Very complex component requiring careful review

## Validation Rules

The tool validates:

- Component structure
- Required attributes
- Tag matching
- Value provider usage
- Controller method usage
- Object type attribute descriptions
- Event handler action properties
- Component complexity scoring

## Example Usage

### Single Component Conversion
```json
{
  "singleFile": "<aura:component>
    <aura:attribute name=\"message\" type=\"String\"/>
    <aura:handler name=\"init\" value=\"{!c.doInit}\"/>
    <div>{!v.message}</div>
  </aura:component>"
}
```

### Multiple Component Conversion
```json
{
  "files": [
    {
      "name": "component1",
      "content": "<aura:component>...</aura:component>"
    },
    {
      "name": "component2",
      "content": "<aura:component>...</aura:component>"
    }
  ]
}
```

## Response Format

```json
{
  "success": true,
  "convertedFiles": [
    {
      "fileName": "component1",
      "success": true,
      "lwcCode": "...",
      "warnings": [...],
      "statistics": {
        "metrics": {...},
        "weightedScores": {...},
        "totalWeightedScore": 15,
        "complexityLevel": "MEDIUM",
        "riskFactors": [...],
        "maintainabilityScore": 70,
        "recommendations": [...]
      }
    }
  ]
}
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Salesforce Lightning Web Components
- React
- Express.js
- Node.js
