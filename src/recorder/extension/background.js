function debounce(callback, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => callback.apply(this, args), ms);
  };
}

function timeoutWhileCondition(condition, ms) {
  return new Promise((resolve, reject) => {
    let counter = 0;
    const delay = 1000;
    const interval = setInterval(() => {
      counter += delay;
      if (condition()) {
        resolve();
        clearInterval(interval);
      } else {
        if (counter > ms) {
          reject("timeout!");
          clearInterval(interval);
        }
      }
    }, delay);
  });
}

class BackgroundClient {
  constructor() {
    this.server_params = {
      wsc: undefined, // WebSocket Client
      port: undefined, // number
      connected: false, // boolean
      target_tab: undefined, // Chrome Tab
      stream_id: undefined, // number
      window_title: undefined, // string
    };
  }

  connectSocket() {
    try {
      console.warn(
        `trying to connect to websocket on port: ${this.server_params.port}`
      );
      this.server_params.wsc = new WebSocket(
        `ws://localhost:${this.server_params.port}`
      );
      this.server_params.wsc.onmessage = async (e) => {
        const request_type = e.data;
        switch (request_type) {
          case "record_choose_stream":
            this.server_params.stream_id = await this.getStreamId();
            this.sendResponse("record_stream_choosed");
            break;
          case "record_start":
            this.startRecord();
            break;
          case "record_stop":
            this.stopRecord();
            break;
          default:
            this.sendResponse("record_error", {
              error: `Received unkown request type from server: ${request_type}`,
            });
            break;
        }
      };
      this.server_params.wsc.onopen = () => {
        console.log(`connected successful on port ${this.server_params.port}`);
        this.server_params.connected = true;
      };
      this.server_params.wsc.onclose = () => {
        console.log("connection closed!");
        this.server_params.connected = false;
      };
    } catch (err) {
      console.err(`Error in try to connect to websocket:${err.message}`);
      this.server_params.connected = false;
    }
  }

  sendResponse(type, message) {
    this.server_params.wsc.send(JSON.stringify({ type: type, data: message }));
  }

  getStreamId() {
    return new Promise((resolve) => {
      if (!this.server_params.target_tab)
        this.sendResponse("record_error", {
          error: "Target tab is not defined!",
        });
      else {
        chrome.desktopCapture.chooseDesktopMedia(
          ["tab", "audio"],
          this.server_params?.target_tab,
          (streamId) => {
            if (streamId) resolve(streamId);
            else
              this.sendResponse("record_error", {
                error: "Choosing media was declined by user.",
              });
          }
        );
      }
    });
  }

  async registerContentClient(request, sender) {
    this.server_params.port = request.port;
    this.server_params.target_tab = sender.tab;
    debounce(() => this.connectSocket(), 5000)();
    await timeoutWhileCondition(() => this.server_params.connected, 10000);
    this.sendResponse("record_ready");
  }

  downloadChunk(chunk_url) {
    return new Promise((resolve, reject) => {
      fetch(chunk_url)
        .then((res) => res.blob())
        .then(resolve, reject);
    });
  }

  handleContentClient() {
    // for testing
    // chrome.server_params = this.server_params;

    chrome.tabs.onRemoved.addListener(() => {
      this.server_params?.wsc?.close();
    });

    chrome.runtime.onMessage.addListener(async (request, sender) => {
      try {
        request = request.message;
        switch (request.type) {
          case "record_register":
            if (this.server_params.target_tab) return;
            this.registerContentClient(request, sender);
            break;
          case "record_chunk":
            const chunk = await this.downloadChunk(request.data.chunk_url);
            this.server_params.wsc.send(chunk);
            break;
          case "record_finished":
            this.sendResponse("record_finished");
            break;
          case "record_error":
            throw new Error(request.error);
          case "keep_alive":
            break;
          default:
            throw new Error(
              `Received unkown request type from content client: ${request.type}`
            );
        }
      } catch (err) {
        if (this.server_params.wsc) {
          this.sendResponse("record_error", { error: String(err) });
        } else throw err;
      }
    });
  }

  startRecord() {
    chrome.tabs.sendMessage(this.server_params.target_tab.id, {
      type: "record_start",
      data: {
        stream_id: this.server_params.stream_id,
      },
    });
  }

  stopRecord() {
    chrome.tabs.sendMessage(this.server_params.target_tab.id, {
      type: "record_stop",
    });
  }
}

const BC = new BackgroundClient();
BC.handleContentClient();
