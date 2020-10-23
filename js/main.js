function hasUserMedia(){
    navigator.getUserMedia = (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia)
    return !!navigator.getUserMedia;
}

function hasRTCPeerConnection(){
    window.RTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
    return !!window.RTCPeerConnection;
}


var yourVideo = document.querySelector('#yours'),
    theirVideo = document.querySelector('#theirs'),
    yourConnection, theirConnection;

if(hasUserMedia()){
    navigator.getUserMedia({
        video : true,
        audio : false
    }, function(stream){
        yourVideo.srcObject = stream;

        if(hasRTCPeerConnection()){
            startPeerConnection(stream);
        }else{
            alert("Sorry, your browser does not support WebRTC.");
        }
    }, function(err){
        alert("Sorry, we failed to capture your camera, please try again.")
    });
}else{
    alert("Sorry, your browser does not support WebRTC.");
}


function startPeerConnection(stream){
    var configuration = {
        "iceServers" : [{
            "url" : "stun:stun.1.google.com:19302"
        }]
    }
    yourConnection = new RTCPeerConnection(configuration);
    theirConnection = new RTCPeerConnection(configuration);
    
    // 더이상 지원 안함
    // yourConnection.addSrtream(stream);
    for(const track of stream.getTracks()){
        yourConnection.addTrack(track);
    }

    // 더이상 지원 안함
    // theirConnection.onaddstream = function(e){
    //     console.log(e)
    //     theirVideo.srcObject = e.stream;
    // }
    let inboundStream = null;
    theirConnection.ontrack = (ev) =>{
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


    yourConnection.onicecandidate = (event) =>{
        if(event.candidate){
            theirConnection.addIceCandidate(new RTCIceCandidate(event.candidate));
        }
    }

    theirConnection.onicecandidate = (event) =>{
        if(event.candidate){
            // console.log(event)
            yourConnection.addIceCandidate(new RTCIceCandidate(event.candidate));
        }
    }

    // addTrack 사용 후 onnegotiationneeded 이벤트 자동 실행
    yourConnection.onnegotiationneeded = function(t){
        yourConnection.createOffer().then(function(offer){
            yourConnection.setLocalDescription(offer);
            theirConnection.setRemoteDescription(offer);
            theirConnection.createAnswer().then(function(answer){
                theirConnection.setLocalDescription(answer);
                yourConnection.setRemoteDescription(answer);
            })
        })
    }
}