import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Card,
  CardContent
} from '@mui/material';
import { styled } from '@mui/material/styles';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import axios from 'axios';

const Input = styled('input')({
  display: 'none',
});

function App() {
  const [sourcePath, setSourcePath] = useState('');
  const [targetPath, setTargetPath] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [results, setResults] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    setResults([]);

    try {
      const response = await axios.post('http://localhost:3001/api/convert', {
        sourcePath,
        targetPath
      });

      setSuccess(true);
      setResults(response.data.results);
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred during conversion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Aura to LWC Converter
        </Typography>

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
          <TextField
            fullWidth
            label="Source Aura Components Directory"
            value={sourcePath}
            onChange={(e) => setSourcePath(e.target.value)}
            margin="normal"
            required
            helperText="Enter the full path to the directory containing Aura components"
          />

          <TextField
            fullWidth
            label="Target LWC Directory"
            value={targetPath}
            onChange={(e) => setTargetPath(e.target.value)}
            margin="normal"
            required
            helperText="Enter the full path where LWC components should be generated"
          />

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
            <Button
              type="submit"
              variant="contained"
              size="large"
              startIcon={<CloudUploadIcon />}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Start Conversion'}
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mt: 3 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mt: 3 }}>
            Conversion completed successfully!
          </Alert>
        )}

        {results.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Conversion Results:
            </Typography>
            <List>
              {results.map((result, index) => (
                <React.Fragment key={result.name}>
                  <ListItem>
                    <ListItemIcon>
                      {result.status === 'success' ? (
                        <CheckCircleIcon color="success" />
                      ) : (
                        <ErrorIcon color="error" />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={result.name}
                      secondary={
                        result.status === 'success'
                          ? `Converted successfully to ${result.path}`
                          : `Error: ${result.error}`
                      }
                    />
                  </ListItem>
                  {index < results.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Box>
        )}

        <Card sx={{ mt: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Conversion Details
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This tool converts Salesforce Aura components to Lightning Web Components (LWC) by:
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText primary="Converting Aura markup to LWC HTML" />
              </ListItem>
              <ListItem>
                <ListItemText primary="Transforming JavaScript controllers and helpers to LWC class" />
              </ListItem>
              <ListItem>
                <ListItemText primary="Adapting CSS styles to LWC format" />
              </ListItem>
              <ListItem>
                <ListItemText primary="Generating LWC metadata files" />
              </ListItem>
            </List>
          </CardContent>
        </Card>
      </Paper>
    </Container>
  );
}

export default App;
