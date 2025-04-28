# Document QA Chatbot

This is a document question-answering chatbot built with Next.js that allows users to upload documents and ask questions about their content.

## Technologies Used

- Next.js 14+ with App Router
- HuggingFace API for document embedding and question answering
- PDF parsing with pdf-parse

## Getting Started

First, set up your environment variables:

```bash
# Create a .env.local file
cp .env.example .env.local
# Edit .env.local and add your HuggingFace API key
```

Then, run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Environmental Variables

The following environment variables are required:

- `HUGGINGFACEHUB_API_KEY`: Your HuggingFace API key (required for document analysis)

## Production Deployment

When deploying to production (e.g., Vercel), ensure you:

1. Set all required environment variables in your hosting platform
2. If you're having issues with PDF parsing, consider the following:
   - Ensure your serverless function has enough memory allocated
   - Increase function timeout limits if possible
   - Check logs for specific error messages

## Production Stability Improvements

This app includes several stability improvements to handle the constraints of serverless environments:

1. **Edge Runtime**: Uses the Edge runtime for API routes to improve performance and reliability
2. **Timeout Management**:
   - Client-side abort controller with 45-second timeout
   - Server-side timeouts for PDF parsing (20s) and LLM generation (25s)
   - Graceful handling of timeouts with user-friendly error messages

3. **Resource Optimization**:
   - Limits chunk size and number of chunks to process (max 50)
   - Uses smaller context window for embedding
   - Returns 200 status codes with error messages instead of error status codes

4. **Storage Access Safety**:
   - Safe localStorage wrappers to prevent errors in restricted contexts
   - Defensive coding to prevent access errors in different environments

5. **File Processing Limits**:
   - Client-side file size validation (10MB limit)
   - Clear error messages for oversized files

## Troubleshooting Production Issues

### Missing API Key

If you see errors about missing API keys:
- Verify that the `HUGGINGFACEHUB_API_KEY` is properly set in your environment variables
- Check your Vercel dashboard → Project Settings → Environment Variables

### PDF Processing Errors

If PDF processing fails:
- Try with smaller PDF files first (under 5MB is recommended)
- Ensure the PDF isn't password protected
- Consider pre-processing PDFs into text files for more reliable extraction

### Memory/Timeout Issues

If you encounter memory or timeout issues:
- Increase the serverless function memory allocation in your hosting platform
- Set a longer timeout for the function 
- Try breaking large documents into smaller pieces or use text files instead of PDFs
- If using Vercel, consider upgrading to a paid plan for increased function limits

### Network Errors

If you see network errors in the console:
- Check if the HuggingFace API is available
- Verify your API key has sufficient quota remaining
- Test with smaller files to reduce processing time

### Storage Access Errors

If you see errors about storage access:
- This is expected in some production environments and is handled gracefully
- No action is required as the app will continue to function without local storage

## Contribution

Feel free to submit issues and enhancement requests.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
