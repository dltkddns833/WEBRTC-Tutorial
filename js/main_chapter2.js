if(/Android|webOS|iPhone|iPad|IPod|BlackBerry|IEModbile|OperaMini/i.test(navigator.userAgent)){
    constraints = {
        video : {
            mandatory : {
                minWidth : 480,
                minHeight : 320,
                maxWidth : 1024,
                maxHeight : 768
            }
        }
    }
}

navigator.mediaDevices.enumerateDevices().then(function(sources){
    var audioSource = null;
    var videoSource = null;
    for(var i = 0; i < sources.length; i++){
        var source = sources[i];
        if(source.kind === "audioinput"){
            console.log("microphone found: ", source.label, source.groupId);
            audioSource = source.id;
        }else if(source.kind == "videoinput"){
            console.log("Camera found : ", source.label, source.groupId);
            videoSource = source.id;
        }else{
            console.log("Unknown source found : ", source);
        }
    }

    
    var constraints = {
        video : {
            mandatory : {
                minWidth : 640,
                minHeight : 480
            },
            optional : [
                {sourceId : videoSource}
            ]
        },
        audio : {
            optional : [
                {sourceId : audioSource}
            ]
        }
    };

    if(hasUserMedia()){
        navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
        navigator.getUserMedia(constraints, function(stream){
            var video = document.querySelector('video');
            // video.src = window.URL.createObjectURL(stream);
            video.srcObject = stream;
        }, function(err){
            console.log("Raised an error when capturing:", err);
        });
    }else{
        alert("Sorry, your browser does not support getUserMedia.");
    }
});



function hasUserMedia(){
    return !!(navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia)
}



