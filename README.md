# Code Vulnerability Analyzer

A modern web application for analyzing code vulnerabilities in JavaScript, TypeScript, Python, and Java files. This tool helps developers identify potential security issues and provides AI-based suggestions for improving code quality and security.

## Features

- **User Authentication**: Secure login and registration using email/password or GitHub OAuth via Supabase
- **Code File Upload**: Upload JavaScript, TypeScript, Python, or Java files for analysis
- **AI-Powered Analysis**: Uses OpenRouter API to analyze code for vulnerabilities
- **Multiple AI Models**: Choose between different free AI models (DeepSeek, Mistral, Gemini)
- **Vulnerability Detection**: Automatically identifies common security issues and bad practices
- **Severity Classification**: Issues are categorized as low, medium, or high severity
- **AI-Based Suggestions**: Receives specific, actionable suggestions for improving code security
- **History Tracking**: View past analyses with filtering by severity

## Technologies Used

- **Frontend**: React, TypeScript, TailwindCSS
- **Backend**: Supabase (Authentication, Database, Serverless Functions)
- **AI/ML**: OpenRouter API for code analysis with models like DeepSeek, Mistral, and Gemini
- **Deployment**: Vite for frontend building and optimization

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn
- A Supabase account and project
- An OpenRouter API key (optional, for AI analysis)

### Environment Setup

Create a `.env` file in the project root with your API credentials:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_public_api_key
VITE_OPENROUTER_API_KEY=your_openrouter_api_key
```

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/code-vulnerability-analyzer.git
   cd code-vulnerability-analyzer
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up the database with the provided Supabase migration:
   ```
   npx supabase db push
   ```

### Running the Application

To start the development server:
```bash
npm run dev
# or
yarn dev
```

Visit `http://localhost:5173` to view the application.

### Building for Production

To create a production build:
```bash
npm run build
# or
yarn build
```

The build files will be generated in the `dist` directory, ready for deployment.

## Usage Guide

1. **Sign Up/Login**: Create an account using email/password or GitHub OAuth
2. **Select AI Model**: Choose which AI model to use for code analysis
   - DeepSeek Coder (recommended for code analysis)
   - Mistral 7B
   - Google Gemini
3. **Upload Code**: Click on the upload area to select a JavaScript, TypeScript, Python, or Java file
4. **View Analysis**: See detected vulnerabilities categorized by severity
5. **Review Suggestions**: Click on each issue to view AI-suggested improvements
6. **Filter Results**: Use the severity filters to focus on specific issue types
7. **View History**: Access previous analyses from the "View History" button

## AI Models

The application supports several free AI models through OpenRouter:

- **DeepSeek R1 Distill Llama 8B** (Default): Specialized for code analysis with excellent performance on detecting vulnerabilities
- **Mistral 7B** (Free): General-purpose model with good code understanding
- **Google Gemini** (Free): Google's model that performs well on code analysis tasks
- **Claude 3 Opus** (Paid): Premium model for highest quality analysis

## API Integrations

### OpenRouter Integration

This application uses OpenRouter to analyze code with state-of-the-art AI models. To enable this feature:

1. Create an account at [OpenRouter](https://openrouter.ai/)
2. Generate an API key
3. Add the API key to your `.env` file as `VITE_OPENROUTER_API_KEY`

If no OpenRouter API key is provided, the application will fall back to a local, rules-based analyzer.

## Development Mode

For development and testing purposes:
- Press `Ctrl+Alt+D` to enter development mode, which bypasses authentication
- Use the test buttons to quickly analyze sample vulnerable code

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. 