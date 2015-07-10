//the canvas
var canvas = [];

//set up the server with express
//configura servidor com express
var express = require('express'); 
var app = express();
var http = require('http').Server(app);
//set up socket.io for socket connection with client (integrates with Node.js HTTP server)
//this automatically client loads a library on the browser side: socket.io-client
//configura socket.io para conexão de socket com o cliente (se integra com o server HTTP do Node.js)
//isso automaticamente carrega uma biblioteca no browser: socket.io-client
var io = require('socket.io')(http);

//Serve static file
app.use(express.static(__dirname + '/public'));

//GET function
//Funcao de GET
app.get('/', function(req, res){
	//sends index.html to browser
	//envia index.html pro browser
	res.sendFile(__dirname + '/index.html');
});

//Socket.io is based on events. This event happens when a client connects to the port we're listening to
//Socket.io eh baseado em eventos. Esse acontece quando um cliente se conecta n aporta na qual estamos escutando
io.on('connection', function(socket){
  console.log('a user connected');

  //events for the newly connected client (socket)  -----
  //eventos para o cliente recem-conectado (socket) -----
  socket.on('disconnect', function(){
    console.log('user disconnected');});

  socket.on('chat message', function(msg){
    console.log('message: ' + msg);
    io.emit('chat message', msg);
  });

  socket.on('stroke', function(stk){
    canvas.push(stk);
    io.emit('doStroke',stk);
  });

  socket.on('draw', function(draw){
    canvas.push(draw);
    io.emit('draw', draw);
  });
  //                                                -----

});

http.listen(3000, function(){
  console.log('listening on *:3000');
});