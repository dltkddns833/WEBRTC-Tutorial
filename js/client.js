var name,
    connectedUser;

var connection = new WebSocket('ws://localhost:8888');

var loginPage = document.querySelector('#login-page'),
    usernameInput = document.querySelector('#username'),
    loginButton = document.querySelector('#login'),
    callPage = document.querySelector('#call-page'),
    theirUsernameInput = document.querySelector('#theirusername'),
    callButton = document.querySelector('#call'),
    hangUpButton = document.querySelector('#hang-up');

var yourVideo = document.querySelector('#yours'),
    theirVideo = document.querySelector('#theirs'),
    yourConnection, connectedUser, stream;

var dataChannel;
var received = document.querySelector('#received'),
    messageInput = document.querySelector('#message'),
    sendButton = document.querySelector('#send');

callPage.style.display = 'none';

// EventListener
loginButton.addEventListener('click', function(event){
    name = usernameInput.value;

    if(name.length > 0){
        send({
            type: "login",
            name: name
        })
    }
});

callButton.addEventListener('click', function(){
    var theirusername = theirUsernameInput.value;

    if(theirusername.length > 0){
        startPeerConnection(theirusername);
    }
});

hangUpButton.addEventListener('click', function(){
    send({
        type:'leave'
    });

    onLeave();
})



// connection
connection.onopen = function(){
    console.log('Connected');
}

connection.onmessage = function(message){
    console.log('Got message', message.data);

    var data = JSON.parse(message.data);

    switch(data.type){
        case 'login':
            onLogin(data.success);
            break;
        case 'offer':
            onOffer(data.offer, data.name);
            break;
        case 'answer':
            onAnswer(data.answer);
            break;
        case 'candidate':
            onCandidate(data.candidate);
            break;
        case 'leave':
            onLeave();
            break;
        default:
            break;
    }
};

connection.onerror = function(err){
    console.log('Got error', err);
};


// function
function send(message){
    if(connectedUser){
        message.name = connectedUser;
    }

    connection.send(JSON.stringify(message));
}

function onLogin(success){
    if(success == false){
        alert('Login unsuccessful, please try a different name.');
    }else{
        loginPage.style.display = 'none';
        callPage.style.display = 'block';
        startConnection();
    }
}

function onOffer(offer, name){
    connectedUser = name;

    yourConnection.setRemoteDescription(new RTCSessionDescription(offer));

    yourConnection.createAnswer(function(answer){
        yourConnection.setLocalDescription(answer);
        send({
            type:'answer',
            answer:answer
        });
    }, function(error){
        alert('An error has occurred');
    });
};

function onAnswer(answer){
    yourConnection.setRemoteDescription(new RTCSessionDescription(answer));
}

function onCandidate(candidate){
    yourConnection.addIceCandidate(new RTCIceCandidate(candidate));
}

function onLeave(){
    connectedUser = null;
    theirVideo.srcObject = null;
    yourConnection.close();
    yourConnection.onicecandidate = null;
    setupPeerConnection(stream);
}

function startConnection(){
    if(hasUserMedia()){
        navigator.getUserMedia({
            video:true,
            audio:false
        }, function(myStream){
            stream = myStream;
            yourVideo.srcObject = stream;

            if(hasRTCPeerConnection()){
                setupPeerConnection(stream);
            }else{
                alert('Sorry, your browser does not support WebRTC.');
            }
        }, function(err){
            console.log(err);
        })
    }else{
        alert('Sorry, your browser does not support WebRTC.');
    }
}

function setupPeerConnection(stream){
    var configuration = {
        'iceServers': [{
            'url' : 'stun:stun.1.google.com:19302'
        }]
    };

    var optionalRtpDataChannels = {
        optional: [{RtpDataChannels: true}]
    }

    yourConnection = new RTCPeerConnection(configuration, optionalRtpDataChannels);

    // yourConnection.addStream(stream);
    for(const track of stream.getTracks()){
        yourConnection.addTrack(track);
    }

    // yourConnection.onaddstream = function(e){
    //     theirVideo.src = window.URL.createObjectURL(e.stream);
    // }
    let inboundStream = null;
    yourConnection.ontrack = (ev) =>{
        if (ev.streams && ev.streams[0]) {
            theirVideo.srcObject = ev.streams[0];
        } else {
        if (!inboundStream) {
            inboundStream = new MediaStream();
            theirVideo.srcObject = inboundStream;
        }
        inboundStream.addTrack(ev.track);
        }
    }

    yourConnection.onicecandidate = function(event){
        if(event.candidate){
            send({
                type: 'candidate',
                candidate: event.candidate
            });
        }
    }

    openDataChannel();

}

function startPeerConnection(user){
    connectedUser = user;

    yourConnection.createOffer(function(offer){
        send({
            type:'offer',
            offer: offer
        });
        yourConnection.setLocalDescription(offer);
    }, function(error){
        alert('An Error hs occurred.');
    })
}

function hasUserMedia(){
    navigator.getUserMedia = (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia)
    return !!navigator.getUserMedia;
}

function hasRTCPeerConnection(){
    window.RTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
    window.RTCSessionDescription = window.RTCSessionDescription || window.webkitRTCSessionDescription || window.mozRTCSessionDescription;
    window.RTCIceCandidate = window.RTCIceCandidate || window.webkitRTCIceCandidate || window.mozRTCIceCandidate;
    return !!window.RTCPeerConnection;
}

function openDataChannel(){
    var dataChannelOptions = {
        reliable: false
    }
    dataChannel = yourConnection.createDataChannel('myLabel', dataChannelOptions);

   
    
    // dataChannel
    dataChannel.onerror = function(error){
        console.log('Data channel error : ', error);
    }
    
    dataChannel.onmessage = function(event){
       console.log('Got Data Channel Message:', event.data);

        received.innerHTML += "recv: " + event.data + "<br/>";
        received.scrollTop=received.scrollHeight;
    }
    
    dataChannel.onopen = function(){
        dataChannel.send(name + ' has connected.');
    }
    
    dataChannel.onclose = function(){
        console.log('Data channel has been closed.');
    }

    sendButton.addEventListener('click', function(event){
        var val = messageInput.value;
        received.innerHTML += "send: " + val + '<br/>';
        received.scrollTop = received.scrollHeight;
        dataChannel.send(val);
    })
}