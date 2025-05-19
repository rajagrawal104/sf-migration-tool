const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');
const AuraParser = require('../parsers/auraParser');
const LWCGenerator = require('../generators/lwcGenerator');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../../client/build')));

// API endpoints
app.post('/api/convert', async (req, res) => {
  try {
    const { sourcePath, targetPath } = req.body;

    if (!sourcePath || !targetPath) {
      return res.status(400).json({ error: 'Source and target paths are required' });
    }

    // Validate source directory exists
    if (!fs.existsSync(sourcePath)) {
      return res.status(400).json({ error: 'Source directory does not exist' });
    }

    // Create target directory if it doesn't exist
    await fs.ensureDir(targetPath);

    const auraParser = new AuraParser();
    const lwcGenerator = new LWCGenerator();
    const results = [];

    // Read all Aura components from source directory
    const components = await fs.readdir(sourcePath);
    
    for (const component of components) {
      try {
        const componentPath = path.join(sourcePath, component);
        const stats = await fs.stat(componentPath);
        
        if (stats.isDirectory()) {
          // Parse Aura component
          const auraComponent = await auraParser.parseComponent(componentPath);
          
          // Generate LWC component
          await lwcGenerator.generateComponent(auraComponent, targetPath);
          
          results.push({
            component,
            status: 'success',
            message: 'Converted successfully'
          });
        }
      } catch (error) {
        results.push({
          component,
          status: 'error',
          message: error.message
        });
      }
    }

    res.json({
      success: true,
      message: 'Conversion completed',
      results
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Handle React routing, return all requests to React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../client/build', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 