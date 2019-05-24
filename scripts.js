    
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
               if(recvArray.length===8){
                  recvArray[0]= parseInt(recvArray[0]);
                  updateTable(recvArray);
               }
            }       
            break;
         case "LOAD_HISTORY":
            status = "STOPPED";
            // console.log("TYPE OF LOAD DATA:", typeof(injsonobj.value));
            displayArray2 = JSON.parse(injsonobj.value);
            var rowCount=table[1].rows.length;
            // console.log('currentTable.length :', rowCount);
            for (var i = 1; i < rowCount; i++) {
               // console.log('delete row :', i);
               table[1].deleteRow(1);
            }  
            for(var i=0;i< displayArray2.length;i++){
               // console.log("LOAD DATA:", compareArray[i]);
               insertRowTable(displayArray2[i],i,table[1]);
            }
         break;
         case "LOAD_DATA":
            status = "STOPPED";
            // console.log("TYPE OF LOAD DATA:", typeof(injsonobj.value));
            
            displayArray[injsonobj.table] = JSON.parse(injsonobj.value);
            var rowCount=table[injsonobj.table].rows.length;
            // console.log('currentTable.length :', rowCount);
            for (var i = 1; i < rowCount; i++) {
               // console.log('delete row :', i);
               table[injsonobj.table].deleteRow(1);
            }  
            for(var i=0;i< displayArray[injsonobj.table].length;i++){
               // console.log("LOAD DATA:", compareArray[i]);
               insertRowTable(displayArray[injsonobj.table][i],i,table[injsonobj.table]);
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
   
      displayArray[0] =[];
      var rowCount=table[0].rows.length;
     
      for (var i = 1; i < rowCount; i++) {
         
         table[0].deleteRow(1);
      }  
      
       url = document.getElementById("input").value;
      
      if(url === ''){
         console.log('Please enter URL');
         alert("Please enter URL"); 
      }   
      else {
         var jsonobj={"command":"LOAD_HISTORY","url":String(url),"username":"TEST2"}            
         socket.emit("message",jsonobj);
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

//  function StartLive(){
//       //start service
//       var timevalue=document.getElementById("timeInput");
//       var timediv=document.getElementById("inputGroupSelect01");
//       var timeoutms=parseInt(timevalue.value)*1000; 
     

//       switch(timediv.value){
//          case "Minutes":
//             timeoutms=timeoutms*60;
//          break;
//          case "Seconds":
            
//          break;
//          case "Hours":
//             timeoutms=timeoutms*60*60;
//          break;

//       }
      
//       ServiceStart();
//       var all = document.getElementsByClassName('input-group');
//       for (var i = 0; i < all.length; i++) {
//          all[i].style.marginTop = 0 ;
//       }
//       var column3=document.getElementById("col1");
//       column3.style.display="block";
//       table1name= new Date().toLocaleString();
//       table1_heading.innerHTML=table1name;
//       timeout=setInterval(function(){
//          console.log("value: ",typeof(parseInt(timevalue.value)));
      
//          var rowCount=table2.rows.length;     
//          for (var i = 1; i < rowCount; i++) {         
//             table2.deleteRow(1);
//          }  
//          var rowCount=table3.rows.length;     
//          for (var i = 1; i < rowCount; i++) {         
//             table3.deleteRow(1);
//          }  
         
//          //replace array3 with array 2
//          displayArray3=[...displayArray2];
//          //replace array2 with array 1
//          displayArray2=[...displayArray1];
//          //start service
//          table1name="["+table1name+"]"+ "  ->  "+"["+new Date().toLocaleString()+"]";
//          table1_heading.innerHTML=table1name;
//          if(displayArray3.length>0){
//             var column3=document.getElementById("col3");
//             column3.style.display="block";
//             for(var i=0;i< displayArray3.length;i++){         
//                insertRowTable(displayArray3[i],i,table3);
//             }
//             table3_heading.innerHTML=table2_heading.innerHTML;
//          }
//          if(displayArray2.length>0){
//             var column2=document.getElementById("col2");
//             column2.style.display="block";
//             for(var i=0;i< displayArray2.length;i++){         
//                insertRowTable(displayArray2[i],i,table2);
//             }
//             table2_heading.innerHTML=table1_heading.innerHTML;
//          }
         
         
         
         
//          table1name= new Date().toLocaleString();
//          table1_heading.innerHTML=table1name;
             
           
      
//    }, timeoutms);


//  }
 document.getElementById("start_button").onclick = ServiceStart;
 document.getElementById("stop_button").onclick = ServiceStop;
//  document.getElementById("getdate").onchange = function(){
//     console.log("ON CHANGE");
//    var jsonobj={"command":"LOAD_HISTORY","url":String(url),"username":"TEST2"}            
//    socket.emit("message",jsonobj);
//  };
//  document.getElementById("save_button").onclick = SavetoDB;


 function updateTable(recvArray){
  // console.log(recvArray);
   
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
            
            var jsonobj={"command":"LOAD_DATA","url":String(document.getElementById("input").value),"username":"TEST3","date":localdate,table:2};  
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
            
            var jsonobj={"command":"LOAD_DATA","url":String(document.getElementById("input").value),"username":"TEST3","date":localdate,table:1};  
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
            
            var jsonobj={"command":"LOAD_DATA","url":String(document.getElementById("input").value),"username":"TEST3","date":localdate,table:0};  
            socket.emit("message",jsonobj);
         }
         }
)
// Access instance of plugin
$('#getdate1').data('datepicker')
