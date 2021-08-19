/*
 *   Copyright (c) 2021 CRT_HAO 張皓鈞
 *   All rights reserved.
 *   CISH Networking Team
 */
var is_confirm = false;

var pages = ['#welcome', '#select-capture-mode', '#select-audio-mode', '#other-settings'];

function changePage(pageNumber) {
    pages.forEach(function (page) {
        if($(page).is(":visible")) {
            $(page).fadeOut(150, function () {
                $(pages[pageNumber]).fadeIn(150);
            });
        }
    });
}
var nowPage = 0;
$('.back').click(function () {
    if(nowPage > 0) {
        nowPage--;
        changePage(nowPage);
    }
});
$('.next').click(function () {
    if(nowPage < pages.length-1) {
        nowPage++;
        changePage(nowPage);
    }
});

const isPiPAvailable = () => {
    return document.pictureInPictureEnabled || !videoElement.disablePictureInPicture;
}

var captureMode = 0;
$('#capture-option > li').each(function (index) {
    if(!$(this).is('[disabled]')) {
        $(this).click(function () {
            $('#capture-option > li').each(function () {
                $(this).removeClass('select');
            });
            $(this).addClass('select');
            $('#select-capture-mode .next').removeAttr('disabled');
            captureMode = index;
        });
    }
});

var audio_mode = 0;
var audioIcon = ['fa-music', 'fa-volume-off', 'fa-microphone', 'fa-volume-up']
$('#audio-option > li').each(function (index) {
    if(!$(this).is('[disabled]')) {
        $(this).click(function () {
            $('#audio-option > li').each(function () {
                $(this).removeClass('select');
            });
            $(this).addClass('select');
            $('#select-audio-mode .next').removeAttr('disabled');
            audio_mode = index;
            audioIcon.forEach(function (icon) {
                $('#audio-icon').removeClass(icon);
            });
            $('#audio-icon').addClass(audioIcon[audio_mode+1]);
        });
    }
});

var audioElement = document.createElement('audio');

function prepare() {
    $('#prepare-tips').fadeIn();
    createRecorder();
}

function hideTips() {
    $('#prepare-tips').fadeOut('fast');
}

$('#prepare').click(function () {
    prepare();
});

function showRecorderUI() {
    $('#main-card').hide();
    $('#recorder-main-card').show();
    setTimeout(function() {
        showVideo();
      }, 800);
    is_confirm = true;
}

var show_video = false;
function showVideo() {
    $('#minimize-icon').addClass('fa-th-list')
    $('#minimize-icon').removeClass('fa-desktop')
    $('#recorder-video-container').slideDown();
    $('#videos-list-container').slideUp();
    show_video = true;
}

function hideVideo() {
    $('#minimize-icon').removeClass('fa-th-list')
    $('#minimize-icon').addClass('fa-desktop')
    $('#recorder-video-container').slideUp();
    if($('#videos-list-container > ul').html() != "") $('#videos-list-container').slideDown();
    show_video = false;
}

$('#minimize-recorder').click(function () {
    if(show_video) {
        hideVideo();
    }else{
        showVideo();
    }
});

function playSound(filename) {
    audioElement.setAttribute('src', filename);
    audioElement.play();
}

console.log("SupportPiP:" + isPiPAvailable());

var real_start_time = new Date();
var now_time = new Date();
var start_time = new Date();
var pause_time = new Date(0);
async function createRecorder() {
    enable_audio = audio_mode == 2 ? true : false;
    switch ($('#cursor-mode').val()) {
        case '1':
            cursor_mode = "motion";
            break;
        case '2':
            cursor_mode = "{exact: 'none'}";
            break;
        default:
            cursor_mode = "always";
    }
    console.log("Create Screen Capture");
    console.log("Enable Audio=" + enable_audio);
    console.log("Cursor Mode=" + cursor_mode);
    try {
        stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
            cursor: cursor_mode,
            frameRate: { ideal: 30, max: 60 }
        },
        audio: enable_audio
        });

        document.getElementById("recorder-video").srcObject = stream;

        recorder = new MediaRecorder(stream);

        recorder.onerror = function(event) {
            let error = event.error;

            switch(error.name) {
              case InvalidStateError:
                console.log("You can't record the video right " +
                                 "now. Try again later.");
                break;
              case SecurityError:
                console.log("Recording the specified source " +
                                 "is not allowed due to security " +
                                 "restrictions.");
                break;
              default:
                console.log("A problem occurred while trying " +
                                 "to record the video.");
                break;
            }
        };

        var completeBlob = null;
        var chunks = [];
        recorder.ondataavailable = e => {
            chunks.push(e.data);
        }
        recorder.onstart = e => {
            chunks = [];
            real_start_time = new Date();
            start_time = new Date();
            now_time = new Date();
            pause_time = new Date(0);
            $('#recorder-controls-stopped').hide();
            $('#recorder-controls-recording').show();
            $('#recorder-status-text').html('<i class="fas fa-circle"></i> 00:00');
            elapsedTimeUpdater = setInterval(function () {
                if(recorder.state == 'recording') {
                    icon = '<i class="fas fa-circle"></i>';
                    now_time = new Date();
                }else if(recorder.state == 'paused') {
                    icon = '<i class="fas fa-pause"></i>';
                }
                elapsed_time = (Number(now_time) - Number(start_time) + Number(pause_time));
                const time = Math.floor((elapsed_time / 1000) / 60).toString().padStart(2, '0')
                    + ":"
                    + Math.floor((elapsed_time / 1000) % 60).toString().padStart(2, '0');
                $('#recorder-status-text').html(icon + " " + time);
                $(document).attr("title", time + " - OScreenRecorder");
            }, 1000);
            playSound('sounds/start.mp3');
        }
        recorder.onpause = e => {
            now_time = new Date();
            pause_time = elapsed_time;
            start_time = new Date();
            $('#recorder-pause').html('<i class="fas fa-play"></i>');
            $('#recorder-pause').tooltip('hide')
            .attr('data-bs-original-title', '繼續')
            .tooltip('show');
            playSound('sounds/pause.mp3');
        }
        recorder.onresume = e => {
            start_time = new Date();
            $('#recorder-pause').html('<i class="fas fa-pause"></i>');
            $('#recorder-pause').tooltip('hide')
            .attr('data-bs-original-title', '暫停')
            .tooltip('show');
            playSound('sounds/unpause.mp3');
        }
        recorder.onstop = e => {
            /**
            const completeBlob = new Blob(chunks, { type: chunks[0].type });
            const date = new Date();
            const nowDate = "OScreenRecorder" + date.getFullYear().toString() + date.getMonth().toString() + date.getDay().toString() + "_" + date.getHours().toString() + date.getMinutes().toString() + date.getSeconds().toString();
            url = URL.createObjectURL(completeBlob);
            video.src = url;
            download.href = url;
            download.download = nowDate + ".webm";
            **/

            clearInterval(elapsedTimeUpdater);
            $(document).attr("title", "OScreenRecorder");
            pause_offest = 0;
            $('#recorder-status-text').html('');
            $('#recorder-controls-stopped').show();
            $('#recorder-controls-recording').hide();
            $('#recorder-pause').html('<i class="fas fa-pause"></i>');
            $('#recorder-pause').attr('data-bs-original-title', '暫停');

            const completeBlob = new Blob(chunks, { type: chunks[0].type });
            const filename = "OScreenRecorder" + real_start_time.getFullYear().toString() + real_start_time.getMonth().toString() + real_start_time.getDay().toString() + "_" + real_start_time.getHours().toString() + real_start_time.getMinutes().toString() + real_start_time.getSeconds().toString() + ".webm";
            url = convertVideoUrl(completeBlob);

            playSound('sounds/stop.mp3');

            addVideoToList(url, filename);
            hideVideo();
        };
        showRecorderUI();
    } catch (e) {
        console.log(e);
        if(e.name == "NotAllowedError") {
        }else{
            alert("發生未知錯誤，請重新整理後再試！\n(" + e + ")");
        }
    } finally {
        hideTips();
    }
}

function startRecorder() {
    recorder.start();
}

function stopRecorder() {
    recorder.stop();
}

function pause() {
    recorder.pause();
}

function resume() {
    recorder.resume();
}

$('#recorder-start').click(function () {
    startRecorder();
});

$('#recorder-stop').click(function () {
    stopRecorder();
});

$('#recorder-pause').click(function () {
    if(recorder.state == 'recording'){
        pause();
    }else if(recorder.state == 'paused') {
        resume();
    }
});

function convertVideoUrl(blob) {
    url = URL.createObjectURL(blob);
    return url
}

function addVideoToList(url, filename) {
    $('#videos-list').prepend('<li> <div class="videos-list-video-info"> <div> <video class="preview-video-small" height="100px" muted src="' + url + '" data-toggle="tooltip" data-placement="bottom" title="預覽"></video> </div> <div> <h6>' + filename + '</h6> </div> <div> <a class="btn" id="recorder-pause" href="' + url + '" download="' + filename + '" data-toggle="tooltip" data-placement="top" title="儲存"><i class="fas fa-save"></i></a> </div> </div> </li>');
    updateTooltip();
    updateVideosPreview();
}

$('#video-preview').click(function () {
    $(this).fadeOut('fast', function () {
        $('#video-preview-video').attr('src', '');
    });
});

function updateVideosPreview() {
    $('.preview-video-small').click(function () {
        $('#video-preview-video').attr('src', $(this).attr('src'));
        $('#video-preview').fadeIn('fast');
    });
}

$(window).bind('beforeunload', function (event) {
    if(is_confirm !== false) {
        var message = '尚未結束錄影，現在離開可能導致錄影丟失.';
        event.returnValue = message;
        return message;
    }
});

function updateTooltip() {
    $('[data-toggle="tooltip"]').tooltip();
}

$(document).ready(function() {
    $('#main').show();
    updateTooltip();
    updateVideosPreview();
});