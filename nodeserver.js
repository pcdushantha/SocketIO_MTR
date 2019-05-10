const timeoutms=60000;
const childProcess = require('child_process');
var WebSocketServer = require('websocket').server;
var http = require('http');
const utf8 = require('utf8');

var server = http.createServer(function(request, response) {
    console.log((new Date()) + ' Received request for ' + request.url);
    response.writeHead(404);
    response.end();
});
server.listen(8888, function() {
    console.log((new Date()) + ' Server is listening on port 8888');
});

wsServer = new WebSocketServer({
    httpServer: server,
    // You should not use autoAcceptConnections for production 
    // applications, as it defeats all standard cross-origin protection 
    // facilities built into the protocol and the browser.  You should 
    // *always* verify the connection's origin and decide whether or not 
    // to accept it. 
    autoAcceptConnections: false
});

function originIsAllowed(origin) {
  // put logic here to detect whether the specified origin is allowed. 
  return true;
}

//create an array to hold your connections
var connections = [];

wsServer.on('request', function(request) {
    if (!originIsAllowed(request.origin)) {
      // Make sure we only accept requests from an allowed origin 
      request.reject();
      console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
      return;
    }
    var connection = request.accept('echo-protocol', request.origin);
    
    //store the new connection in your array of connections
    connections.push(connection);
    var process;
    var timeout;
    console.log((new Date()) + ' Connection accepted.');
    connection.sendUTF("STOP");
    connection.on('message', function(message) {
        if (message.type === 'utf8') {
            console.log('Received Message: ' + message.utf8Data);
            
            var jsonobj = JSON.parse(message.utf8Data);
            if(jsonobj.command === 'START' && process === undefined){

                process = childProcess.spawn('mtr',['-4','-p','-n',jsonobj.value]); 
                
                timeout=setTimeout(function(){
                    if(process != undefined){
                        console.log('Timeout kill');
                        process.stdin.end();
                        process.stdout.end();
                        process.kill('SIGINT');
                        process = undefined;
                        connection.sendUTF("TIMEOUT");
                    }
                    
                }, timeoutms);

                process.stdout.on('data', function (data) {
                    console.log('stdout: ' + data); 
                    connection.sendUTF(data);    
                });

                process.stderr.on('data', function (data) {    
                    console.log('stderr: ' + data); 
                    process = undefined; 
                    clearTimeout(timeout);  
                });
                    
                process.on('close', function (code) {    
                    console.log('Child process exit with code: ' + code);
                    process = undefined;
                    clearTimeout(timeout);
                    connection.sendUTF("STOP");
                });

                console.log('Child Process');

            }
            else if(jsonobj.command === 'STOP'  && process != undefined){               
               // process.stdin.end();
                //process.stdout.end();
                process.kill('SIGINT');
                clearTimeout(timeout);
                process = undefined                                
            }
            else if(jsonobj.command === 'SAVE'  && process != undefined){
                // save data to the database
            }             
        }
        else if (message.type === 'binary') {
            console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
            connection.sendBytes(message.binaryData);
        }

    });
    connection.on('close', function(reasonCode, description) {
        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
    });
   
    // var arraylength =connections.length;
    // function testjsfunc(){
    //     var testjs = 'testjs' + String(arraylength);
    //     connection.sendUTF(testjs); 
    // };
    // var id = setInterval(testjsfunc, 1000);
    // var process = childProcess.spawn('node', ['child.js']); 
    

    
});