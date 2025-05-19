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
  CardContent,
  IconButton,
  ThemeProvider,
  createTheme,
  CssBaseline,
  Stepper,
  Step,
  StepLabel,
  Chip,
  Tooltip,
  Tab,
  Tabs,
  useMediaQuery
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  CloudUpload as CloudUploadIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  Code as CodeIcon,
  Assessment as AssessmentIcon,
  Warning as WarningIcon,
  Storage as StorageIcon,
  Folder as FolderIcon
} from '@mui/icons-material';
import axios from 'axios';
import RepositoryConnector from './components/RepositoryConnector';

// Custom theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#0176d3', // Salesforce blue
    },
    secondary: {
      main: '#1589ee', // Salesforce light blue
    },
    background: {
      default: '#f3f2f2',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Salesforce Sans", "Helvetica Neue", Helvetica, Arial, sans-serif',
    h4: {
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 4,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
  },
});

const darkTheme = createTheme({
  ...theme,
  palette: {
    mode: 'dark',
    primary: {
      main: '#0176d3',
    },
    secondary: {
      main: '#1589ee',
    },
    background: {
      default: '#1a1a1a',
      paper: '#2d2d2d',
    },
  },
});

const Input = styled('input')({
  display: 'none',
});

const FileDropZone = styled(Box)(({ theme }) => ({
  border: `2px dashed ${theme.palette.primary.main}`,
  borderRadius: 8,
  padding: theme.spacing(4),
  textAlign: 'center',
  cursor: 'pointer',
  backgroundColor: theme.palette.background.paper,
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
}));

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [results, setResults] = useState([]);
  const [activeStep, setActiveStep] = useState(0);
  const [activeTab, setActiveTab] = useState(0);
  const [sourceType, setSourceType] = useState('local'); // 'local' or 'repository'
  const [selectedRepo, setSelectedRepo] = useState(null);
  const isMobile = useMediaQuery('(max-width:600px)');

  const handleFileDrop = (event) => {
    event.preventDefault();
    const droppedFiles = Array.from(event.dataTransfer.files);
    setFiles(droppedFiles);
  };

  const handleFileSelect = (event) => {
    const selectedFiles = Array.from(event.target.files);
    setFiles(selectedFiles);
  };

  const handleRepositorySelect = (repo) => {
    setSelectedRepo(repo);
    setSourceType('repository');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    setResults([]);
    setActiveStep(0);

    try {
      let response;
      if (sourceType === 'local') {
        const formData = new FormData();
        files.forEach(file => {
          formData.append('files', file);
        });

        response = await axios.post('http://localhost:3001/api/convert', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      } else {
        // Repository-based conversion
        response = await axios.post('http://localhost:3001/api/convert-repo', {
          repository: selectedRepo,
        });
      }

      setSuccess(true);
      setResults(response.data.results);
      setActiveStep(2);
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred during conversion');
      setActiveStep(1);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const steps = ['Select Source', 'Converting', 'Results'];

  return (
    <ThemeProvider theme={darkMode ? darkTheme : theme}>
      <CssBaseline />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Aura to LWC Converter
          </Typography>
          <IconButton onClick={toggleDarkMode} color="inherit">
            {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>
        </Box>

        <Paper elevation={3} sx={{ p: 4 }}>
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <Box component="form" onSubmit={handleSubmit}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Select Source Type
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant={sourceType === 'local' ? 'contained' : 'outlined'}
                  startIcon={<FolderIcon />}
                  onClick={() => setSourceType('local')}
                >
                  Local Files
                </Button>
                <Button
                  variant={sourceType === 'repository' ? 'contained' : 'outlined'}
                  startIcon={<StorageIcon />}
                  onClick={() => setSourceType('repository')}
                >
                  Repository
                </Button>
              </Box>
            </Box>

            {sourceType === 'local' ? (
              <FileDropZone
                onDrop={handleFileDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => document.getElementById('file-input').click()}
              >
                <input
                  id="file-input"
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
                <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Drop Aura Components Here
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  or click to select files
                </Typography>
                {files.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2">Selected Files:</Typography>
                    <List dense>
                      {files.map((file, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <CodeIcon />
                          </ListItemIcon>
                          <ListItemText primary={file.name} />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
              </FileDropZone>
            ) : (
              <RepositoryConnector onRepositorySelect={handleRepositorySelect} />
            )}

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
              <Button
                type="submit"
                variant="contained"
                size="large"
                startIcon={<CloudUploadIcon />}
                disabled={loading || (sourceType === 'local' ? files.length === 0 : !selectedRepo)}
              >
                {loading ? <CircularProgress size={24} /> : 'Start Conversion'}
              </Button>
            </Box>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mt: 3 }}>
              <Typography variant="subtitle2">{error}</Typography>
            </Alert>
          )}

          {success && results.length > 0 && (
            <Box sx={{ mt: 4 }}>
              <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 2 }}>
                <Tab icon={<CodeIcon />} label="Conversion Results" />
                <Tab icon={<AssessmentIcon />} label="Complexity Analysis" />
              </Tabs>

              {activeTab === 0 && (
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
                        {result.warnings && result.warnings.length > 0 && (
                          <Tooltip title={result.warnings.join('\n')}>
                            <WarningIcon color="warning" />
                          </Tooltip>
                        )}
                      </ListItem>
                      {index < results.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}

              {activeTab === 1 && (
                <Box>
                  {results.map((result) => (
                    <Card key={result.name} sx={{ mb: 2 }}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          {result.name}
                        </Typography>
                        {result.statistics && (
                          <Box>
                            <Typography variant="subtitle2" gutterBottom>
                              Complexity Level: {result.statistics.complexity.level}
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                              {Object.entries(result.statistics.complexity.metrics).map(([key, value]) => (
                                <Chip
                                  key={key}
                                  label={`${key}: ${value}`}
                                  size="small"
                                  color="primary"
                                  variant="outlined"
                                />
                              ))}
                            </Box>
                            {result.statistics.complexity.riskFactors && (
                              <Box sx={{ mt: 2 }}>
                                <Typography variant="subtitle2" gutterBottom>
                                  Risk Factors:
                                </Typography>
                                <List dense>
                                  {result.statistics.complexity.riskFactors.map((factor, index) => (
                                    <ListItem key={index}>
                                      <ListItemIcon>
                                        <WarningIcon color="warning" />
                                      </ListItemIcon>
                                      <ListItemText primary={factor} />
                                    </ListItem>
                                  ))}
                                </List>
                              </Box>
                            )}
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              )}
            </Box>
          )}
        </Paper>
      </Container>
    </ThemeProvider>
  );
}

export default App;
