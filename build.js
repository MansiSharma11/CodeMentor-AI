const fs = require('fs');
const path = require('path');

const appJsPath = path.join(__dirname, 'App.js');
let appJsContent = fs.readFileSync(appJsPath, 'utf8');

// Environment variables to inject
const ENVS = {
  '__GROQ_API_KEY__': process.env.GROQ_API_KEY || '',
  '__HINDSIGHT_API_KEY__': process.env.HINDSIGHT_API_KEY || '',
  '__HINDSIGHT_API_URL__': process.env.HINDSIGHT_API_URL || 'https://api.hindsight.vectorize.io',
  '__STUDENT_NAME__': process.env.STUDENT_NAME || 'Alex'
};

// Replace placeholders in App.js
Object.entries(ENVS).forEach(([key, value]) => {
  appJsContent = appJsContent.replace(new RegExp(key, 'g'), value);
});

// Write back to App.js
fs.writeFileSync(appJsPath, appJsContent);
console.log('✅ Build successful: Placeholders replaced in App.js');
