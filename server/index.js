/**
 * Main server file for the Aura to LWC Converter application
 * Handles file uploads, repository connections, and WebSocket communications
 */

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const expressWs = require('express-ws');
const repositoryRoutes = require('./routes/repositoryRoutes');

// Initialize Express app with WebSocket support
const app = express();
expressWs(app);

// Configure middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse JSON request bodies

// Define directory paths for file storage
const uploadsDir = path.join(__dirname, 'uploads'); // Temporary storage for uploaded files
const tempDir = path.join(__dirname, 'temp'); // Temporary storage for repository clones

/**
 * Creates necessary directories if they don't exist
 * uploadsDir: For temporary storage of uploaded files
 * tempDir: For temporary storage of cloned repositories
 */
async function createDirectories() {
  try {
    await fs.mkdir(uploadsDir, { recursive: true });
    await fs.mkdir(tempDir, { recursive: true });
  } catch (error) {
    console.error('Error creating directories:', error);
  }
}

// Initialize directories
createDirectories();

// Mount repository routes
app.use('/api', repositoryRoutes);

// Configure multer for file uploads
const upload = multer({ dest: uploadsDir });

/**
 * File upload endpoint
 * Handles multiple file uploads and initiates conversion process
 * POST /api/convert
 */
app.post('/api/convert', upload.array('files'), async (req, res) => {
  try {
    const files = req.files;
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const results = [];
    for (const file of files) {
      try {
        // TODO: Implement actual conversion logic here
        results.push({
          name: file.originalname,
          status: 'success',
          warnings: []
        });

        // Clean up uploaded file after processing
        await fs.unlink(file.path);
      } catch (error) {
        results.push({
          name: file.originalname,
          status: 'error',
          error: error.message
        });
      }
    }

    res.json({ results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 