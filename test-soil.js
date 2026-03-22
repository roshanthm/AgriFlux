const https = require('https');

https.get('https://rest.isric.org/soilgrids/v2.0/properties/query?lon=-118.2437&lat=34.0522&property=phh2o&property=nitrogen&property=soc&property=sand&property=silt&property=clay&depth=0-5cm&value=mean', (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Body:', data);
  });
}).on('error', (err) => {
  console.error('Error:', err.message);
});
