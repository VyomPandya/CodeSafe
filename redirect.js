/**
 * GitHub Pages Redirect Handler
 * This script helps handle redirects for Single Page Applications hosted on GitHub Pages
 * and ensures authentication callbacks are properly processed.
 */

(function() {
  // Current location without the hash
  const currentUrl = window.location.href.split('#')[0];
  
  // Debugging
  console.log('Redirect handler loaded at:', currentUrl);
  
  // Handle Supabase auth redirects
  function processAuthRedirect() {
    const hash = window.location.hash;
    const hasAuthParams = 
      hash.includes('access_token') || 
      hash.includes('refresh_token') || 
      hash.includes('type=recovery') || 
      hash.includes('type=signup');
    
    if (hasAuthParams) {
      console.log('Detected auth parameters in URL, handling auth callback');
      
      // If we're on 404.html, redirect to the main page but preserve the hash
      if (window.location.pathname.endsWith('/404.html')) {
        // Get the repo path from the pathname
        const pathSegments = window.location.pathname.split('/');
        let repoPath = '';
        
        // If hosted at username.github.io/repo-name, extract repo-name
        if (pathSegments.length > 2) {
          repoPath = '/' + pathSegments[1];
        }
        
        // Redirect to the root of the app with hash preserved
        const redirectUrl = window.location.origin + repoPath + '/#' + window.location.hash.substring(1);
        console.log('Redirecting auth callback to:', redirectUrl);
        window.location.replace(redirectUrl);
        return true;
      }
    }
    return false;
  }
  
  // Check if we're on GitHub Pages
  const isGitHubPages = 
    window.location.hostname.endsWith('.github.io') ||
    window.location.hostname === 'github.io';
  
  if (isGitHubPages) {
    console.log('Running on GitHub Pages');
    
    // Process auth redirects first
    if (processAuthRedirect()) {
      return; // Stop processing if we're handling an auth redirect
    }
    
    // If we're on a path that doesn't exist and not the 404.html page
    // we need to redirect to the 404.html page which will then handle the SPA routing
    if (!window.location.pathname.endsWith('/404.html') && 
        !window.location.pathname.endsWith('/index.html') &&
        !window.location.pathname.endsWith('/')) {
      
      // Check if this is a direct resource request (like .js, .css, etc.)
      const fileExtension = window.location.pathname.split('.').pop();
      const isResourceRequest = ['js', 'css', 'png', 'jpg', 'jpeg', 'gif', 'svg', 'json', 'html'].includes(fileExtension);
      
      if (!isResourceRequest) {
        console.log('Handling SPA redirect for path:', window.location.pathname);
        
        // Redirect to 404.html with the current path in the query
        const fullPath = window.location.pathname + window.location.search + window.location.hash;
        const encodedPath = encodeURIComponent(fullPath);
        window.location.replace('/404.html?path=' + encodedPath);
      }
    }
  } else {
    console.log('Not running on GitHub Pages, no redirect handling needed');
  }
})(); 