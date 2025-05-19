/**
 * RepositoryConnector Component
 * 
 * A React component for managing repository connections and configurations.
 * Supports multiple repository types including GitHub, GitLab, Bitbucket,
 * and their enterprise versions, as well as Azure DevOps and JFrog.
 */

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Chip,
  Tooltip,
  Switch,
  FormControlLabel,
  Grid
} from '@mui/material';
import {
  GitHub as GitHubIcon,
  Code as GitLabIcon,
  Code as BitbucketIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Business as BusinessIcon,
  Security as SecurityIcon,
  Storage as StorageIcon,
  Code as CodeIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';

/**
 * Repository type constants
 * Defines all supported repository types and their identifiers
 */
const REPO_TYPES = {
  GITHUB: 'github',
  GITHUB_ENTERPRISE: 'github_enterprise',
  GITLAB: 'gitlab',
  GITLAB_ENTERPRISE: 'gitlab_enterprise',
  BITBUCKET: 'bitbucket',
  BITBUCKET_ENTERPRISE: 'bitbucket_enterprise',
  AZURE_DEVOPS: 'azure_devops',
  JFROG: 'jfrog'
};

/**
 * Repository icon mapping
 * Maps repository types to their corresponding Material-UI icons
 */
const REPO_ICONS = {
  [REPO_TYPES.GITHUB]: <GitHubIcon />,
  [REPO_TYPES.GITHUB_ENTERPRISE]: <BusinessIcon />,
  [REPO_TYPES.GITLAB]: <GitLabIcon />,
  [REPO_TYPES.GITLAB_ENTERPRISE]: <BusinessIcon />,
  [REPO_TYPES.BITBUCKET]: <BitbucketIcon />,
  [REPO_TYPES.BITBUCKET_ENTERPRISE]: <BusinessIcon />,
  [REPO_TYPES.AZURE_DEVOPS]: <StorageIcon />,
  [REPO_TYPES.JFROG]: <StorageIcon />
};

/**
 * RepositoryConnector Component
 * 
 * @param {Object} props - Component props
 * @param {Function} props.onRepositorySelect - Callback function when a repository is selected
 */
const RepositoryConnector = ({ onRepositorySelect }) => {
  // State management for repositories, dialog, loading, and errors
  const [repositories, setRepositories] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  // State for new repository form
  const [newRepo, setNewRepo] = useState({
    type: REPO_TYPES.GITHUB,
    name: '',
    url: '',
    token: '',
    branch: 'main',
    enterprise: false,
    enterpriseUrl: '',
    sslVerify: true,
    proxy: {
      enabled: false,
      host: '',
      port: '',
      username: '',
      password: ''
    },
    security: {
      sslVerify: true,
      sshKey: '',
      sshPassphrase: ''
    }
  });

  /**
   * Handles adding a new repository
   * Validates the repository connection before adding
   */
  const handleAddRepository = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:3001/api/validate-repo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newRepo),
      });

      if (!response.ok) {
        throw new Error('Failed to validate repository connection');
      }

      const data = await response.json();
      
      setRepositories([...repositories, { ...newRepo, id: Date.now() }]);
      setOpenDialog(false);
      setNewRepo({
        type: REPO_TYPES.GITHUB,
        name: '',
        url: '',
        token: '',
        branch: 'main',
        enterprise: false,
        enterpriseUrl: '',
        sslVerify: true,
        proxy: {
          enabled: false,
          host: '',
          port: '',
          username: '',
          password: ''
        },
        security: {
          sslVerify: true,
          sshKey: '',
          sshPassphrase: ''
        }
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles deleting a repository from the list
   * @param {number} id - ID of the repository to delete
   */
  const handleDeleteRepository = (id) => {
    setRepositories(repositories.filter(repo => repo.id !== id));
  };

  /**
   * Handles refreshing repository data
   * @param {Object} repo - Repository object to refresh
   */
  const handleRefreshRepository = async (repo) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:3001/api/refresh-repo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(repo),
      });

      if (!response.ok) {
        throw new Error('Failed to refresh repository');
      }

      const data = await response.json();
      setRepositories(repositories.map(r => 
        r.id === repo.id ? { ...r, lastUpdated: new Date().toISOString() } : r
      ));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles repository selection
   * @param {Object} repo - Selected repository object
   */
  const handleSelectRepository = (repo) => {
    onRepositorySelect(repo);
  };

  /**
   * Handles tab change in the repository dialog
   * @param {Object} event - Change event
   * @param {number} newValue - New tab index
   */
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  /**
   * Checks if a repository type is an enterprise version
   * @param {string} type - Repository type to check
   * @returns {boolean} True if the type is an enterprise version
   */
  const isEnterpriseType = (type) => {
    return type.includes('ENTERPRISE') || type === 'AZURE_DEVOPS' || type === 'JFROG';
  };

  return (
    <Box>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Connected Repositories</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenDialog(true)}
            >
              Add Repository
            </Button>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <List>
            {repositories.map((repo, index) => (
              <React.Fragment key={repo.id}>
                <ListItem>
                  <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                    {REPO_ICONS[repo.type]}
                  </Box>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {repo.name}
                        {isEnterpriseType(repo.type) && (
                          <Chip
                            size="small"
                            icon={<BusinessIcon />}
                            label="Enterprise"
                            color="primary"
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {repo.url} ({repo.branch})
                        </Typography>
                        {repo.lastUpdated && (
                          <Typography variant="caption" color="text.secondary">
                            Last updated: {new Date(repo.lastUpdated).toLocaleString()}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Tooltip title="Refresh Repository">
                      <IconButton
                        edge="end"
                        onClick={() => handleRefreshRepository(repo)}
                        disabled={loading}
                      >
                        <RefreshIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Repository">
                      <IconButton
                        edge="end"
                        onClick={() => handleDeleteRepository(repo.id)}
                        disabled={loading}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </ListItemSecondaryAction>
                </ListItem>
                {index < repositories.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </CardContent>
      </Card>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add New Repository</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
              <Tab icon={<CodeIcon />} label="Repository" />
              <Tab icon={<SecurityIcon />} label="Security" />
              <Tab icon={<SettingsIcon />} label="Advanced" />
            </Tabs>

            {activeTab === 0 && (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Repository Type</InputLabel>
                    <Select
                      value={newRepo.type}
                      label="Repository Type"
                      onChange={(e) => setNewRepo({ ...newRepo, type: e.target.value })}
                    >
                      <MenuItem value={REPO_TYPES.GITHUB}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <GitHubIcon sx={{ mr: 1 }} />
                          GitHub
                        </Box>
                      </MenuItem>
                      <MenuItem value={REPO_TYPES.GITHUB_ENTERPRISE}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <BusinessIcon sx={{ mr: 1 }} />
                          GitHub Enterprise
                        </Box>
                      </MenuItem>
                      <MenuItem value={REPO_TYPES.GITLAB}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <GitLabIcon sx={{ mr: 1 }} />
                          GitLab
                        </Box>
                      </MenuItem>
                      <MenuItem value={REPO_TYPES.GITLAB_ENTERPRISE}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <BusinessIcon sx={{ mr: 1 }} />
                          GitLab Enterprise
                        </Box>
                      </MenuItem>
                      <MenuItem value={REPO_TYPES.BITBUCKET}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <BitbucketIcon sx={{ mr: 1 }} />
                          Bitbucket
                        </Box>
                      </MenuItem>
                      <MenuItem value={REPO_TYPES.BITBUCKET_ENTERPRISE}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <BusinessIcon sx={{ mr: 1 }} />
                          Bitbucket Enterprise
                        </Box>
                      </MenuItem>
                      <MenuItem value={REPO_TYPES.AZURE_DEVOPS}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <StorageIcon sx={{ mr: 1 }} />
                          Azure DevOps
                        </Box>
                      </MenuItem>
                      <MenuItem value={REPO_TYPES.JFROG}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <StorageIcon sx={{ mr: 1 }} />
                          JFrog Artifactory
                        </Box>
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {isEnterpriseType(newRepo.type) && (
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Enterprise URL"
                      value={newRepo.enterpriseUrl}
                      onChange={(e) => setNewRepo({ ...newRepo, enterpriseUrl: e.target.value })}
                      helperText="Enter the base URL of your enterprise instance"
                    />
                  </Grid>
                )}

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Repository Name"
                    value={newRepo.name}
                    onChange={(e) => setNewRepo({ ...newRepo, name: e.target.value })}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Repository URL"
                    value={newRepo.url}
                    onChange={(e) => setNewRepo({ ...newRepo, url: e.target.value })}
                    helperText={isEnterpriseType(newRepo.type) ? 
                      "Enter the repository path relative to the enterprise URL" :
                      "Enter the repository path (e.g., owner/repo)"
                    }
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Access Token"
                    type="password"
                    value={newRepo.token}
                    onChange={(e) => setNewRepo({ ...newRepo, token: e.target.value })}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Branch"
                    value={newRepo.branch}
                    onChange={(e) => setNewRepo({ ...newRepo, branch: e.target.value })}
                  />
                </Grid>
              </Grid>
            )}

            {activeTab === 1 && (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={newRepo.security.sslVerify}
                        onChange={(e) => setNewRepo({
                          ...newRepo,
                          security: { ...newRepo.security, sslVerify: e.target.checked }
                        })}
                      />
                    }
                    label="Verify SSL Certificate"
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="SSH Private Key"
                    multiline
                    rows={4}
                    value={newRepo.security.sshKey}
                    onChange={(e) => setNewRepo({
                      ...newRepo,
                      security: { ...newRepo.security, sshKey: e.target.value }
                    })}
                    helperText="Enter your SSH private key for SSH authentication"
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="SSH Key Passphrase"
                    type="password"
                    value={newRepo.security.sshPassphrase}
                    onChange={(e) => setNewRepo({
                      ...newRepo,
                      security: { ...newRepo.security, sshPassphrase: e.target.value }
                    })}
                  />
                </Grid>
              </Grid>
            )}

            {activeTab === 2 && (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={newRepo.proxy.enabled}
                        onChange={(e) => setNewRepo({
                          ...newRepo,
                          proxy: { ...newRepo.proxy, enabled: e.target.checked }
                        })}
                      />
                    }
                    label="Use Proxy"
                  />
                </Grid>

                {newRepo.proxy.enabled && (
                  <>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Proxy Host"
                        value={newRepo.proxy.host}
                        onChange={(e) => setNewRepo({
                          ...newRepo,
                          proxy: { ...newRepo.proxy, host: e.target.value }
                        })}
                      />
                    </Grid>

                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Proxy Port"
                        value={newRepo.proxy.port}
                        onChange={(e) => setNewRepo({
                          ...newRepo,
                          proxy: { ...newRepo.proxy, port: e.target.value }
                        })}
                      />
                    </Grid>

                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Proxy Username"
                        value={newRepo.proxy.username}
                        onChange={(e) => setNewRepo({
                          ...newRepo,
                          proxy: { ...newRepo.proxy, username: e.target.value }
                        })}
                      />
                    </Grid>

                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Proxy Password"
                        type="password"
                        value={newRepo.proxy.password}
                        onChange={(e) => setNewRepo({
                          ...newRepo,
                          proxy: { ...newRepo.proxy, password: e.target.value }
                        })}
                      />
                    </Grid>
                  </>
                )}
              </Grid>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            onClick={handleAddRepository}
            variant="contained"
            disabled={loading || !newRepo.name || !newRepo.url || !newRepo.token}
          >
            {loading ? <CircularProgress size={24} /> : 'Add Repository'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RepositoryConnector; 