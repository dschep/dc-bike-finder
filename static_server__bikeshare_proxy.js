// https://gist.github.com/respectTheCode/1926868
// http://www.catonmat.net/http-proxy-in-nodejs/
var http = require("http"),
    url = require("url"),
    path = require("path"),
    fs = require("fs"),
    mime = require("mime")
    port = process.argv[2] || process.env.PORT || 8888;

http.createServer(function(request, response) {

  var uri = url.parse(request.url).pathname
    , filename = path.join(process.cwd(), uri);
  

  if (uri == '/stations/stations.xml') {
    var proxy = http.createClient(80, 'feeds.capitalbikeshare.com')
    var proxy_request = proxy.request(request.method, request.url, request.headers);
    proxy_request.addListener('response', function (proxy_response) {
      proxy_response.addListener('data', function(chunk) {
        response.write(chunk, 'binary');
      });
      proxy_response.addListener('end', function() {
        response.end();
      });
      response.writeHead(proxy_response.statusCode, proxy_response.headers);
    });
    request.addListener('data', function(chunk) {
      proxy_request.write(chunk, 'binary');
    });
    request.addListener('end', function() {
      proxy_request.end();
    }); 
  } else {
    path.exists(filename, function(exists) {
      if(!exists) {
	response.writeHead(404, {"Content-Type": "text/plain"});
	response.write("404 Not Found\n");
	response.end();
	return;
      }

	  if (fs.statSync(filename).isDirectory()) filename += '/index.html';

      fs.readFile(filename, "binary", function(err, file) {
	if(err) {        
	  response.writeHead(500, {"Content-Type": "text/plain"});
	  response.write(err + "\n");
	  response.end();
	  return;
	}

	response.writeHead(200, {"Content-Type": mime.lookup(filename)});
	response.write(file, "binary");
	response.end();
      });
    });
  }
}).listen(parseInt(port, 10));

console.log("Static file server running at\n  => http://localhost:" + port + "/\nCTRL + C to shutdown");
