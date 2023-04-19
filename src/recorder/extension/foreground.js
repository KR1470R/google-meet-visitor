function timeout(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

class ContentClient {
  constructor() {
    this.mediaRecorder = undefined;
    this.bg_alive_interval = undefined;
  }

  async chooseMediaStream(streamId) {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        mandatory: {
          chromeMediaSource: "screen",
          chromeMediaSourceId: streamId,
        },
      },
      audio: {
        mandatory: {
          chromeMediaSource: "desktop",
          chromeMediaSourceId: streamId,
        },
      },
    });

    const mediaStream = new MediaStream(stream);

    this.mediaRecorder = new MediaRecorder(mediaStream, {
      mimeType: "video/webm;codecs=vp8,vp9,opus",
    });
    this.mediaRecorder.ondataavailable = await this.onRecordChunk.bind(this);
    this.mediaRecorder.onstop = await this.onRecordStopped.bind(this);
    return Promise.resolve();
  }

  onRecordChunk(chunk) {
    const url = URL.createObjectURL(chunk.data);
    this.sendResponse("record_chunk", { data: { chunk_url: url } });
  }

  async onRecordStopped() {
    await timeout(2000);
    this.sendResponse("record_finished");
  }

  startRecord() {
    this.mediaRecorder.start();
  }

  stopRecord() {
    this.mediaRecorder.stop();
  }

  sendResponse(type, message) {
    chrome.runtime.sendMessage({
      message: Object.assign({ type }, message),
    });
  }

  handleBackgroundClient() {
    console.log("[handleBackgroundClient]");
    chrome.runtime.onMessage.addListener(async (request) => {
      try {
        switch (request.type) {
          case "record_start":
            await this.chooseMediaStream(request.data.stream_id);
            this.startRecord();
            break;
          case "record_stop":
            await this.stopRecord();
            break;
          default:
            throw new Error(
              "Received unkown request type from background client"
            );
        }
      } catch (err) {
        this.sendResponse("record_error", { error: String(err) });
      }
    });
  }

  keepAliveBackgroundClient() {
    this.bg_alive_interval = setInterval(() => {
      this.sendResponse("keep_alive");
    }, 5000);
  }
}

const CC = new ContentClient();
CC.handleBackgroundClient();
CC.keepAliveBackgroundClient();
setTimeout(() => {
  const socket_port = localStorage.getItem("recorder_port");
  if (socket_port)
    CC.sendResponse("record_register", {
      port: socket_port,
    });
}, 5000);
