# StudyPal Security Guide

## 🔒 Security Best Practices

### API Key Management

**❌ NEVER do this:**
```python
# Hardcoded API keys - SECURITY RISK!
GEMINI_API_KEY = "AIzaSyAfvi6jTzKOBMZLA4eebmf7-5swapUr5dA"
GROQ_API_KEY = "gsk_1234567890abcdef"
```

**✅ ALWAYS do this:**
```python
# Use environment variables
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# With error handling
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY must be set in environment variables")
```

### Environment Variables Setup

1. **Copy the example file:**
   ```bash
   cp backend/.env.example backend/.env
   ```

2. **Fill in your actual API keys:**
   ```bash
   # Edit the .env file with your real keys
   GEMINI_API_KEY=your_actual_gemini_key_here
   GROQ_API_KEY=your_actual_groq_key_here
   TAVILY_API_KEY=your_actual_tavily_key_here
   HF_TOKENS=your_actual_hugging_face_token_here
   YOUTUBE_API_KEY=your_actual_youtube_key_here
   ```

3. **Make sure .env is in .gitignore:**
   ```gitignore
   # Environment variables
   .env
   .env.local
   .env.*.local
   ```

## 🚨 GitHub Push Protection

If you get a "Repository rule violations" error when pushing, it means GitHub detected potential secrets in your code.

### Quick Fix Steps:

1. **Remove hardcoded secrets from your code**
2. **Use environment variables instead**
3. **Update your .env.example file** (without real values)
4. **Commit the security fixes:**
   ```bash
   git add .
   git commit -m "security: Remove hardcoded API keys, use environment variables"
   ```
5. **Push again:**
   ```bash
   git push origin main
   ```

### If push is still blocked:

1. **Check the specific files mentioned in the error**
2. **Search for any remaining hardcoded tokens:**
   ```bash
   # Search for common API key patterns
   grep -r "AIza\|sk-\|pk_\|hf_" backend/ --include="*.py"
   ```
3. **Remove any found secrets and commit again**

## 🔍 Common Secret Patterns to Avoid

- Google API Keys: `AIza...`
- OpenAI Keys: `sk-...`
- Hugging Face Tokens: `hf_...`
- GitHub Tokens: `ghp_`, `gho_`, `ghu_`, `ghs_`, `ghr_`
- Any long alphanumeric strings in quotes

## 📝 Required Environment Variables

Create a `.env` file in the `backend/` directory with these variables:

```bash
# AI Model APIs
GEMINI_API_KEY=your_gemini_api_key_here
GROQ_API_KEY=your_groq_api_key_here

# Search APIs
TAVILY_API_KEY=your_tavily_api_key_here
SERPER_API_KEY=your_serper_api_key_here

# Media APIs
HF_TOKENS=your_hugging_face_token_here
YOUTUBE_API_KEY=your_youtube_api_key_here

# Server Configuration
HOST=0.0.0.0
PORT=8000
FRONTEND_URL=http://localhost:3000
```

## 🛡️ Additional Security Measures

1. **Never commit real API keys to version control**
2. **Use different API keys for development and production**
3. **Rotate API keys regularly**
4. **Monitor API key usage for unusual activity**
5. **Set up API key restrictions when possible**

## 🆘 Emergency Response

If you accidentally committed secrets:

1. **Immediately revoke the exposed API keys**
2. **Generate new API keys**
3. **Update your .env file with new keys**
4. **Consider using `git filter-branch` to remove secrets from history**
5. **Force push the cleaned history (be careful with team repos)**

## 📚 API Key Sources

- **Google Gemini**: [Google AI Studio](https://aistudio.google.com/app/apikey)
- **Groq**: [Groq Console](https://console.groq.com/keys)
- **Tavily**: [Tavily Dashboard](https://app.tavily.com/)
- **Hugging Face**: [HuggingFace Tokens](https://huggingface.co/settings/tokens)
- **YouTube**: [Google Cloud Console](https://console.cloud.google.com/apis/credentials)

Remember: **Security is everyone's responsibility!** 🔐