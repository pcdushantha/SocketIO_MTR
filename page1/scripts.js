
    var timeout;
    var ipAddresses=[];
    var linkNames=[];
    var status = "STOPPED";
    var displayArray =[];
    var compareArray=[];
    var nameArray=[];
    var currentTable = document.getElementById("table1");
    var compareTable = document.getElementById("table3");
    var savedTable = document.getElementById("table2");

    var xhttp = new XMLHttpRequest();
    
   //  xhttp.open("GET", "https://sira.dialog.lk/api/getUserDetails", false);
   //  xhttp.send();
   //  var response= JSON.parse(xhttp.responseText)
   //  var userName=response.userName;
   var userName="CHARITH_09589";


    var socket = io();
    
    var jsonobj={"command":"LOAD_HISTORY","value":"","username":userName}  
    socket.emit("message",jsonobj);
    
    socket.on('message', function(msg){
       console.log('message: ' + msg);
       
      status = "RUNNING";
      // var received_msg = evt.data;
      // console.log(received_msg);
       
      //received_msg.trim();
      var injsonobj = msg;
      switch(injsonobj.command){
         case "STOP":
            status = "STOPPED";
            break;

         case "LINKS":
            status = "STOPPED"; 
            Object.keys(injsonobj.value).forEach(function(key){
               
               ipAddresses.push(key);
               linkNames.push(injsonobj.value[key]);

            });
            
            break;
         case "DATA":
            var data = injsonobj.value;
            console.log(data);
            var webSocketArray = data.split("\n");
            var datalength = webSocketArray.length;
            
            for(var i=0; i<datalength; i++ ){

               var recvArray= webSocketArray[i].split(" ");
               recvArray[0]= parseInt(recvArray[0]);
               updateTable(recvArray);
            }       
            break;
         case "TIMEOUT":
            alert("!! TIMEOUT !!");
            break;
         case "LOAD_DATA":
            status = "STOPPED";
            // console.log("TYPE OF LOAD DATA:", typeof(injsonobj.value));
            compareArray = JSON.parse(injsonobj.value);
            var rowCount=compareTable.rows.length;
            // console.log('currentTable.length :', rowCount);
            for (var i = 1; i < rowCount; i++) {
               // console.log('delete row :', i);
               compareTable.deleteRow(1);
            }  
            for(var i=0;i< compareArray.length;i++){
               // console.log("LOAD DATA:", compareArray[i]);
               insertRowTable(compareArray[i],i,compareTable);
            }
            break;
         case "LOAD_HISTORY":
            status = "STOPPED";
            // console.log("TYPE OF HISTORY DATA:", typeof(injsonobj.value));
            var rowCount=savedTable.rows.length;
            nameArray = JSON.parse(injsonobj.value);
            for (var i = 1; i < rowCount; i++) {
               // console.log('delete row :', i);
               savedTable.deleteRow(1);
            }  
            for(var i=0;i< nameArray.length;i++){
               // console.log("LOAD DATA:", compareArray[i]);
               var row = savedTable.insertRow(i+1);
               var cell1 = row.insertCell(0);
               var rowName= "row"+String(i+1);
               // cell1.innerHTML = "<span id="+"'"+rowName+"'"+ "style='color:#E74C3C;font-weight:bold'  >" + nameArray[i] +"</span>" ;
               cell1.innerHTML = nameArray[i] ;
            }
            document.querySelectorAll('#table2 td')
            .forEach(e => e.addEventListener("click", function() {
               // Here, `this` refers to the element the event was hooked on
               console.log("clicked")
               document.querySelectorAll('#table2 td')
               .forEach(e => function() {
                  // Here, `this` refers to the element the event was hooked on
                   //console.log("All")
                  
                   e.style.backgroundColor = 'white';
               }());
               
               e.style.backgroundColor = '#ffeecdaf' ;
               var jsonobj={"command":"LOAD_DATA","value":e.innerHTML,"username":userName}            
               
               socket.emit("message",jsonobj);
            }));

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
   
      

   
   
   if(status === "STOPPED"){
   
      displayArray =[];
      var rowCount=currentTable.rows.length;
      // console.log('currentTable.length :', rowCount);
      for (var i = 1; i < rowCount; i++) {
         // console.log('delete row :', i);
         currentTable.deleteRow(1);
      }  
      
      var url = document.getElementById("input").value;
      
     
      if(url === ''){
         console.log('Please enter URL');
         alert("Please enter URL"); 
      }   
      else{
         
         var jsonobj={"command":"START","value":String(url)}            
         socket.emit("message",jsonobj);
         if(timevalue.value != ""){
            // console.log("timevalue:",timevalue);
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
             timeout=setTimeout(function(){
               ServiceStop();                        
                    }, timeoutms);
         }
      }
   }
   else {alert("Server Busy !");}
   
 }

 function ServiceStop() {   
   
      var jsonobj={"command":"STOP","value":" "}            
      socket.emit("message",jsonobj);
      clearTimeout(timeout); 
     
   
 }

 function SavetoDB() {   
   
      var jsonobj={"command":"SAVE","value":displayArray,"url":document.getElementById("input").value,"username":userName}            
      socket.emit("message",jsonobj);
      var jsonobj={"command":"LOAD_HISTORY","value":"","username":userName}            
      socket.emit("message",jsonobj);   
   
 }

 document.getElementById("start_button").onclick = ServiceStart;
 document.getElementById("stop_button").onclick = ServiceStop;
 document.getElementById("save_button").onclick = SavetoDB;
//  savedTable.cells.addEventListener("click", function(){ alert("Hello World!"); });

 function updateTable(recvArray){ 
  
   
   var index;
   for(index=0; index<displayArray.length; index++){

      if(displayArray[index][0] === recvArray[0]){
         if(displayArray[index][1] != recvArray[1]){
            displayArray=[];
            var rowCount=currentTable.rows.length;     
            for (var i = 1; i < rowCount; i++) {         
               currentTable.deleteRow(1);
            }
            break;
         }
         displayArray.splice(index,1,recvArray);
         currentTable.deleteRow(index+1);
         insertRowTable(recvArray,index,currentTable);
         break;
      }
      else if(displayArray[index][0] > recvArray[0]){
         displayArray.splice(index,0,recvArray);
         insertRowTable(recvArray,index,currentTable);
         break;
      }
   }
   if(recvArray[0] ==1 && displayArray[0] === undefined ){
      displayArray.push(recvArray);
      insertRowTable(recvArray,0,currentTable);

   }
   else if(recvArray[0] > displayArray[displayArray.length-1][0]){
      displayArray.push(recvArray);
      insertRowTable(recvArray,displayArray.length-1,currentTable);
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