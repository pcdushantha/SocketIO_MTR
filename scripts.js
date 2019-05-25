    
var ipAddresses=[];
var linkNames=[];
var url;
var status = "STOPPED";
var displayArray1 =[];
var displayArray2=[];
var displayArray3=[];
var displayArray=[displayArray1,displayArray2,displayArray3];

var table1 = document.getElementById("table1");
var table2 = document.getElementById("table2");
var table3 = document.getElementById("table3");
var table=[table1,table2,table3];
var singapore = document.getElementById("pingsinga");
var mumbai = document.getElementById("pingmumbai");
var oman = document.getElementById("pingoman");
var table1_heading = document.getElementById("table1_name");
var table2_heading = document.getElementById("table2_name");
var table3_heading = document.getElementById("table3_name");
var timevalue=document.getElementById("timeInput");
var timediv=document.getElementById("inputGroupSelect01");
//  var getdate=document.getElementById("getdate");

var table1name,table2name,table3name;
var singaporeLinks=[];
var mumbaiLinks=[];
var omanLinks = [];
var xhttp = new XMLHttpRequest();

//  xhttp.open("GET", "https://sira.dialog.lk/api/getUserDetails", false);
//  xhttp.send();
//  var response= JSON.parse(xhttp.responseText)
//  var userName=response.userName;
var userName="CHARITH_09589";


var socket = io();
var timeout;
var pingtimeout;


    
socket.on('ping', function(msg){
   console.log(msg);

   clearTimeout(pingtimeout);

   Object.keys(msg).forEach(function(key){
      
      if(singaporeLinks.includes(key)){
         
         msg[key] ? singapore.rows[singaporeLinks.indexOf(key)+1].style.backgroundColor= "forestgreen" : singapore.rows[singaporeLinks.indexOf(key)+1].style.backgroundColor= "orangered";
      }
      else if(mumbaiLinks.includes(key)){
         msg[key] ? mumbai.rows[mumbaiLinks.indexOf(key)+1].style.backgroundColor= "forestgreen" : mumbai.rows[mumbaiLinks.indexOf(key)+1].style.backgroundColor= "orangered";
      }
      else if(omanLinks.includes(key)){
         msg[key] ? oman.rows[omanLinks.indexOf(key)+1].style.backgroundColor= "forestgreen" : oman.rows[omanLinks.indexOf(key)+1].style.backgroundColor= "orangered";
      }

   });

   pingtimeout=setTimeout(function(){
      for(var i=0; i<singaporeLinks.length;i++){
         singapore.rows[i+1].style.backgroundColor= "white" ;
      }
      for(var i=0; i<mumbaiLinks.length;i++){
         mumbai.rows[i+1].style.backgroundColor= "white" ;
      }
      for(var i=0; i<omanLinks.length;i++){
         oman.rows[i+1].style.backgroundColor= "white" ;
      }
   }, 5000);
});
    
socket.on('message', function(msg){
   console.log('message: ' + msg);

   status = "RUNNING";

   var injsonobj = msg;
   switch(injsonobj.command){
      case "STOP":
         status = "STOPPED";
      break;
   
      case "LINKS":
         status = "STOPPED";
         var rowCount=singapore.rows.length;     
         for (var i = 1; i < rowCount; i++) {         
            singapore.deleteRow(1);
         }
         var rowCount=mumbai.rows.length;     
         for (var i = 1; i < rowCount; i++) {         
            mumbai.deleteRow(1);
         }
         var rowCount=oman.rows.length;     
         for (var i = 1; i < rowCount; i++) {         
            oman.deleteRow(1);
         }
      
         Object.keys(injsonobj.value).forEach(function(key){
         
            ipAddresses.push(key);
            linkNames.push(injsonobj.value[key].link_name);
            
            switch(injsonobj.value[key].location){
               case "Singapore":
                  singaporeLinks.push(key);
                  var row = singapore.insertRow(singapore.rows.length);
                  var cell = row.insertCell(0);
                  cell.innerHTML ="<span style='font-weight:bold'  >" + key + " ["+injsonobj.value[key].link_name+"]" +"</span>";
               break;
               case "Mumbai":
                  mumbaiLinks.push(key);
                  var row = mumbai.insertRow(mumbai.rows.length);
                  var cell = row.insertCell(0);
                  cell.innerHTML ="<span style='font-weight:bold'  >" + key + " ["+injsonobj.value[key].link_name+"]"+"</span>";
               break;
               case "Oman":
                  omanLinks.push(key);
                  var row = oman.insertRow(oman.rows.length);
                  var cell = row.insertCell(0);
                  cell.innerHTML ="<span style='font-weight:bold'  >" + key + " ["+injsonobj.value[key].link_name+"]"+"</span>";
               break;
            }

         });
      
      break;
      case "DATA":
         var data = injsonobj.value;
         
         var webSocketArray = data.split("\n");
         var datalength = webSocketArray.length;
         
         for(var i=0; i<datalength; i++ ){

            var recvArray= webSocketArray[i].split(" ");
            if(recvArray.length===8){
               recvArray[0]= parseInt(recvArray[0]);
               updateTable(recvArray);
            }
         }       
      break;
      case "LOAD_HISTORY":
         status = "STOPPED";
         
         displayArray2 = JSON.parse(injsonobj.value);
         var rowCount=table[1].rows.length;
         
         for (var i = 1; i < rowCount; i++) {
            
            table[1].deleteRow(1);
         }  
         for(var i=0;i< displayArray2.length;i++){
            
            insertRowTable(displayArray2[i],i,table[1]);
         }
      break;
      case "LOAD_DATA":
         status = "STOPPED";         
         
         displayArray[injsonobj.table] = JSON.parse(injsonobj.value);
         var rowCount=table[injsonobj.table].rows.length;
         
         for (var i = 1; i < rowCount; i++) {
            
            table[injsonobj.table].deleteRow(1);
         }  
         for(var i=0;i< displayArray[injsonobj.table].length;i++){
           
            insertRowTable(displayArray[injsonobj.table][i],i,table[injsonobj.table]);
         }
      break;
      case "ERROR":
         alert(injsonobj.value);
         clearInterval(timeout);
      break;
      case "TIMEOUT":
         alert("!! TIMEOUT !!");
         clearInterval(timeout);
      break;

   }
});
     
 
socket.on('disconnect', function(){
   status = "STOPPED";
   // websocket is closed.
   alert("Connection is closed..."); 
});    
     
   

function ServiceStart() {

   var timevalue=document.getElementById("timeInput");
   var timediv=document.getElementById("inputGroupSelect01");
   var timeoutms=parseInt(timevalue.value)*1000; 
   switch(timediv.value){
      case "Minutes":
         timeoutms=timeoutms*60;
      break;
      case "Seconds":
         
      break;
      case "Hours":
         timeoutms=timeoutms*60*60;
      break;
   }
   
   if(status === "STOPPED"){
   
      displayArray[0] =[];
      var rowCount=table[0].rows.length;
     
      for (var i = 1; i < rowCount; i++) {
         
         table[0].deleteRow(1);
      }  
      
      url = document.getElementById("input").value;
      
      if(url === ''){
         
         alert("Please enter URL/IP"); 
      }   
      else{
         
         var jsonobj={"command":"START","value":String(url),"username":userName}            
         socket.emit("message",jsonobj);
         timeout=setTimeout(function(){
            ServiceStop();                        
         }, timeoutms);
      }
   }
   else{
      alert("Server Busy !");
   }
   
}

function ServiceStop() {   
   clearInterval(timeout);
   var jsonobj={"command":"STOP","value":" "}            
   socket.emit("message",jsonobj);
}

function SavetoDB() {   

   var jsonobj={"command":"SAVE","value":displayArray[0],"url":document.getElementById("input").value,"username":userName}            
   socket.emit("message",jsonobj);
   
}


document.getElementById("start_button").onclick = ServiceStart;
document.getElementById("stop_button").onclick = ServiceStop;
document.getElementById("save_button").onclick = SavetoDB;
document.getElementById("input").onchange = displaycolumns;

function displaycolumns(){
   var column1=document.getElementById("col1");
   column1.style.display="block";
   var column2=document.getElementById("col2");
   column2.style.display="block";
   var column3=document.getElementById("col3");
   column3.style.display="block";

}

function updateTable(recvArray){  
   
   var index;
   for(index=0; index<displayArray[0].length; index++){

      if(displayArray[0][index][0] === recvArray[0]){
         if(displayArray[0][index][1] != recvArray[1]){
            displayArray[0]=[];
            var rowCount=table[0].rows.length;     
            for (var i = 1; i < rowCount; i++) {         
               table[0].deleteRow(1);
            }
            break;
         }
         displayArray[0].splice(index,1,recvArray);
         table[0].deleteRow(index+1);
         insertRowTable(recvArray,index,table[0]);
         break;
      }
      else if(displayArray[0][index][0] > recvArray[0]){
         displayArray[0].splice(index,0,recvArray);
         insertRowTable(recvArray,index,table[0]);
         break;
      }
   }
   if(recvArray[0] ==1 && displayArray[0][0] === undefined ){
      displayArray[0].push(recvArray);
      insertRowTable(recvArray,0,table[0]);
   }
   else if(recvArray[0] > displayArray[0][displayArray[0].length-1][0]){
      displayArray[0].push(recvArray);
      insertRowTable(recvArray,displayArray[0].length-1,table[0]);
   }

}

function insertRowTable(recvArray,index,table){

   var row = table.insertRow(index+1);
   var cell1 = row.insertCell(0);
   var cell2 = row.insertCell(1);
   var cell3 = row.insertCell(2);
   var cell4 = row.insertCell(3);
   var cell5 = row.insertCell(4);
   var cell6 = row.insertCell(5);
   var cell7 = row.insertCell(6);
   var cell8 = row.insertCell(7);
   cell1.innerHTML = recvArray[0];
   if (ipAddresses.includes(recvArray[1])){
      cell2.innerHTML = "<span style='color:#E74C3C;font-weight:bold'  >" + recvArray[1]+"   "+linkNames[ipAddresses.indexOf(recvArray[1])] +"</span>" ;
   }
   else{
      cell2.innerHTML = recvArray[1];
   }
   
   cell3.innerHTML = parseFloat(recvArray[2])/1000;
   cell4.innerHTML = recvArray[3];
   cell5.innerHTML = recvArray[4];
   cell6.innerHTML = recvArray[5];
   cell7.innerHTML = recvArray[6];
   cell8.innerHTML = recvArray[7];
}



$('#getdate3').datepicker(
   {
      language: 'en',
      onSelect: function onSelect(fd, date) {
         var rowCount=table[2].rows.length;
         
         for (var i = 1; i < rowCount; i++) {            
            table[2].deleteRow(1);
         }  
         var localdate= date.getFullYear()+'-'+(date.getMonth()+1)+'-'+date.getDate();
         
         var jsonobj={"command":"LOAD_DATA","url":String(document.getElementById("input").value),"username":userName,"date":localdate,table:2};  
         socket.emit("message",jsonobj);
      }
   }
)
// Access instance of plugin
$('#getdate3').data('datepicker')

$('#getdate2').datepicker(
   {
      language: 'en',
      onSelect: function onSelect(fd, date) {
         var rowCount=table[1].rows.length;
         
         for (var i = 1; i < rowCount; i++) {            
            table[1].deleteRow(1);
         }  
         var localdate= date.getFullYear()+'-'+(date.getMonth()+1)+'-'+date.getDate();
         
         var jsonobj={"command":"LOAD_DATA","url":String(document.getElementById("input").value),"username":userName,"date":localdate,table:1};  
         socket.emit("message",jsonobj);
      }
   }
)
// Access instance of plugin
$('#getdate2').data('datepicker')

$('#getdate1').datepicker(
   {
      language: 'en',
      onSelect: function onSelect(fd, date) {
         var rowCount=table[0].rows.length;
         
         for (var i = 1; i < rowCount; i++) {
            
            table[0].deleteRow(1);
         }  
         var localdate= date.getFullYear()+'-'+(date.getMonth()+1)+'-'+date.getDate();
         
         var jsonobj={"command":"LOAD_DATA","url":String(document.getElementById("input").value),"username":userName,"date":localdate,table:0};  
         socket.emit("message",jsonobj);
      }
   }
)
// Access instance of plugin
$('#getdate1').data('datepicker')
