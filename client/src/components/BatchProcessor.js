import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  LinearProgress,
  Alert,
  Grid
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Save as SaveIcon,
  Load as LoadIcon
} from '@mui/icons-material';

const BatchProcessor = () => {
  const [batches, setBatches] = useState([]);
  const [currentBatch, setCurrentBatch] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [newBatch, setNewBatch] = useState({
    name: '',
    description: '',
    repositories: [],
    settings: {
      parallelProcessing: true,
      maxConcurrent: 3,
      retryFailed: true,
      maxRetries: 3,
      notifyOnCompletion: true,
      saveResults: true
    }
  });

  const handleCreateBatch = () => {
    setBatches([...batches, { ...newBatch, id: Date.now(), status: 'pending' }]);
    setOpenDialog(false);
    setNewBatch({
      name: '',
      description: '',
      repositories: [],
      settings: {
        parallelProcessing: true,
        maxConcurrent: 3,
        retryFailed: true,
        maxRetries: 3,
        notifyOnCompletion: true,
        saveResults: true
      }
    });
  };

  const handleStartBatch = async (batch) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:3001/api/start-batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(batch),
      });

      if (!response.ok) {
        throw new Error('Failed to start batch processing');
      }

      setBatches(batches.map(b => 
        b.id === batch.id ? { ...b, status: 'processing' } : b
      ));
      setCurrentBatch(batch);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStopBatch = async (batch) => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/stop-batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ batchId: batch.id }),
      });

      if (!response.ok) {
        throw new Error('Failed to stop batch processing');
      }

      setBatches(batches.map(b => 
        b.id === batch.id ? { ...b, status: 'stopped' } : b
      ));
      setCurrentBatch(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBatch = (batch) => {
    const batchData = JSON.stringify(batch);
    const blob = new Blob([batchData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `batch-${batch.name}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleLoadBatch = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const batch = JSON.parse(e.target.result);
          setBatches([...batches, { ...batch, id: Date.now(), status: 'pending' }]);
        } catch (err) {
          setError('Invalid batch file format');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <Box>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Batch Processing</Typography>
            <Box>
              <Button
                variant="outlined"
                startIcon={<LoadIcon />}
                component="label"
                sx={{ mr: 1 }}
              >
                Load Batch
                <input
                  type="file"
                  hidden
                  accept=".json"
                  onChange={handleLoadBatch}
                />
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setOpenDialog(true)}
              >
                Create Batch
              </Button>
            </Box>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <List>
            {batches.map((batch) => (
              <ListItem key={batch.id}>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {batch.name}
                      <Chip
                        size="small"
                        label={batch.status}
                        color={
                          batch.status === 'processing' ? 'primary' :
                          batch.status === 'completed' ? 'success' :
                          batch.status === 'failed' ? 'error' :
                          'default'
                        }
                      />
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {batch.description}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {batch.repositories.length} repositories
                      </Typography>
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  {batch.status === 'processing' ? (
                    <IconButton
                      edge="end"
                      onClick={() => handleStopBatch(batch)}
                      disabled={loading}
                    >
                      <StopIcon />
                    </IconButton>
                  ) : (
                    <IconButton
                      edge="end"
                      onClick={() => handleStartBatch(batch)}
                      disabled={loading || batch.status === 'completed'}
                    >
                      <PlayIcon />
                    </IconButton>
                  )}
                  <IconButton
                    edge="end"
                    onClick={() => handleSaveBatch(batch)}
                    disabled={loading}
                  >
                    <SaveIcon />
                  </IconButton>
                  <IconButton
                    edge="end"
                    onClick={() => {
                      setBatches(batches.filter(b => b.id !== batch.id));
                    }}
                    disabled={loading || batch.status === 'processing'}
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New Batch</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Batch Name"
                  value={newBatch.name}
                  onChange={(e) => setNewBatch({ ...newBatch, name: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={2}
                  value={newBatch.description}
                  onChange={(e) => setNewBatch({ ...newBatch, description: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Processing Settings
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Max Concurrent Repositories</InputLabel>
                  <Select
                    value={newBatch.settings.maxConcurrent}
                    label="Max Concurrent Repositories"
                    onChange={(e) => setNewBatch({
                      ...newBatch,
                      settings: { ...newBatch.settings, maxConcurrent: e.target.value }
                    })}
                  >
                    <MenuItem value={1}>1</MenuItem>
                    <MenuItem value={2}>2</MenuItem>
                    <MenuItem value={3}>3</MenuItem>
                    <MenuItem value={4}>4</MenuItem>
                    <MenuItem value={5}>5</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Max Retries</InputLabel>
                  <Select
                    value={newBatch.settings.maxRetries}
                    label="Max Retries"
                    onChange={(e) => setNewBatch({
                      ...newBatch,
                      settings: { ...newBatch.settings, maxRetries: e.target.value }
                    })}
                  >
                    <MenuItem value={0}>No Retries</MenuItem>
                    <MenuItem value={1}>1 Retry</MenuItem>
                    <MenuItem value={2}>2 Retries</MenuItem>
                    <MenuItem value={3}>3 Retries</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            onClick={handleCreateBatch}
            variant="contained"
            disabled={!newBatch.name}
          >
            Create Batch
          </Button>
        </DialogActions>
      </Dialog>

      {currentBatch && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Current Batch Progress
            </Typography>
            <Box sx={{ mt: 2 }}>
              <LinearProgress
                variant="determinate"
                value={currentBatch.progress || 0}
                sx={{ mb: 1 }}
              />
              <Typography variant="body2" color="text.secondary">
                {currentBatch.progress}% Complete
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default BatchProcessor; 