function hasUserMedia(){
    return !!(navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia)
}
if(hasUserMedia()){
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

    var video = document.querySelector('video'),
        canvas = document.querySelector('canvas'),
        streaming = false;
    
    navigator.getUserMedia({
        video : true,
        audio : false
    }, function(stream){
        video.srcObject = stream;
        streaming = true;
    }, function(err){
        console.log("Raised an error when capturing:", err);
    });


    document.querySelector('#capture').addEventListener('click', function(event){
        if(streaming){
            canvas.width = video.clientWidth;
            canvas.height = video.clientHeight;
    
            var context = canvas.getContext('2d');
            context.drawImage(video, 0, 0);
    
            currentFilter++;
            if(currentFilter > filters.length - 1){
                currentFilter = 0;
            }
            canvas.className = filters[currentFilter]
        }
    })
}else{
    alert("Sorry, your browser does not support getUserMedia.");
}

var filters = ['', 'grayscale', 'sepia', 'invert'],
    currentFilter = 0;

