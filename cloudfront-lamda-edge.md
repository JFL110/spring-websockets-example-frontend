# Cloudfront Lambda@Edge 

Path routing and caching is controlled by two Lambda@Edge functions:

## Origin request
```
exports.handler = (event, context, callback) => {
    
  const gzipPathSuffix = '.gz';
  const brPathSuffix = '.br';

  const { request } = event.Records[0].cf;
  const { headers } = request;

  // If not static - route to home.html
  if(!request.uri.includes('/static/')){
    request.uri = '/home.html';
    callback(null, request);
    return;
  }

  // Check supported encodings
  const isBrotliSupported = headers['accept-encoding'] && headers['accept-encoding'][0].value.indexOf('br') > -1
  const isGzipSupported = headers['accept-encoding'] && headers['accept-encoding'][0].value.indexOf('gzip') > -1
  
  if(isGzipSupported || isBrotliSupported){
    const file = request.uri.substring(request.uri.lastIndexOf('/'));
    if(file.includes("bundle.js")){
      // Update request path based on custom header
      let newUri = request.uri + (isBrotliSupported ? brPathSuffix : gzipPathSuffix);
      request.uri = newUri;
    }
  }
  callback(null, request);
};
```

## Viewer response
```
exports.handler = async (event) => {
  const { response, request } = event.Records[0].cf;
  const { headers } = response;

  const headerCacheControl = 'Cache-Control';
  const defaultTimeToLive = 15780000; // 6 months

  if (response.status === '200' && 
        request.uri.startsWith("/static/") && 
        !headers[headerCacheControl.toLowerCase()]) {
      headers[headerCacheControl.toLowerCase()] = [{
        key: headerCacheControl,
        value: `public, max-age=${defaultTimeToLive}`,
      }];
  }
    return response;
};
```
