const timeoutms=60000;
const childProcess = require('child_process');
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mysql = require('mysql');

var mydb = mysql.createConnection({
    host: "127.0.0.1",
    user: "mtr",
    password: "root"    
  });

var ipAddresses=[];
var linkNames=[];

mydb.query("SELECT ip_addr,link_name FROM dumps.mtr", function (err, result, fields) {
    if (err) throw err;
     console.log("result: ",result);
    // console.log("No of Rows: ",result.affectedRows);
    Object.keys(result).forEach(function(key) {
       
        var row = result[key];
        ipAddresses.push(row.ip_addr);
        linkNames.push(row.link_name);
     });           
});

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});
app.get('/bsstyles.css', function(req, res){
    res.sendFile(__dirname + '/bsstyles.css');
  });
app.get('/scripts.js', function(req, res){
    res.sendFile(__dirname + '/scripts.js');
});

io.on('connection', function(socket){
    console.log('a user connected', socket.id);
    var process;
    var timeout;  
    var outjsonobj={"command":"START_IP","value":ipAddresses};
    socket.emit("message",outjsonobj);
    var outjsonobj={"command":"START_LINK","value":linkNames};
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
                  // code block
                  if(process === undefined){
                    
                    process = childProcess.spawn('mtr',['-4','-p','-n',injsonobj.value]); 
                    
                    // timeout=setTimeout(function(){
                    //     if(process != undefined){
                    //         console.log('Timeout kill');
                    //         process.stdin.end();
                    //         process.stdout.end();
                    //         process.kill('SIGINT');
                    //         process = undefined;                        
                    //         var outjsonobj={"command":"TIMEOUT","value":" "}
                    //         connection.sendUTF(JSON.stringify(outjsonobj));
                    //     }
                        
                    // }, timeoutms);
    
                    process.stdout.on('data', function (data) {
                        console.log('stdout: ' + data); 
                        //connection.sendUTF(data);
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
                  
                    var sql = "INSERT INTO dumps.mtr_save (`name`, `data`) VALUES(?,?)";  
                
                    var today = new Date();
                    var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
                    var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
                    var name = date+' '+time+' '+injsonobj.url;
                    mydb.query(sql,[name,JSON.stringify(injsonobj.value)], function (err, result) {
                        if (err) throw err;
                        console.log("Number of records inserted: " + result.affectedRows);    
                    });
        
                    break;
                case 'LOAD_DATA':
                
                //SELECT * FROM dumps.mtr_save ORDER BY id DESC LIMIT 0,3;
                //SELECT data FROM dumps.mtr_save ORDER BY id DESC LIMIT 1;
                //SELECT data FROM dumps.mtr_save where name="2019-5-11 19:27:15 www.yahoo.com";
                    // var sql = "SELECT data FROM dumps.mtr_save ORDER BY id DESC LIMIT 1";  
                    var sql = "SELECT data FROM dumps.mtr_save where name="+ JSON.stringify(injsonobj.value) ;
                    
                    mydb.query(sql,function (err, result) {
                        if (err) throw err;
                        console.log("LOAD_DATA result: ",result[0].data);
                        var outjsonobj={"command":"LOAD_DATA","value":result[0].data}
                        socket.emit("message",outjsonobj);
                        
                              
                    });
        
                    break;
                case 'LOAD_HISTORY':
                
                //SELECT * FROM dumps.mtr_save ORDER BY id DESC LIMIT 0,3;
                //SELECT data FROM dumps.mtr_save ORDER BY id DESC LIMIT 1;
                    var nameArray=[];
                    var sql = "SELECT name FROM dumps.mtr_save ORDER BY id DESC LIMIT 10";  
                
                    
                    mydb.query(sql,function (err, result) {
                        if (err) throw err;
                        Object.keys(result).forEach(function(key) {
                            // console.log("KEY:",key);
                            var row = result[key];  
                            nameArray.push(row.name);                         
                            
                        });
                        // console.log(nameArray);
                        var outjsonobj={"command":"LOAD_HISTORY","value":JSON.stringify(nameArray)}
                        socket.emit("message",outjsonobj);
                        
                                
                    });
        
                    break;
                default:
                 
              }

        

    
    });
  });

  http.listen(3000, function(){
    console.log('listening on *:3000');
  });

