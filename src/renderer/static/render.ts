/* eslint-disable @typescript-eslint/no-explicit-any */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const various_codecs = [
  "video/3gpp",
  "video/3gp2",
  "video/3gpp",
  "video/webm; codecs=vp8",
  "video/webm; codecs=vp9",
  "video/x-msvideo",
];

const api = (window as any).electronAPI;

class Renderer {
  private writeFile!: (
    file: string,
    data: string | Buffer,
    callback: (err: NodeJS.ErrnoException | null) => void
  ) => any;
  private BufferFrom!: (
    arrayBuffer: WithImplicitCoercion<ArrayBuffer | SharedArrayBuffer>,
    byteOffset?: number,
    length?: number
  ) => any;
  private recorderOptions!: any;
  private defaultCodec = "video/webm; codecs=vp8";
  private mediaRecord?: MediaRecorder;
  private mediaChunks: Blob[] = [];

  constructor() {}

  public async init(input_options: any) {
    this.recorderOptions = await input_options.getRecorderOptions();
    this.writeFile = input_options.writeFile;
    this.BufferFrom = input_options.BufferFrom;
    await this.selectMediaSource();
  }

  public startRecord() {
    if (this.mediaRecord && this.mediaRecord.state !== "recording") {
      this.mediaRecord.start();
    } else {
      api.onError(
        `Cannot start record due the media recorder is not inilized or already recording: ${this.mediaRecord?.state}`
      );
    }
  }

  public stopRecord() {
    if (this.mediaRecord && this.mediaRecord.state === "recording") {
      this.mediaRecord.stop();
    } else {
      api.onError(
        `Cannot stop record due the media recorder is not inilized or already stopped: ${this.mediaRecord?.state}`
      );
    }
  }

  private async selectMediaSource() {
    const err_template = "Couldn't select media source: ";

    const src = this.recorderOptions.targetWindowSource;

    if (!src) api.onError(`${err_template}Media Source was not specified!");`);

    try {
      const vidConstraints = {
        audio: false,
        video: {
          mandatory: {
            chromeMediaSource: "desktop",
            chromeMediaSourceId: src.id,
          },
        },
      };
      // const audioConstraints = { audio: false };
      const videoStream = await navigator.mediaDevices.getUserMedia(
        //@ts-ignore
        vidConstraints
      );
      // const audioStream = await navigator.mediaDevices.getUserMedia(
      //   audioConstraints
      // );

      const fullStream = new MediaStream([
        ...videoStream.getVideoTracks(),
        // ...audioStream.getAudioTracks(),
      ]);
      const opts = { mimeType: this.defaultCodec };

      this.mediaRecord = new MediaRecorder(fullStream, opts);
      this.mediaRecord.ondataavailable = this.onDataLoad.bind(this);
      this.mediaRecord.onstop = this.onStop.bind(this);
    } catch (err) {
      api.onError(`${err_template}${(err as Error).message}`);
    }
  }

  private onDataLoad(prm: { data: any }) {
    this.mediaChunks.push(prm.data);
  }

  private async onStop() {
    try {
      const blob = new Blob(this.mediaChunks, { type: this.defaultCodec });
      const bf = this.BufferFrom(await blob.arrayBuffer());
      const filePath = this.recorderOptions.filePath;
      this.writeFile(filePath, bf, (err) => {
        if (err) throw new Error(`ERROR in saving captured video: ${err}`);
        api.fileSaved();
      });
    } catch (err) {
      api.onError(
        `Something went wrong in stopping recorder: ${(err as Error).message}`
      );
    }
  }
}

const renderer = new Renderer();

async function run() {
  await renderer.init(api);
}

api.runHandle(run);
api.startRecordHandle(renderer.startRecord.bind(renderer));
api.stopRecordHandle(renderer.stopRecord.bind(renderer));
