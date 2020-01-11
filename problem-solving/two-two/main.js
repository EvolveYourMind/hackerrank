class Dfa {
    constructor() {
        this.final = new Set();
        this.start = "q0";
        this.stateCount = 0;
        this.epsiNeighbours = {};
        this.transitions = {};
        this.link = (ch, fromS) => {
            if(!(fromS in this.transitions)) this.transitions[fromS] = {};
            if(!(ch in this.transitions[fromS])) this.transitions[fromS][ch] = this.uniqueState();
            return this.transitions[fromS][ch];
        };
        this.addFinal = f => this.final.add(f);
        this.uniqueState = () => "q" + (++this.stateCount);
    }
}

function prebuildDfa() {
    const dfa = new Dfa();
    let esp = 0n;
    while(esp <= 800n) {
        const s = (2n ** esp) + "";
        let state = dfa.start;
        for(let i = 0; i < s.length; i++) {
            state = dfa.link(s[i], state);
        }
        dfa.addFinal(state);
        esp++;
    }
    return dfa;
}

const dfa = prebuildDfa();
function test(arr) {
    let cnt = 0;
    for(let i = 0; i < arr.length; i++) {
        let state = dfa.start;
        for(let j = i; j < arr.length && state in dfa.transitions; j++) {
            state = dfa.transitions[state][arr[j]];
            if(dfa.final.has(state)) {
                cnt++;
            }
        }
    }
    return cnt;
}
let input = ""
process.stdin.on("data", v => input += v);
process.stdin.on("end", v => main(input.split("\n")));
function main(lines) {
    lines.shift();
    lines.map(line => test(line.split("")))
        .forEach(v => console.log(v));
}