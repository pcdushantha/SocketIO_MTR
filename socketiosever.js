const timeoutms=24*3600*1000; //24 hours
const childProcess = require('child_process');
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mysql = require('mysql');
const pingsock = io.of('/ping');
var ping = require('ping');
var schedule = require('node-schedule');
 

var pingfunc;
var pinginterval=3000;
var ipAddresses=[];

var links={};

// app.get('/node_modules/moment/moment.js', function(req, res){
//     res.sendFile(__dirname + '/node_modules/moment/moment.js');
// });
app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});
app.get('/bsstyles.css', function(req, res){
    res.sendFile(__dirname + '/bsstyles.css');
});
app.get('/scripts.js', function(req, res){
    res.sendFile(__dirname + '/scripts.js');
});

try{
    var mydb = mysql.createConnection({
        host: "127.0.0.1",
        user: "mtr",
        password: "root"    
    });
}catch(err){
    console.log("DB connection creation error")
}


var j = schedule.scheduleJob('*/30 * * * * *',async function(){

   async function createChild(destinations,index){
        var dataArray=[];
        var noOfDestinations=destinations.length;
        var process = childProcess.spawn('mtr',['-4','-p','-n','-c 5',destinations[index]]); 
                   
        timeout=setTimeout(function(){
            if(process != undefined){
                console.log('Timeout kill');
                process.stdin.end();
                process.stdout.end();
                process.kill('SIGINT');
                process = undefined;                        
                
            }
            
        }, 60000);

        process.stdout.on('data', function (data) {
            console.log('stdout: ' + data);                     
            
            var stdoutArray = String(data).split("\n");
           
            var datalength = stdoutArray.length;
            
            for(var i=0; i<datalength; i++ ){

               var recvArray= stdoutArray[i].split(" ");
               if(recvArray.length===8){
                recvArray[0]= parseInt(recvArray[0]);
                updateData(recvArray,dataArray);
               }
               
            }       
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

            var sql = "INSERT INTO dumps.mtr_save (`name`, `data`,`user`) VALUES(?,?,?)";  
            
            
            var name = destinations[index];
            try{
                mydb.query(sql,[name,JSON.stringify(dataArray),'TEST2'], function (err, result) {
                    if (err) throw err;
                    console.log("Number of records inserted: " + result.affectedRows);    
                });
            }catch(err){
                console.log(err);
            } 

            index++;
            if(index<noOfDestinations){
                
                createChild(destinations,index);                
            }
           
        });

        console.log('Child Process:',destinations[index]);
    }
   
    var destinations=[];
    await mydb.query("SELECT destination FROM dumps.mtr_dest", async function (err, result, fields) {
        if (err) throw err;
        
        await Object.keys(result).forEach(function(key) {       
            var row = result[key];       
            
            destinations.push(row.destination);
        });
        console.log(destinations);
        var index=0;
        createChild(destinations,index); 
        
    });


  });
// Load link details from the database
try{
    mydb.query("SELECT ip_addr,link_name,location FROM dumps.mtr", function (err, result, fields) {
        if (err) throw err;
        // console.log(result);
        Object.keys(result).forEach(function(key) {       
            var row = result[key];       
            links[row.ip_addr]={link_name:row.link_name,location:row.location};
            ipAddresses.push(row.ip_addr);
         });
         console.log("Links: ",links);
         var outjson={};
        async function pingfunction(){
            var cfg = {
                timeout: 2,               
            };
            
            await ipAddresses.forEach(function(host){
                ping.sys.probe(host, function(isAlive){
                    // var msg = isAlive ? 'host ' + host + ' is alive' : 'host ' + host + ' is dead';
                    //console.log(msg);
                    // io.local.emit('ping', msg);
                    outjson[host]=isAlive;

                },cfg);
            });
            
        }
         pingfunc=setInterval(async function(){
            await pingfunction();
            io.local.emit('ping', outjson);
            // console.log(outjson);
         },pinginterval);     
    });
}catch(err){
    console.log(err);
}




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
                try{
                    mydb.query(sql,[name,JSON.stringify(injsonobj.value),injsonobj.username], function (err, result) {
                        if (err) throw err;
                        console.log("Number of records inserted: " + result.affectedRows);    
                    });
                }catch(err){
                    console.log(err);
                }                
    
                break;

            case 'LOAD_DATA':                
            
                var sql = "SELECT data FROM dumps.mtr_save where name="+ JSON.stringify(injsonobj.value) +"AND "+ "user="+JSON.stringify(injsonobj.username) ;
                try{
                    mydb.query(sql,function (err, result) {
                        if (err) throw err;
                        if(result[0] != undefined){
                            console.log("LOAD_DATA result: ",result[0].data);
                            var outjsonobj={"command":"LOAD_DATA","value":result[0].data}
                            socket.emit("message",outjsonobj);                
                        }        
                    });
                }catch(err){
                    console.log(err);
                }                
    
                break;

            case 'LOAD_HISTORY':
            
                
                var sql = "SELECT data FROM dumps.mtr_save where name="+JSON.stringify(injsonobj.url) +"AND "+ "user="+JSON.stringify(injsonobj.username)+ " ORDER BY id DESC LIMIT 1";  
                
            
                try{
                    mydb.query(sql,function (err, result) {
                        if (err) throw err;
                        
                        if(result[0] != undefined){
                            // console.log("result[0].data", result[0].data);
                            console.log("LOAD_HISTORY result: ",result[0].data);
                            var outjsonobj={"command":"LOAD_HISTORY","value":result[0].data}
                            socket.emit("message",outjsonobj);   
                        }
                                     
                                
                    });
                }catch(err){
                    console.log(err);
                }            
    
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


function updateData(recvArray,dataArray){
    
     var index;
     for(index=0; index<dataArray.length; index++){
  
        if(dataArray[index][0] === recvArray[0]){
           if(dataArray[index][1] != recvArray[1]){
                dataArray=[];               
                break;
           }
           dataArray.splice(index,1,recvArray);
           break;
        }
        else if(dataArray[index][0] > recvArray[0]){
            dataArray.splice(index,0,recvArray);           
           break;
        }
        else if(recvArray[0] > dataArray[dataArray.length-1][0]){
            dataArray.push(recvArray);
            break;
         }
     }
     if(recvArray[0] ==1 && dataArray[0] === undefined ){
        dataArray.push(recvArray);   
     }
     
   }
