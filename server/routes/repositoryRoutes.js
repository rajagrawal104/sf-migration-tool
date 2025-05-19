const express = require('express');
const router = express.Router();
const { Octokit } = require('@octokit/rest');
const { Gitlab } = require('@gitbeaker/node');
const Bitbucket = require('bitbucket');
const fs = require('fs').promises;
const path = require('path');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);
const https = require('https');
const http = require('http');
const { Agent } = require('https');
const { createProxyAgent } = require('proxy-agent');
const { EventEmitter } = require('events');
const batchEmitter = new EventEmitter();

// Helper function to create HTTP agent based on proxy settings
function createHttpAgent(repo) {
  if (!repo.proxy?.enabled) {
    return new Agent({
      rejectUnauthorized: repo.security?.sslVerify !== false
    });
  }

  const proxyUrl = `http://${repo.proxy.username}:${repo.proxy.password}@${repo.proxy.host}:${repo.proxy.port}`;
  return createProxyAgent(proxyUrl);
}

// Helper function to get repository URL
function getRepositoryUrl(repo) {
  if (repo.type.includes('ENTERPRISE')) {
    return `${repo.enterpriseUrl}/${repo.url}`;
  }

  switch (repo.type) {
    case 'github':
      return `https://github.com/${repo.url}`;
    case 'gitlab':
      return `https://gitlab.com/${repo.url}`;
    case 'bitbucket':
      return `https://bitbucket.org/${repo.url}`;
    case 'azure_devops':
      return `https://dev.azure.com/${repo.url}`;
    case 'jfrog':
      return `${repo.enterpriseUrl}/artifactory/${repo.url}`;
    default:
      throw new Error('Unsupported repository type');
  }
}

// Helper function to clone repository
async function cloneRepository(repo) {
  const tempDir = path.join(__dirname, '../temp', repo.id.toString());
  await fs.mkdir(tempDir, { recursive: true });

  let cloneUrl;
  const baseUrl = getRepositoryUrl(repo);

  if (repo.security?.sshKey) {
    // Use SSH for cloning
    const sshKeyPath = path.join(tempDir, 'id_rsa');
    await fs.writeFile(sshKeyPath, repo.security.sshKey, { mode: 0o600 });
    
    if (repo.security.sshPassphrase) {
      await fs.writeFile(path.join(tempDir, 'ssh-agent.sh'), `
        #!/bin/bash
        eval \$(ssh-agent -s)
        echo "${repo.security.sshPassphrase}" | ssh-add ${sshKeyPath}
      `, { mode: 0o700 });
      await exec(`bash ${path.join(tempDir, 'ssh-agent.sh')}`);
    }

    cloneUrl = baseUrl.replace('https://', 'git@').replace('http://', 'git@');
  } else {
    // Use HTTPS for cloning
    const token = repo.token;
    switch (repo.type) {
      case 'github':
      case 'github_enterprise':
        cloneUrl = `https://${token}@${baseUrl.replace('https://', '')}.git`;
        break;
      case 'gitlab':
      case 'gitlab_enterprise':
        cloneUrl = `https://oauth2:${token}@${baseUrl.replace('https://', '')}.git`;
        break;
      case 'bitbucket':
      case 'bitbucket_enterprise':
        cloneUrl = `https://${token}@${baseUrl.replace('https://', '')}.git`;
        break;
      case 'azure_devops':
        cloneUrl = `https://${token}@${baseUrl}.git`;
        break;
      case 'jfrog':
        cloneUrl = `https://${token}@${baseUrl}.git`;
        break;
      default:
        throw new Error('Unsupported repository type');
    }
  }

  try {
    const agent = createHttpAgent(repo);
    const gitCommand = `git clone ${cloneUrl} ${tempDir}`;
    await exec(gitCommand, { env: { ...process.env, GIT_SSL_NO_VERIFY: !repo.security?.sslVerify } });

    if (repo.branch !== 'main') {
      await exec(`cd ${tempDir} && git checkout ${repo.branch}`);
    }

    // Clean up sensitive files
    if (repo.security?.sshKey) {
      await fs.unlink(path.join(tempDir, 'id_rsa'));
      await fs.unlink(path.join(tempDir, 'ssh-agent.sh'));
    }

    return tempDir;
  } catch (error) {
    throw new Error(`Failed to clone repository: ${error.message}`);
  }
}

// Validate repository connection
router.post('/validate-repo', async (req, res) => {
  const repo = req.body;

  try {
    const agent = createHttpAgent(repo);
    const baseUrl = getRepositoryUrl(repo);

    switch (repo.type) {
      case 'github':
      case 'github_enterprise':
        const octokit = new Octokit({
          auth: repo.token,
          baseUrl: repo.type === 'github_enterprise' ? `${repo.enterpriseUrl}/api/v3` : undefined,
          request: { agent }
        });
        await octokit.repos.get({ owner: repo.url.split('/')[0], repo: repo.url.split('/')[1] });
        break;

      case 'gitlab':
      case 'gitlab_enterprise':
        const gitlab = new Gitlab({
          token: repo.token,
          host: repo.type === 'gitlab_enterprise' ? repo.enterpriseUrl : undefined,
          request: { agent }
        });
        await gitlab.Projects.show(repo.url);
        break;

      case 'bitbucket':
      case 'bitbucket_enterprise':
        const bitbucket = new Bitbucket({
          auth: { username: repo.url.split('/')[0], password: repo.token },
          baseUrl: repo.type === 'bitbucket_enterprise' ? repo.enterpriseUrl : undefined,
          request: { agent }
        });
        await bitbucket.repositories.get({ repo_slug: repo.url.split('/')[1], workspace: repo.url.split('/')[0] });
        break;

      case 'azure_devops':
        const azureResponse = await fetch(`${baseUrl}/_apis/git/repositories?api-version=6.0`, {
          headers: { Authorization: `Basic ${Buffer.from(`:${repo.token}`).toString('base64')}` },
          agent
        });
        if (!azureResponse.ok) throw new Error('Failed to validate Azure DevOps repository');
        break;

      case 'jfrog':
        const jfrogResponse = await fetch(`${baseUrl}/api/storage/${repo.url}`, {
          headers: { 'X-JFrog-Art-Api': repo.token },
          agent
        });
        if (!jfrogResponse.ok) throw new Error('Failed to validate JFrog repository');
        break;

      default:
        throw new Error('Unsupported repository type');
    }

    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: `Failed to validate repository: ${error.message}` });
  }
});

// Refresh repository data
router.post('/refresh-repo', async (req, res) => {
  const repo = req.body;

  try {
    const tempDir = await cloneRepository(repo);
    // Add any additional refresh logic here
    res.json({ success: true, lastUpdated: new Date().toISOString() });
  } catch (error) {
    res.status(400).json({ error: `Failed to refresh repository: ${error.message}` });
  }
});

// Convert repository code
router.post('/convert-repo', async (req, res) => {
  const { repository } = req.body;

  try {
    const tempDir = await cloneRepository(repository);
    
    // Find all Aura components in the repository
    const auraComponents = await findAuraComponents(tempDir);
    
    // Convert each component
    const results = await Promise.all(
      auraComponents.map(async (component) => {
        try {
          // Add your conversion logic here
          return {
            name: path.basename(component),
            status: 'success',
            path: component.replace('.cmp', '.js'),
            warnings: []
          };
        } catch (error) {
          return {
            name: path.basename(component),
            status: 'error',
            error: error.message
          };
        }
      })
    );

    // Clean up temporary directory
    await fs.rm(tempDir, { recursive: true, force: true });

    res.json({ results });
  } catch (error) {
    res.status(400).json({ error: `Failed to convert repository: ${error.message}` });
  }
});

// Helper function to find Aura components
async function findAuraComponents(dir) {
  const components = [];
  
  async function scanDirectory(currentDir) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      
      if (entry.isDirectory()) {
        await scanDirectory(fullPath);
      } else if (entry.name.endsWith('.cmp')) {
        components.push(fullPath);
      }
    }
  }
  
  await scanDirectory(dir);
  return components;
}

// Repository Analytics
router.post('/repo-analytics', async (req, res) => {
  const { repository } = req.body;

  try {
    const tempDir = await cloneRepository(repository);
    const auraComponents = await findAuraComponents(tempDir);

    // Calculate analytics
    const analytics = {
      totalComponents: auraComponents.length,
      convertedSuccessfully: 0,
      withWarnings: 0,
      failedConversions: 0,
      complexityDistribution: {
        LOW: 0,
        MEDIUM: 0,
        HIGH: 0
      },
      conversionProgress: [],
      riskFactors: [],
      performanceMetrics: []
    };

    // Process each component
    for (const component of auraComponents) {
      try {
        // Add your conversion logic here
        const result = {
          name: path.basename(component),
          status: 'success',
          warnings: []
        };

        if (result.status === 'success') {
          analytics.convertedSuccessfully++;
          if (result.warnings.length > 0) {
            analytics.withWarnings++;
          }
        } else {
          analytics.failedConversions++;
        }

        // Update complexity distribution
        const complexity = calculateComplexity(component);
        analytics.complexityDistribution[complexity.level]++;

        // Add to risk factors if needed
        if (complexity.riskFactors.length > 0) {
          analytics.riskFactors.push({
            name: path.basename(component),
            description: complexity.riskFactors.join(', '),
            severity: complexity.level,
            affectedComponents: 1
          });
        }

        // Add performance metrics
        analytics.performanceMetrics.push({
          date: new Date().toISOString(),
          conversionTime: Math.random() * 1000, // Replace with actual metrics
          memoryUsage: Math.random() * 100 // Replace with actual metrics
        });

      } catch (error) {
        analytics.failedConversions++;
      }
    }

    // Generate conversion progress data
    const dates = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    analytics.conversionProgress = dates.map(date => ({
      date,
      converted: Math.floor(Math.random() * analytics.totalComponents),
      failed: Math.floor(Math.random() * analytics.failedConversions)
    }));

    // Calculate averages
    analytics.averageConversionTime = analytics.performanceMetrics.reduce((acc, curr) => acc + curr.conversionTime, 0) / analytics.performanceMetrics.length;
    analytics.averageMemoryUsage = analytics.performanceMetrics.reduce((acc, curr) => acc + curr.memoryUsage, 0) / analytics.performanceMetrics.length;
    analytics.successRate = (analytics.convertedSuccessfully / analytics.totalComponents) * 100;

    // Clean up
    await fs.rm(tempDir, { recursive: true, force: true });

    res.json(analytics);
  } catch (error) {
    res.status(400).json({ error: `Failed to generate analytics: ${error.message}` });
  }
});

// Batch Processing
const activeBatches = new Map();

router.post('/start-batch', async (req, res) => {
  const batch = req.body;

  try {
    const batchId = Date.now().toString();
    activeBatches.set(batchId, {
      ...batch,
      id: batchId,
      status: 'processing',
      progress: 0,
      results: []
    });

    // Start batch processing in background
    processBatch(batchId, batch);

    res.json({ batchId, status: 'started' });
  } catch (error) {
    res.status(400).json({ error: `Failed to start batch: ${error.message}` });
  }
});

router.post('/stop-batch', async (req, res) => {
  const { batchId } = req.body;

  try {
    const batch = activeBatches.get(batchId);
    if (batch) {
      batch.status = 'stopped';
      activeBatches.set(batchId, batch);
    }

    res.json({ status: 'stopped' });
  } catch (error) {
    res.status(400).json({ error: `Failed to stop batch: ${error.message}` });
  }
});

router.get('/batch-status/:batchId', (req, res) => {
  const { batchId } = req.params;
  const batch = activeBatches.get(batchId);

  if (!batch) {
    return res.status(404).json({ error: 'Batch not found' });
  }

  res.json(batch);
});

// Helper function to calculate component complexity
function calculateComplexity(componentPath) {
  // Add your complexity calculation logic here
  return {
    level: ['LOW', 'MEDIUM', 'HIGH'][Math.floor(Math.random() * 3)],
    riskFactors: []
  };
}

// Helper function to process batch
async function processBatch(batchId, batch) {
  const activeBatch = activeBatches.get(batchId);
  if (!activeBatch) return;

  const { repositories, settings } = batch;
  const totalRepos = repositories.length;
  let processedRepos = 0;

  // Process repositories in parallel based on settings
  const chunks = [];
  for (let i = 0; i < repositories.length; i += settings.maxConcurrent) {
    chunks.push(repositories.slice(i, i + settings.maxConcurrent));
  }

  for (const chunk of chunks) {
    if (activeBatch.status === 'stopped') break;

    await Promise.all(chunk.map(async (repo) => {
      try {
        const tempDir = await cloneRepository(repo);
        const auraComponents = await findAuraComponents(tempDir);

        // Process components
        for (const component of auraComponents) {
          try {
            // Add your conversion logic here
            activeBatch.results.push({
              repository: repo.name,
              component: path.basename(component),
              status: 'success',
              warnings: []
            });
          } catch (error) {
            activeBatch.results.push({
              repository: repo.name,
              component: path.basename(component),
              status: 'error',
              error: error.message
            });
          }
        }

        // Clean up
        await fs.rm(tempDir, { recursive: true, force: true });
      } catch (error) {
        activeBatch.results.push({
          repository: repo.name,
          status: 'error',
          error: error.message
        });
      }

      processedRepos++;
      activeBatch.progress = (processedRepos / totalRepos) * 100;
      activeBatches.set(batchId, activeBatch);
    }));
  }

  // Update final status
  activeBatch.status = 'completed';
  activeBatches.set(batchId, activeBatch);

  // Emit completion event
  batchEmitter.emit('batch-completed', batchId);
}

// WebSocket support for real-time batch updates
router.ws('/batch-updates/:batchId', (ws, req) => {
  const { batchId } = req.params;

  const updateHandler = (batch) => {
    ws.send(JSON.stringify(batch));
  };

  batchEmitter.on(`batch-update-${batchId}`, updateHandler);

  ws.on('close', () => {
    batchEmitter.off(`batch-update-${batchId}`, updateHandler);
  });
});

module.exports = router; 