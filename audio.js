// Apple II DATA 11530–11560, decoded using the 6502 speaker-delay loop.
// https://gist.github.com/mreider/c7cf24ee3cccd509f76217154af2ae49
export const WEATHER_DATA = Object.freeze({
  sunny: [[96,16],[85,4],[128,4],[96,4],[76,4],[128,4],[96,16]],
  hot: [[114,120],[144,60],[114,255],[1,120],[128,120],[144,60],[128,120],[114,60],[144,120],[171,255],[228,255]],
  cloudy: [[152,180],[152,120],[152,60],[144,120],[152,60],[171,120],[192,60],[152,255]],
  storm: [[0,160],[128,255],[152,40],[171,80],[192,40],[228,255],[1,40],[0,160],[192,255],[192,40],[171,80],[152,40],[128,255]],
});
// Daily financial report: original POKE/CALL sequence at BASIC lines 1140–1148.
export const REPORT_DATA = Object.freeze([[152,80],[128,160],[152,40],[144,80],[128,200]]);
const CLOCK=1023000;
export function weatherNotes(type) {
  return (type==='report' ? REPORT_DATA : WEATHER_DATA[type] || WEATHER_DATA.sunny).map(([delay,length]) => ({
    frequency: delay===1 ? 0 : CLOCK/(2*(10*(delay || 256)+14)),
    // Sunny repeats short calls; other tracks use the high-byte note duration.
    duration: type==='sunny' ? length*.075 : length*256*10.08/CLOCK,
  }));
}
export function themeDuration(type) { return weatherNotes(type).reduce((sum,n)=>sum+n.duration,0)+.1; }
export class WeatherMusic {
  constructor() { this.enabled=true; this.context=null; this.voices=[]; this.playback=null; }
  async unlock() {
    let timeout;
    try { this.context ??= new (window.AudioContext || window.webkitAudioContext)(); await Promise.race([this.context.resume(),new Promise(resolve=>{timeout=setTimeout(resolve,1200);})]); } catch { /* Audio is optional; the timed report still runs. */ }
    finally {clearTimeout(timeout);}
  }
  stop(clearPlayback=true) {
    for (const voice of this.voices) { try { voice.oscillator.stop(); } catch {} voice.oscillator.disconnect(); voice.gain.disconnect(); }
    this.voices=[]; if(clearPlayback) this.playback=null;
  }
  setEnabled(enabled) {
    this.enabled=enabled;
    if(!enabled) this.stop(false);
    else if(this.playback && this.context) this.schedule(this.playback.type,Math.max(0,this.context.currentTime-this.playback.start));
  }
  play(type) {
    this.stop();
    if(this.context) this.playback={type,start:this.context.currentTime};
    if(this.enabled) this.schedule(type,0);
    return themeDuration(type);
  }
  schedule(type,offset) {
    this.stop(false);
    // Scheduling in a suspended context is safe: notes wait for resume, which
    // keeps a report opened in a hidden tab aligned with its paused reveal.
    if(!this.context || this.context.state==='closed') return;
    if(type==='storm'){this.scheduleStorm(offset);return;}
    let elapsed=0;
    for(const note of weatherNotes(type)) {
      const end=elapsed+note.duration;
      if(end>offset && note.frequency) {
        const start=this.context.currentTime+Math.max(0,elapsed-offset)+.02, duration=end-Math.max(elapsed,offset);
        if(duration < .012) { elapsed=end; continue; }
        const oscillator=this.context.createOscillator(),gain=this.context.createGain();
        // Single-voice square wave with softened edges; no added bass or harmony.
        oscillator.type='square'; oscillator.frequency.value=note.frequency;
        gain.gain.setValueAtTime(0,start); gain.gain.linearRampToValueAtTime(.045,start+.004);
        gain.gain.setValueAtTime(.045,start+duration-.008); gain.gain.linearRampToValueAtTime(0,start+duration);
        oscillator.connect(gain);gain.connect(this.context.destination);oscillator.start(start);oscillator.stop(start+duration+.01);
        const voice={oscillator,gain};this.voices.push(voice);
        oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();this.voices=this.voices.filter(v=>v!==voice);};
      }
      elapsed=end;
    }
  }
  scheduleStorm(offset) {
    // One continuous, softer voice preserves the original tune without resetting
    // oscillator phase and chopping the envelope at every short note.
    const notes=weatherNotes('storm'),total=notes.reduce((sum,n)=>sum+n.duration,0);
    if(total-offset<.03)return;
    const oscillator=this.context.createOscillator(),gain=this.context.createGain();
    const start=this.context.currentTime+.02,level=.085;
    oscillator.type='triangle';gain.gain.setValueAtTime(0,start);
    let elapsed=0,first=true,sounding=false;
    for(const note of notes){
      const end=elapsed+note.duration;
      if(end>offset){
        const at=start+Math.max(0,elapsed-offset),until=start+end-offset;
        if(note.frequency){
          if(first)oscillator.frequency.setValueAtTime(note.frequency,at);
          else oscillator.frequency.linearRampToValueAtTime(note.frequency,at+.008);
          // Hold pitch through each note, with a short transition at the next.
          oscillator.frequency.setValueAtTime(note.frequency,until);
          if(!sounding)gain.gain.linearRampToValueAtTime(level,at+Math.min(.012,(until-at)/2));
          sounding=true;
        }else{
          gain.gain.setValueAtTime(level,Math.max(start,at-.012));
          gain.gain.linearRampToValueAtTime(0,at);sounding=false;
        }
        first=false;
      }
      elapsed=end;
    }
    const end=start+total-offset;
    gain.gain.setValueAtTime(level,end-.025);gain.gain.linearRampToValueAtTime(0,end);
    oscillator.connect(gain);gain.connect(this.context.destination);oscillator.start(start);oscillator.stop(end+.01);
    const voice={oscillator,gain};this.voices.push(voice);
    oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();this.voices=this.voices.filter(v=>v!==voice);};
  }
  async pause() { try { await this.context?.suspend(); } catch {} }
  async resume() { try { await this.context?.resume(); } catch {} }
}
