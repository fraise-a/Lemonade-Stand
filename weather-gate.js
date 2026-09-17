// Counts foreground viewing time, independent of mute and unavailable audio.
export class WeatherGate {
  constructor(duration, now=performance.now()) { this.remaining=duration; this.last=now; this.paused=false; }
  update(now=performance.now()) { if (!this.paused) this.remaining=Math.max(0,this.remaining-Math.max(0,now-this.last)); this.last=now; return this.remaining; }
  pause(now=performance.now()) { this.update(now); this.paused=true; }
  resume(now=performance.now()) { this.last=now; this.paused=false; }
  ready(now=performance.now()) { return this.update(now)===0; }
}
