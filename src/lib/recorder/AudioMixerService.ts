/* src/lib/recorder/AudioMixerService.ts */

export interface AudioMixerOptions {
  tabStream?: MediaStream | null;
  micStream?: MediaStream | null;
  tabVolume?: number; // 0 to 2 (1 = 100%)
  micVolume?: number; // 0 to 2 (1 = 100%)
  enableFanFilter?: boolean; // High-pass 110Hz filter for fan noise
}

export class AudioMixerService {
  private audioContext: AudioContext | null = null;
  private destination: MediaStreamAudioDestinationNode | null = null;
  
  private tabSource: MediaStreamAudioSourceNode | null = null;
  private tabGain: GainNode | null = null;
  
  private micSource: MediaStreamAudioSourceNode | null = null;
  private micGain: GainNode | null = null;
  private micHighPassFilter: BiquadFilterNode | null = null;
  private micCompressor: DynamicsCompressorNode | null = null;
  
  // Analysers for UI audio level meters
  public tabAnalyser: AnalyserNode | null = null;
  public micAnalyser: AnalyserNode | null = null;

  constructor() {
    // AudioContext will be initialized on user interaction / start
  }

  public init(options: AudioMixerOptions): MediaStreamTrack | null {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return null;

    this.audioContext = new AudioContextClass();
    this.destination = this.audioContext.createMediaStreamDestination();

    const {
      tabStream,
      micStream,
      tabVolume = 1.0,
      micVolume = 1.0,
      enableFanFilter = true,
    } = options;

    // 1. Process Tab Audio (Phim + Tra từ)
    if (tabStream && tabStream.getAudioTracks().length > 0) {
      try {
        this.tabSource = this.audioContext.createMediaStreamSource(tabStream);
        this.tabGain = this.audioContext.createGain();
        this.tabGain.gain.setValueAtTime(tabVolume, this.audioContext.currentTime);

        this.tabAnalyser = this.audioContext.createAnalyser();
        this.tabAnalyser.fftSize = 64;

        this.tabSource.connect(this.tabGain);
        this.tabGain.connect(this.tabAnalyser);
        this.tabGain.connect(this.destination);
      } catch (err) {
        console.warn("[AudioMixer] Failed to attach tab audio:", err);
      }
    }

    // 2. Process Mic Audio with 3-layer anti-fan noise filter
    if (micStream && micStream.getAudioTracks().length > 0) {
      try {
        this.micSource = this.audioContext.createMediaStreamSource(micStream);
        this.micGain = this.audioContext.createGain();
        this.micGain.gain.setValueAtTime(micVolume, this.audioContext.currentTime);

        this.micAnalyser = this.audioContext.createAnalyser();
        this.micAnalyser.fftSize = 64;

        let lastNode: AudioNode = this.micSource;

        // Lớp 2: High-pass Filter 110Hz để cắt đứt tiếng ù cơ học quạt iMac
        if (enableFanFilter) {
          this.micHighPassFilter = this.audioContext.createBiquadFilter();
          this.micHighPassFilter.type = "highpass";
          this.micHighPassFilter.frequency.setValueAtTime(110, this.audioContext.currentTime);
          this.micHighPassFilter.Q.setValueAtTime(0.7, this.audioContext.currentTime);
          
          lastNode.connect(this.micHighPassFilter);
          lastNode = this.micHighPassFilter;
        }

        // Lớp 3: Dynamics Compressor giúp giọng nói dày, ấm và triệt tiêu tạp âm nền
        this.micCompressor = this.audioContext.createDynamicsCompressor();
        this.micCompressor.threshold.setValueAtTime(-35, this.audioContext.currentTime);
        this.micCompressor.knee.setValueAtTime(25, this.audioContext.currentTime);
        this.micCompressor.ratio.setValueAtTime(6, this.audioContext.currentTime);
        this.micCompressor.attack.setValueAtTime(0.003, this.audioContext.currentTime);
        this.micCompressor.release.setValueAtTime(0.25, this.audioContext.currentTime);

        lastNode.connect(this.micCompressor);
        lastNode = this.micCompressor;

        lastNode.connect(this.micGain);
        this.micGain.connect(this.micAnalyser);
        this.micGain.connect(this.destination);
      } catch (err) {
        console.warn("[AudioMixer] Failed to attach mic audio:", err);
      }
    }

    const mixedTracks = this.destination.stream.getAudioTracks();
    return mixedTracks.length > 0 ? mixedTracks[0] : null;
  }

  public setTabVolume(volume: number) {
    if (this.tabGain && this.audioContext) {
      this.tabGain.gain.setValueAtTime(Math.max(0, volume), this.audioContext.currentTime);
    }
  }

  public setMicVolume(volume: number) {
    if (this.micGain && this.audioContext) {
      this.micGain.gain.setValueAtTime(Math.max(0, volume), this.audioContext.currentTime);
    }
  }

  private levelBuffer: any = null;

  public getAudioLevel(analyser: AnalyserNode | null): number {
    if (!analyser) return 0;
    const binCount = analyser.frequencyBinCount;
    if (!this.levelBuffer || this.levelBuffer.length !== binCount) {
      this.levelBuffer = new Uint8Array(binCount);
    }
    analyser.getByteFrequencyData(this.levelBuffer);
    let sum = 0;
    for (let i = 0; i < binCount; i++) {
      sum += this.levelBuffer[i];
    }
    const avg = sum / binCount;
    return Math.min(100, Math.round((avg / 255) * 100));
  }

  public cleanup() {
    if (this.audioContext && this.audioContext.state !== "closed") {
      this.audioContext.close().catch(() => {});
    }
    this.audioContext = null;
    this.destination = null;
    this.tabSource = null;
    this.micSource = null;
    this.tabGain = null;
    this.micGain = null;
    this.micHighPassFilter = null;
    this.micCompressor = null;
    this.tabAnalyser = null;
    this.micAnalyser = null;
  }
}
