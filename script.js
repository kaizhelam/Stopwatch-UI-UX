let stopwatch ;
let cpb ;
let label ;
let body ;
let btn ;
let lapsElm = [] ;
let laps ;
let lastLap = 0;

window.onload = () => {
    cpb = document.getElementById("cpb");
    label = document.querySelector(".label");
    laps = document.querySelector(".laps");
    body = document.querySelector("body");
    btn  = document.querySelector(".container");
    stopwatch = new Stopwatch(handleUpdate);
    body.dataset.state = "idle";
}

function toggle(){
    switch(stopwatch.state){
        case "idle" : 
            stopwatch.start(); 
            break;
        case "running" :
            stopwatch.stop();
            break;
        case "stop" :
            stopwatch.resume();
            break;
    }
    pressBtn();
    body.dataset.state = stopwatch.state ;
}

function pressBtn(){
    btn.dataset.state = "press";
    setTimeout(()=>{
        btn.dataset.state = "";
    },350)
}

function doReset(){
    stopwatch.reset();
    pressBtn();
    body.dataset.state = "idle";
    laps.innerHTML = "";
    lastLap = 0;
    lapsElm = [];
}

function doLap(){
    let time = stopwatch.lap();
    let delta = time - lastLap ;
    lastLap = time;
    let d = document.createElement("div")
    d.classList.add("lap");
    d.time  = time ;
    d.delta = delta ;
    d.innerHTML = `
    <div class="total">${format(parseTime(time))}</div>
    <div class="laptime">${format(parseTime(delta))}</div>
    `;
    lapsElm.push(d);
    laps.append(d)
    pressBtn();
    updateLaps();
}

function parseTime(time){
    let ms = time % 100 + "";
    let s = Math.floor(time/100)%60 +"";
    let m = Math.floor(time/6000)%60+"";
    return {ms,s,m};
}

function format({m,s,ms}) {
    return `${m.toString().padStart(2,"0")}:${s.toString().padStart(2,"0")}:${ms.toString().padStart(2,"0")}`;
}

function updateLaps(){
    lapsElm.sort((a,b)=>a.delta>b.delta?1:-1).forEach((e,i)=>{
        e.dataset.rank = 
        (i+1).toString().padStart(2,"0");
    })
}

class Stopwatch{
    constructor(cb){
        this.time = 0; //in ms
        this.intervalHandler;
        this.onUpdate = cb;
        this.state = "idle";
    }
    
    tick(){
        this.time += 1;
        this.onUpdate(this.time);
    }

    start(){
        this.intervalHandler = setInterval(
            this.tick.bind(this),
            10
        )
        this.state = "running";
    }
    
    lap(){ return this.time }
    
    stop(){
        clearInterval(this.intervalHandler)
        this.state = "stop";
    }

    reset(){
        this.stop();
        this.time = 0;
        this.onUpdate(this.time)
        this.state = "idle";
    }

    resume(){ this.start() }
}

function handleUpdate(time){
    let t = parseTime(time);
    label.innerText = format(t);
    cpb.setValue(t.s%60);
}
class Counter{
    constructor(target,initCount,duration){
        this.target = target ;
        this.curCount = initCount ;
        this.start ;
        this.end ;
        this.clock ;
        this.p;
        this.delay = duration / 10 ;
        this.target.innerText = initCount ;
    }
    
    setCount(count){
        this.end = count ;
        this.start = this.curCount ;
        this.p = 0;
        
        clearInterval(this.clock);
        
        this.clock = setInterval(
            ()=>{
                this.p += 0.1 ;
                this.curCount = Math.round(this.p * (this.end - this.start) + this.start);
                this.target.innerText = this.curCount ;
                
                if(this.p>=1){
                    clearInterval(this.clock);
                    this.target.innerText = this.end ;
                    this.curCount = this.end ;
                }
            },
            this.delay
        );
    }
}

class CircularProgressbar extends HTMLElement{

    constructor(){
        super();
        this.shadowDom = this.attachShadow({mode:"open"});
    }
    
    validateAttributes(){
        this.angle = parseInt(this.getAttribute("angle")) || 0;
        this.size  = parseInt(this.getAttribute("size"))  || 200;
        this.gap   = parseInt(this.getAttribute("gap"))   || 0;
        this.stroke = this.getAttribute("color") || "hsl(220,75%,70%)" ;
        this.strokeTrack = this.getAttribute("track-color") || "#eee" ;
        this.strokeWidth = parseInt(this.getAttribute("width")) || 4 ;
        this.min = parseInt(this.getAttribute("min")) || 0 ;
        this.max = parseInt(this.getAttribute("max")) || 100 ;
        this.value = parseInt(this.getAttribute("value")) || this.min ;
        this.angle += this.gap/2 + 90;
        while(this.angle < 0) 
            this.angle += 360 ;
        if(this.size < 100) 
            this.size = 100 ;
        this.gap %= 360 ;
        
        if(this.max < this.min){
            this.max = this.min ;
        }
        
        if(this.value < this.min || this.value > this.max){
            this.value = this.min ;
        }
    }
    
    connectedCallback(){
        this.validateAttributes();
    
        let wrapper = document.createElement("div");
        wrapper.setAttribute("class","wrapper") ;
        
        let svgNS = "http://www.w3.org/2000/svg";
        let svg = document.createElementNS(svgNS,"svg");
        
        svg.style.width  = (this.size + this.strokeWidth/2) + "px";
        svg.style.height = (this.size + this.strokeWidth/2) + "px";
        
        let rad = this.size * 0.5 - 8 ;
        this.radius = rad ;
        let meter = document.createElementNS(svgNS,"circle");
        meter.style.stroke = this.strokeTrack;
        meter.setAttribute("class","meter");
        meter.setAttribute("cx","50%");
        meter.setAttribute("cy","50%");
        meter.setAttribute("r",this.radius);
        
        let arc = document.createElementNS(svgNS,"circle");
        arc.setAttribute("class","arc");
        arc.style.stroke = this.stroke;
        arc.setAttribute("cx","50%");
        arc.setAttribute("cy","50%");
        arc.setAttribute("r",this.radius);
        this.arc = arc ;

        let display = document.createElement("div");
        display.classList.add("display");
        this.counter = new Counter(display,this.value,800);

        let arcFraction = (360-this.gap) / 360 ;
        this.arcLength = arcFraction*(2*Math.PI*this.radius)
        arc.style.strokeDasharray = meter.style.strokeDasharray = this.arcLength + "px , " + (2*Math.PI*this.radius) + "px" ;
        arc.style.strokeDashoffset = 0 ;
        
        svg.style.transform = `rotate(${this.angle}deg)`;

        let styleElement = document.createElement("style") ;
        styleElement.innerHTML = `
            .wrapper {
                position:relative;
                width  : ${this.offsetWidth  + "px"};
                height : ${this.offsetHeight + "px"};
                min-width  : ${2.5*this.radius}px ;
                min-height : ${2.5*this.radius}px ;
                display:flex;
                align-items:center;
                justify-content:center;
            }
            .arc,.meter {
                fill: none ;
                stroke-linecap : round ;
                stroke-width:${this.strokeWidth}px;
                transition: all 1000ms linear;
            }

            .arc {
                stroke-width : ${this.strokeWidth+1}px ;
            }
            .display {
                display:none;
                position:absolute;
                top:50%;
                left:50%;
                transform :translate(-50%,-50%);
                font-size:4rem;
                color:${this.stroke};
                font-weight:900;
            }
        `;
        svg.appendChild(meter);
        svg.appendChild(arc);
        wrapper.appendChild(svg);
        wrapper.appendChild(display);
        this.shadowDom.appendChild(styleElement);
        this.shadowDom.appendChild(wrapper);

        this.setValue(this.value);
    }

    setValue(value){
        value = Math.min(this.max,Math.max(this.min,value));
        let v = Math.abs((value - this.min) / (this.max - this.min));
        
        v = (v>1)?1:v;
        v = (v<0)?0:v;
        let val = (this.arcLength * (1-v)) ;
        this.arc.style.strokeDashoffset = val + "px";
    }
}
customElements.define(
    "circular-progressbar",
    CircularProgressbar
);
