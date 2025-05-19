# Salesforce Aura to LWC Converter

A powerful tool for converting Salesforce Aura components to Lightning Web Components (LWC) with support for enterprise repositories and batch processing.

## Features

- **Multi-Repository Support**
  - GitHub (Cloud & Enterprise)
  - GitLab (Cloud & Enterprise)
  - Bitbucket (Cloud & Enterprise)
  - Azure DevOps
  - JFrog Artifactory

- **Enterprise Features**
  - SSL Certificate Verification
  - SSH Key Authentication
  - Proxy Support
  - Custom Enterprise URLs

- **Advanced Security**
  - Secure Token Storage
  - SSL Verification Options
  - SSH Key Management
  - Proxy Authentication

- **Batch Processing**
  - Multiple Repository Conversion
  - Progress Tracking
  - Error Handling
  - Batch Templates

- **Analytics Dashboard**
  - Component Statistics
  - Conversion Progress
  - Performance Metrics
  - Risk Analysis

## Prerequisites

- Node.js (v16 or higher)
- npm (v7 or higher)
- Git
- Access to Salesforce org
- Repository access tokens/credentials

## Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/yourusername/sf-migration-tool.git
   cd sf-migration-tool
   ```

2. **Install Dependencies**
   ```bash
   # Install root dependencies
   npm install

   # Install client dependencies
   cd client
   npm install
   cd ..
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   PORT=3001
   NODE_ENV=development
   ```

4. **Build the Application**
   ```bash
   npm run build
   ```

## Running the Application

1. **Development Mode**
   ```bash
   npm run dev:full
   ```
   This starts both the backend and frontend in development mode.

2. **Production Mode**
   ```bash
   # Start the server
   npm start

   # In a separate terminal, serve the client
   cd client
   npm run serve
   ```

## Usage

1. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

2. **Connect Repositories**
   - Click "Add Repository"
   - Select repository type
   - Enter credentials and configuration
   - Click "Add Repository"

3. **Convert Components**
   - Select repository
   - Choose components to convert
   - Start conversion process
   - Monitor progress in analytics dashboard

## API Endpoints

- `POST /api/validate-repo`: Validate repository connection
- `POST /api/refresh-repo`: Refresh repository data
- `POST /api/convert-repo`: Convert repository components
- `POST /api/repo-analytics`: Get repository analytics
- `POST /api/start-batch`: Start batch processing
- `POST /api/stop-batch`: Stop batch processing
- `GET /api/batch-status/:batchId`: Get batch status

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please open an issue in the GitHub repository or contact the development team.
