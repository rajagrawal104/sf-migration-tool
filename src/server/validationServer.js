const express = require('express');
const bodyParser = require('body-parser');
const { validateAuraComponent } = require('../validators/metadataValidator');
const AuraParser = require('../parsers/auraParser');

const app = express();
const port = 3001;

app.use(bodyParser.text({ type: 'text/xml' }));

// Validation endpoint
app.post('/validate', async (req, res) => {
  try {
    const auraContent = req.body;
    const parser = new AuraParser();
    const parsedAura = await parser.parseAuraComponent(auraContent);
    const validationResult = validateAuraComponent(parsedAura);
    
    res.json({
      success: true,
      data: validationResult
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`Validation server is running on port ${port}`);
}); 