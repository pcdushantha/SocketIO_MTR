    
    var ipAddresses=[];
    var linkNames=[];
    var url;
    var status = "STOPPED";
    var displayArray1 =[];
    var displayArray2=[];
    var displayArray3=[];
    var table1 = document.getElementById("table1");
    var table2 = document.getElementById("table2");
    var table3 = document.getElementById("table3");
    var singapore = document.getElementById("pingsinga");
    var mumbai = document.getElementById("pingmumbai");
    var oman = document.getElementById("pingoman");
    var table1_heading = document.getElementById("table1_name");
    var table2_heading = document.getElementById("table2_name");
    var table3_heading = document.getElementById("table3_name");
    var timevalue=document.getElementById("timeInput");
    var timediv=document.getElementById("inputGroupSelect01");
    
    var table1name,table2name,table3name;
    var singaporeLinks=[];
    var mumbaiLinks=[];
    var omanLinks = [];

    var socket = io();
    var timeout;
    
    socket.on('ping', function(msg){
      // console.log(msg);
      // var injson=JSON.parse(msg);
      Object.keys(msg).forEach(function(key){
         console.log(msg[key] ? "True":"False");
         // if(singaporeLinks.includes(key)){
         //    singapore.rows[singaporeLinks.indexOf(key)+1].style.backgroundColor= yellow";
         // }
         // else if(mumbaiLinks.includes(key)){

         // }
         // else if(omanLinks.includes(key)){

         // }

      });
      // var data = msg.split("\n");
      // console.log(data);
      
      // var datalength = data.length;
      
      // for(var i=0; i<datalength; i++ ){

      //    var recvArray= data[i].split(" ");
      //    if(singaporeLinks.includes(recvArray[1])){}
      //    recvArray[0]= parseInt(recvArray[0]);
      //    updateTable(recvArray);
      // }       
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
            Object.keys(injsonobj.value).forEach(function(key){
               
               ipAddresses.push(key);
               linkNames.push(injsonobj.value[key].link_name);
               //console.log(injsonobj.value[key].link_name);
               switch(injsonobj.value[key].location){
                  case "Singapore":
                     singaporeLinks.push(key);
                     var row = singapore.insertRow(singapore.rows.length);
                     var cell = row.insertCell(0);
                     cell.innerHTML = key + " ["+injsonobj.value[key].link_name+"]"
                  break;
                  case "Mumbai":
                     mumbaiLinks.push(key);
                     var row = mumbai.insertRow(mumbai.rows.length);
                     var cell = row.insertCell(0);
                     cell.innerHTML = key + " ["+injsonobj.value[key].link_name+"]"
                  break;
                  case "Oman":
                     omanLinks.push(key);
                     var row = oman.insertRow(oman.rows.length);
                     var cell = row.insertCell(0);
                     cell.innerHTML = key + " ["+injsonobj.value[key].link_name+"]"
                  break;
               }

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
         

      }
   
   });
     
 
   socket.on('disconnect', function(){
      status = "STOPPED";
       // websocket is closed.
      alert("Connection is closed..."); 
    });    
     
   

function ServiceStart() {
   if(status === "STOPPED"){
   
      displayArray1 =[];
      var rowCount=table1.rows.length;
     
      for (var i = 1; i < rowCount; i++) {
         
         table1.deleteRow(1);
      }  
      
       url = document.getElementById("input").value;
      
      if(url === ''){
         console.log('Please enter URL');
         alert("Please enter URL"); 
      }   
      else {
         
         var jsonobj={"command":"START","value":String(url)}            
         socket.emit("message",jsonobj);
      }
   }
   else {alert("Server Busy !");}
   
 }

 function ServiceStop() {   
      clearInterval(timeout);
      var jsonobj={"command":"STOP","value":" "}            
      socket.emit("message",jsonobj);
    
   
 }

//  function SavetoDB() {   
   
//       var jsonobj={"command":"SAVE","value":displayArray1,"url":document.getElementById("input").value}            
//       socket.emit("message",jsonobj);
//       var jsonobj={"command":"LOAD_HISTORY","value":""}            
//       socket.emit("message",jsonobj);
     
//  }

 function StartLive(){
      //start service
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
      
      ServiceStart();
      var all = document.getElementsByClassName('input-group');
      for (var i = 0; i < all.length; i++) {
         all[i].style.marginTop = 0 ;
      }
      var column3=document.getElementById("col1");
      column3.style.display="block";
      table1name= new Date().toLocaleString();
      table1_heading.innerHTML=table1name;
      timeout=setInterval(function(){
         console.log("value: ",typeof(parseInt(timevalue.value)));
      
         var rowCount=table2.rows.length;     
         for (var i = 1; i < rowCount; i++) {         
            table2.deleteRow(1);
         }  
         var rowCount=table3.rows.length;     
         for (var i = 1; i < rowCount; i++) {         
            table3.deleteRow(1);
         }  
         
         //replace array3 with array 2
         displayArray3=[...displayArray2];
         //replace array2 with array 1
         displayArray2=[...displayArray1];
         //start service
         table1name="["+table1name+"]"+ "  ->  "+"["+new Date().toLocaleString()+"]";
         table1_heading.innerHTML=table1name;
         if(displayArray3.length>0){
            var column3=document.getElementById("col3");
            column3.style.display="block";
            for(var i=0;i< displayArray3.length;i++){         
               insertRowTable(displayArray3[i],i,table3);
            }
            table3_heading.innerHTML=table2_heading.innerHTML;
         }
         if(displayArray2.length>0){
            var column2=document.getElementById("col2");
            column2.style.display="block";
            for(var i=0;i< displayArray2.length;i++){         
               insertRowTable(displayArray2[i],i,table2);
            }
            table2_heading.innerHTML=table1_heading.innerHTML;
         }
         
         
         
         
         table1name= new Date().toLocaleString();
         table1_heading.innerHTML=table1name;
             
           
      
   }, timeoutms);


 }
 document.getElementById("start_button").onclick = StartLive;
 document.getElementById("stop_button").onclick = ServiceStop;
//  document.getElementById("save_button").onclick = SavetoDB;


 function updateTable(recvArray){
  // console.log(recvArray);
   
   var index;
   for(index=0; index<displayArray1.length; index++){

      if(displayArray1[index][0] === recvArray[0]){
         if(displayArray1[index][1] != recvArray[1]){
            displayArray1=[];
            var rowCount=table1.rows.length;     
            for (var i = 1; i < rowCount; i++) {         
               table1.deleteRow(1);
            }
            break;
         }
         displayArray1.splice(index,1,recvArray);
         table1.deleteRow(index+1);
         insertRowTable(recvArray,index,table1);
         break;
      }
      else if(displayArray1[index][0] > recvArray[0]){
         displayArray1.splice(index,0,recvArray);
         insertRowTable(recvArray,index,table1);
         break;
      }
   }
   if(recvArray[0] ==1 && displayArray1[0] === undefined ){
      displayArray1.push(recvArray);
      insertRowTable(recvArray,0,table1);

   }
   else if(recvArray[0] > displayArray1[displayArray1.length-1][0]){
      displayArray1.push(recvArray);
      insertRowTable(recvArray,displayArray1.length-1,table1);
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