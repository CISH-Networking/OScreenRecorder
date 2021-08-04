/*
 *   Copyright (c) 2021 CRT_HAO 張皓鈞
 *   All rights reserved.
 *   CISH Robotics Team
 */
const start = document.getElementById("start");
const stop = document.getElementById("stop");
const video = document.querySelector("video");
const download = document.getElementById("download");
let recorder, stream;

async function startRecording() {
  stream = await navigator.mediaDevices.getDisplayMedia({
    video:{
      cursor: "always",
      mediaSource: "screen"
    }
  });
  recorder = new MediaRecorder(stream);

  const chunks = [];
  recorder.ondataavailable = e => chunks.push(e.data);
  recorder.onstop = e => {
    const completeBlob = new Blob(chunks, { type: chunks[0].type });
    const date = new Date();
    const nowDate = "ScreenRecord" + date.getFullYear().toString() + date.getMonth().toString() + date.getDay().toString() + "_" + date.getHours().toString() + date.getMinutes().toString() + date.getSeconds().toString();
    url = URL.createObjectURL(completeBlob);
    video.src = url;
    download.href = url;
    download.download = nowDate + ".webm";
  };

  recorder.start();
}

start.addEventListener("click", () => {
  start.setAttribute("disabled", true);
  stop.removeAttribute("disabled");

  startRecording();
});

stop.addEventListener("click", () => {
  stop.setAttribute("disabled", true);
  start.removeAttribute("disabled");

  recorder.stop();
  stream.getVideoTracks()[0].stop();
});
