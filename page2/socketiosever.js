const timeoutms=24*3600*1000; //24 hours
const childProcess = require('child_process');
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mysql = require('mysql');
const pingsock = io.of('/ping');
// var ping = require('ping');
// var pinginterval;

var links={};

app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});
app.get('/bsstyles.css', function(req, res){
    res.sendFile(__dirname + '/bsstyles.css');
});
app.get('/scripts.js', function(req, res){
    res.sendFile(__dirname + '/scripts.js');
});

var mydb = mysql.createConnection({
    host: "127.0.0.1",
    user: "mtr",
    password: "root"    
  });


// Load link details from the database
mydb.query("SELECT ip_addr,link_name FROM dumps.mtr", function (err, result, fields) {
    if (err) throw err;
    
    Object.keys(result).forEach(function(key) {       
        var row = result[key];       
        links[row.ip_addr]=row.link_name;
     });
     console.log("Links: ",links);
    
    //  pinginterval=setInterval(function(){
    //     var cfg = {
    //         timeout: 2,
           
    //     };
    //     ipAddresses.forEach(function(host){
    //         ping.sys.probe(host, function(isAlive){
    //             var msg = isAlive ? 'host ' + host + ' is alive' : 'host ' + host + ' is dead';
    //             console.log(msg);
    //         },cfg);
    //     });
    //  },3000);     
});



io.on('connection', function(socket){
    console.log('a user connected', socket.id);
    var process;
    var timeout;  
   
    //Send link details to the client
    var outjsonobj={"command":"LINKS","value":links};
    socket.emit("message",outjsonobj);

    socket.on('disconnect', function(){
        console.log('user disconnected');
        if(process != undefined){
            process.stdin.end();
            process.stdout.end();
            process.kill('SIGINT');
            process = undefined; 
        }
    });

    socket.on('message', function(message){
        console.log('RECEIVED :' ,message);      
            
        var injsonobj = message;
        
        switch(injsonobj.command){
            case 'START':
                
                if(process === undefined){
                
                    process = childProcess.spawn('mtr',['-4','-p','-n',injsonobj.value]); 
                    
                    timeout=setTimeout(function(){
                        if(process != undefined){
                            console.log('Timeout kill');
                            process.stdin.end();
                            process.stdout.end();
                            process.kill('SIGINT');
                            process = undefined;                        
                            var outjsonobj={"command":"TIMEOUT","value":" "}
                            connection.sendUTF(JSON.stringify(outjsonobj));
                        }
                        
                    }, timeoutms);

                    process.stdout.on('data', function (data) {
                        console.log('stdout: ' + data);                     
                        var outjsonobj={"command":"DATA","value":String(data)}
                        socket.emit("message",outjsonobj);   
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
                        var outjsonobj={"command":"STOP","value":" "}
                        socket.emit("message",outjsonobj); 
                    });

                    console.log('Child Process');
    
                }
                break;
            case 'STOP':
                
                if(process != undefined){               
                    // process.stdin.end();
                    //process.stdout.end();
                    process.kill('SIGINT');
                    clearTimeout(timeout);
                    process = undefined 
                }

                break;

            case 'SAVE':
                
                var sql = "INSERT INTO dumps.mtr_save (`name`, `data`,`user`) VALUES(?,?,?)";  
            
                var today = new Date();
                var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
                var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
                var name = date+' '+time+' '+injsonobj.url;
                mydb.query(sql,[name,JSON.stringify(injsonobj.value),injsonobj.username], function (err, result) {
                    if (err) throw err;
                    console.log("Number of records inserted: " + result.affectedRows);    
                });
    
                break;

            case 'LOAD_DATA':                
            
                var sql = "SELECT data FROM dumps.mtr_save where name="+ JSON.stringify(injsonobj.value) +"AND "+ "user="+JSON.stringify(injsonobj.username) ;
                
                mydb.query(sql,function (err, result) {
                    if (err) throw err;
                    console.log("LOAD_DATA result: ",result[0].data);
                    var outjsonobj={"command":"LOAD_DATA","value":result[0].data}
                    socket.emit("message",outjsonobj);                
                            
                });
    
                break;

            case 'LOAD_HISTORY':
            
                var nameArray=[];
                var sql = "SELECT name FROM dumps.mtr_save where user="+JSON.stringify(injsonobj.username) + " ORDER BY id DESC LIMIT 10";  
            
                
                mydb.query(sql,function (err, result) {
                    if (err) throw err;
                    Object.keys(result).forEach(function(key) {
                        var row = result[key];  
                        nameArray.push(row.name);
                    });
                    
                    var outjsonobj={"command":"LOAD_HISTORY","value":JSON.stringify(nameArray)}
                    socket.emit("message",outjsonobj);                 
                            
                });
    
                break;

            default:
                
        } 
    });
});

pingsock.on('connection', function(pingsocket){
    console.log('someone connected on pingsock');
});
http.listen(3000, function(){
    console.log('listening on *:3000');
});



