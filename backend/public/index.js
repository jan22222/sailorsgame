const chatForm = document.getElementById('chat-form');
const chatMessages = document.querySelector('.chat-messages');

// Get username and room from URL
const { username, room, quantity, landscape } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

var users=[]

var socket = io("https://sailorsandislands.herokuapp.com/");

socket.on('init', handleInit);
socket.on('gameState', handleGameState);
socket.on('gameOver', handleGameOver);

socket.on('unknownCode', handleUnknownCode);
socket.on('tooManyPlayers', handleTooManyPlayers);
socket.on('leave',()=>{window.location = '../index.html';})

socket.on('roomUsers', ({ room, users }) => {  
  this.users = users; console.log("changed users, roomUsers",this.users)
  app.$data.userlisto = this.users; 
  
});

function paintGame(state) {
 // color korrektur
 app.$data.time = Math.floor(state.timeDif);
 app.$data.recPlayer = state.activePlayerNumber;
 app.$data.Wurf=state.Wurf
//  console.log(socket.id)
  const usernumber = Object.keys(state).find(key=>state[key].clientID==socket.id)
//  console.log(usernumber)
 app.$data.usernumber=usernumber
 app.$data.erz=state[usernumber][1]
 app.$data.weizen=state[usernumber][2]
 app.$data.lehm=state[usernumber][3]
  app.$data.schaf=state[usernumber][4]
  app.$data.holz=state[usernumber][5]
 app.$data.points=state[usernumber].points

  for (let index = 1; index < 241; index++) {
    
      if (state.net[index].value===1){
        var number = state.net[index].playerNumber
        var color = state[number].color
        
        hauszeichnen( color, index) 
      }
      if (state.net[index].value===2){
        var number = state.net[index].playerNumber
        var color = state[number].color 
        villazeichnen(color, index)
      }
    };
}

function handleInit(mapa) { 
  setupCanvas(mapa)
}

function handleGameState(gameState) {

  gameState = JSON.parse(gameState);
  requestAnimationFrame(() => paintGame(gameState));
}

function handleGameOver(data) {
  if (!gameActive) {
    return;
  }
  data = JSON.parse(data);

  gameActive = false;

  if (data.winner === playerNumber) {
    alert('You Win!');
  } else {
    alert('You Lose :(');
  }
}

function handleUnknownCode() {
  alert('Unknown Game Code')
  reject();
}

function handleTooManyPlayers() {
  alert('This game is already in progress');
  reject();
}

function reject(){
  window.location = '../index.html';
}
 
// ✅ Join/Create wird ab jetzt NUR noch in settlers.html gemacht.
// index.js macht nur noch Rendering / Gameplay.
console.log("[index.js] join/create handled in settlers.html - skip here");

//Responses must be positive to continue, otherwise reject.
 const SR = {}

 socket.on('stateInfo',
  (stateRoom)=>{

    SR = stateRoom;
  });

    // Get room and users
socket.on('roomUsers', ({ room, users }) => {
  outputRoomName(room);
  this.users = users; 
});

socket.on('back', (message)=>{console.log(message)} )
// Message from server
socket.on('message', (message) => {
  
  outputMessage(message);
  // Scroll down
  chatMessages.scrollTop = chatMessages.scrollHeight;
});

function houseBuild()
{
  socket.emit('house',findID(aktpunkt))
}
// Message submit
function chatten(e){
  // Get message text
  let msg = e.target.elements.msg.value;
  msg = msg.trim();
  if (!msg) {
    return false;
  }
  // Emit message to server
  socket.emit('chatMessage', msg);
  // Clear input
  e.target.elements.msg.value = '';
  e.target.elements.msg.focus();
};

// Output message to DOM
function outputMessage(message) {
  const div = document.createElement('div');
  div.classList.add('message');
  const p = document.createElement('p');
  p.classList.add('meta');
  p.innerText = message.username;
  p.innerHTML += `<span>${message.time}</span>`;
  div.appendChild(p);
  const para = document.createElement('p');
  para.classList.add('text');
  para.innerText = message.text;
  div.appendChild(para);
  document.querySelector('.chat-messages').appendChild(div);
}

// Add room name to DOM
function outputRoomName(room) {
  app.$data.room = room;
}

// Add users to DOM



