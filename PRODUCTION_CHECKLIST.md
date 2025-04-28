# Production Deployment Checklist

This checklist helps ensure your document QA chatbot deploys successfully to Vercel.

## Before Deployment

1. **Environment Variables**
   - [ ] Create an account on [HuggingFace](https://huggingface.co/) if you don't have one
   - [ ] Generate an API key on your HuggingFace account settings
   - [ ] Store the key securely - you'll need it for deployment

2. **Local Testing**
   - [ ] Create a `.env.local` file with your API key
   - [ ] Test with small PDF files (< 5MB)
   - [ ] Test with larger files to understand limits
   - [ ] Test error scenarios (upload corrupt files, very large files)

3. **Build Optimization**
   - [ ] Run `npm run build` locally to check for any build issues
   - [ ] Verify the app's bundle size is reasonable

## Vercel Deployment

1. **Initial Setup**
   - [ ] Connect your GitHub repository to Vercel
   - [ ] Select the Next.js framework preset (if not detected)
   - [ ] Set build command to `next build`
   - [ ] Set output directory to `.next`

2. **Environment Configuration**
   - [ ] Add `HUGGINGFACEHUB_API_KEY` in the Environment Variables section
   - [ ] Set `NODE_ENV` to `production`

3. **Advanced Settings**
   - [ ] Increase serverless function memory to maximum available (for your plan)
   - [ ] Increase serverless function timeout (Pro plan: up to 60s)
   - [ ] Enable the Edge runtime for improved performance

4. **Monitoring Setup**
   - [ ] Enable error monitoring
   - [ ] Set up status alerts

## Post-Deployment Verification

1. **Basic Functionality**
   - [ ] Test uploading a small PDF document (1-2 pages)
   - [ ] Test asking a simple question
   - [ ] Verify proper response formatting and citations

2. **Error Handling**
   - [ ] Try uploading a file > 10MB and verify error message
   - [ ] Try unsupported file types and verify error handling
   - [ ] Test with a very complex PDF to verify timeout handling

3. **Performance Testing**
   - [ ] Test with medium-sized documents (5-10 pages)
   - [ ] Monitor serverless function execution times
   - [ ] Check for any memory-related failures

## Plan Considerations

1. **Hobby Plan Limitations**
   - Default timeout: 10 seconds (may be too short for complex documents)
   - Lower memory allocation
   - Consider upgrading or implementing stricter limits on file size/complexity

2. **Pro Plan Benefits**
   - Extended timeout up to 60 seconds
   - More execution memory
   - Better for handling larger documents

## Common Issues

1. **Timeout Errors (504)**
   - Reduce document size/complexity
   - Upgrade to Pro plan
   - Further optimize code to process documents faster

2. **Memory Errors**
   - Reduce maximum allowed file size
   - Process fewer document chunks
   - Optimize memory usage in PDF processing

3. **API Rate Limiting**
   - Implement user-based rate limiting
   - Consider HuggingFace Pro API for higher limits

## Maintenance

- Regularly check HuggingFace API for changes or deprecations
- Monitor Vercel logs for recurring errors
- Update dependencies periodically 