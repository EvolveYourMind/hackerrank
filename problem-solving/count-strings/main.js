"use strict";
const EPSI = "epsilon"
const MODULO = 1000000007n;
const setToKey = set => ([...set.values()].map(v => parseInt(v, 10)).sort((a, b) => a - b).join(","));
const any = (v, condCb) => !v.every(u => !condCb(u));
const fst = (set) => { for(const v of set) { return v }; return null };
let rslt = "";
process.stdin.resume();
process.stdin.on("data", ch => rslt += ch.toString());
process.stdin.on("end", () => main(rslt.split("\n")));

function main(lines) {
    lines.shift();
    while(lines.length > 0) {
        const [reg, lenStr] = lines.shift().split(" ");
        console.log("" + solution(reg, parseInt(lenStr)));
    }
}

function solution(regex, len) {
    const dfa = regexToEpsiNFA(regex).toDfa().minimize();
    const states = [...Object.keys(dfa.transitions).concat([...dfa.final.values()])
        .reduce((a, v) => { a.add(v); return a; }, new Set()).values()];
    const statesIdxs = states.reduce((a, q, i) => { a[q] = i; return a; }, {});
    const matrix = Array.from({ length: states.length })
        .map((_, i) => Array.from({ length: states.length }).map((__, j) => {
            const qstart = states[i];
            const qdest = states[j];
            return qstart in dfa.transitions ? BigInt(Object.values(dfa.transitions[qstart]).filter(p => p === qdest).length) : 0n;
        }));
    const x = fastExponent(matrix, len);
    const sum = [...dfa.final.values()].reduce((a, v) => (a + x[statesIdxs[dfa.start]][statesIdxs[v]]) % MODULO, 0n);
    return sum;
}

function regexToEpsiNFA(masterRegex) {
    const epsiNfa = new EpsiNFA();
    function buildDfa(regex) {
        const lst = regex.lastIndexOf("(");
        let startState = epsiNfa.cstate;
        if(lst === -1) {
            let convergedFinalState = epsiNfa.uniqueState();
            let leftStart = epsiNfa.uniqueState();
            epsiNfa.link(EPSI, startState, leftStart);
            epsiNfa.cstate = leftStart;
            let op = null;
            let i = 0;
            while(op === null && i < regex.length) {
                if(regex[i] === "|" || regex[i] === "*") {
                    op = regex[i];
                } else {
                    if(regex[i + 1] !== "*") {
                        epsiNfa.link(regex[i]);
                    }
                }
                i++;
            }
            // for * and |
            epsiNfa.link(EPSI, epsiNfa.cstate, convergedFinalState);
            if(op === null) {
                // R
                // do nothing
            } else if(op === "|") {
                // R1|R2
                const rightStart = epsiNfa.uniqueState();
                epsiNfa.link(EPSI, startState, rightStart);
                epsiNfa.cstate = rightStart;
                buildDfa(regex.substr(i));
                epsiNfa.link(EPSI, epsiNfa.cstate, convergedFinalState);
                epsiNfa.cstate = convergedFinalState;
            } else {
                // R*
                const rptd = regex[regex.length - 2];
                epsiNfa.link(rptd, epsiNfa.cstate, epsiNfa.cstate);
            }
        } else if(lst === 0) {
            buildDfa(regex.substr(1, regex.length - 2));
        } else {
            let cnt = 0;
            let i = 1;
            do {
                if(regex[i] === "(") {
                    cnt++;
                } else if(regex[i] === ")") {
                    cnt--;
                }
                i++;
                if(i === regex.length - 1) {
                    console.log(regex);
                    throw "Invalid regexp";
                }
            } while(cnt > 0);
            const left = regex.substring(1, i);
            const op = regex[i];
            const right = op === "*" ? null : regex.substring(i + (op === "|" ? 1 : 0), regex.length - 1);
            if(op === "*") {
                // (R)*
                const childStartState = epsiNfa.uniqueState();
                const convergedState = epsiNfa.uniqueState();
                epsiNfa.link(EPSI, startState, convergedState);
                epsiNfa.link(EPSI, startState, childStartState);
                epsiNfa.cstate = childStartState;
                buildDfa(left);
                epsiNfa.link(EPSI, epsiNfa.cstate, convergedState);
                epsiNfa.link(EPSI, epsiNfa.cstate, childStartState);
                epsiNfa.cstate = convergedState;
            } else if(op === "|") {
                // (R1|R2)
                const convergedState = epsiNfa.uniqueState();
                const leftStart = epsiNfa.uniqueState();
                const rightStart = epsiNfa.uniqueState();
                epsiNfa.link(EPSI, startState, leftStart);
                epsiNfa.link(EPSI, startState, rightStart);
                epsiNfa.cstate = leftStart;
                buildDfa(left);
                epsiNfa.link(EPSI, epsiNfa.cstate, convergedState);
                epsiNfa.cstate = rightStart;
                buildDfa(right);
                epsiNfa.link(EPSI, epsiNfa.cstate, convergedState);
                epsiNfa.cstate = convergedState;
            } else {
                // (R1 R2)
                epsiNfa.cstate = startState;
                buildDfa(left);
                buildDfa(right);
            }
        }
    }
    buildDfa(masterRegex);
    epsiNfa.flagCurStateFinal();
    return epsiNfa;
}

class Dfa {
    constructor() {
        this.final = new Set();
        this.start = 0;
        this.cstate = 0;
        this.transitions = {};
        this.link = (ch, fromS, toS) => {
            if(!(fromS in this.transitions)) this.transitions[fromS] = {};
            this.transitions[fromS][ch] = toS;
        }
        this.test = (str) => {
            let s = this.start;
            let i = 0;
            while(i < str.length) {
                const ch = str[i];
                if(s in this.transitions && ch in this.transitions[s]) {
                    s = this.transitions[s][ch];
                } else {
                    return false;
                }
                i++;
            }
            return this.final.has(s);
        }
        this.clonePartition = (partition) => {
            const hm = new Map();
            const Pnew = {};
            Object.entries(partition).forEach(([state, set]) => {
                if(hm.has(set)) {
                    Pnew[state] = hm.get(set);
                } else {
                    Pnew[state] = new Set(set);
                    hm.set(set, Pnew[state]);
                }
            });
            return Pnew;
        }
        this.areIndistinguishable = (q, p, partitions) => {
            const qchars = q in this.transitions ? Object.keys(this.transitions[q]) : [];
            const pchars = p in this.transitions ? Object.keys(this.transitions[p]) : [];
            return pchars.length === qchars.length
                && pchars.every(ch =>
                    p in this.transitions
                    && ch in this.transitions[p]
                    && q in this.transitions
                    && ch in this.transitions[q]
                    && partitions[this.transitions[p][ch]] === partitions[this.transitions[q][ch]]);
        }
        this.findIndistinguishableSet = (q, np, partitions) => {
            for(const subset of Object.values(np).reduce((a, v) => { a.add(v); return a; }, new Set())) {
                if([...subset.values()].every(p => this.areIndistinguishable(q, p, partitions))) {
                    subset.add(q);
                    return subset;
                }
            }
            return new Set([q]);
        }
        this.subdivideIndistinguishable = (group, partitions) => {
            const np = {};
            for(const q of group) {
                np[q] = this.findIndistinguishableSet(q, np, partitions);
            }
            return np;
        }
        this.minimize = () => {
            const finalPartition = new Set(this.final.values());
            const startPartition = new Set(Object.keys(this.transitions).filter(q => !finalPartition.has(q)));
            let partitions = Object.keys(this.transitions)
                .map(v => [v, startPartition])
                .concat([...this.final.values()].map(v => [v, finalPartition]))
                .reduce((a, [k, v]) => { a[k] = v; return a; }, {});
            let Pnew = null;
            while(Pnew === null || !Object.entries(partitions).every(([q, set]) => q in Pnew && Pnew[q].size === set.size)) {
                partitions = Pnew === null ? partitions : Pnew;
                Pnew = this.clonePartition(partitions);
                const groups = Object.values(Pnew).reduce((a, set) => { a.add(set); return a; }, new Set());
                for(const group of groups) {
                    const undistinguishableSubset = this.subdivideIndistinguishable(group, partitions);
                    group.forEach(q => Pnew[q] = undistinguishableSubset[q]);
                }
            }
            const minDfa = new Dfa();
            minDfa.final = new Set();
            const uniqueSets = Object.values(partitions).reduce((a, v) => { a.add(v); return a; }, new Set());
            const pickedStates = [...uniqueSets.values()].map((subset) => fst(subset));
            const newNames = pickedStates.reduce((a, v, i) => { a[v] = "" + i; return a; }, {});
            minDfa.start = newNames[fst(partitions[this.start])];
            for(const s of pickedStates) {
                if(s in this.transitions) {
                    for(const [ch, resState] of Object.entries(this.transitions[s])) {
                        const t = fst(partitions[resState]);
                        minDfa.link(ch, newNames[s], newNames[t]);
                    }
                }
                if(finalPartition.has(s)) {
                    minDfa.final.add(newNames[s]);
                }
            }
            return minDfa;
        }
    }
}

class EpsiNFA {
    constructor() {
        this.final = null;
        this.start = "0";
        this.cstate = "0";
        this.stateCount = 0;
        this.epsiNeighbours = {};
        this.transitions = {};
        this.link = (ch, fromS = this.cstate, toS = this.uniqueState()) => {
            if(!(fromS in this.transitions)) this.transitions[fromS] = {};
            if(!(ch in this.transitions[fromS])) this.transitions[fromS][ch] = [];
            this.transitions[fromS][ch].push(toS);
            this.cstate = toS;
        }
        this.uniqueState = () => ++this.stateCount + "";

        this.flagCurStateFinal = () => {
            this.final = this.cstate;
        }
        // DFS with memory
        this.test = (str, i = 0, s = 0, epsiMemory = {}) => {
            if(s === this.final && i === str.length) {
                return true;
            }
            if(!(s in this.transitions)) {
                return false;
            }
            if(EPSI in this.transitions[s]) {
                const epsitransStates = this.transitions[s][EPSI];
                for(let epsitransState of epsitransStates) {
                    if(!(epsitransState in epsiMemory) && this.test(str, i, epsitransState, { ...epsiMemory, [s]: true })) {
                        return true;
                    }
                }
            }
            if(i !== str.length) {
                if(!(str[i] in this.transitions[s])) {
                    return false;
                }
                let nextStateS = this.transitions[s][str[i]];
                for(let nextState of nextStateS) {
                    if(this.test(str, i + 1, nextState, {})) {
                        return true;
                    }
                }
            }
            return false;
        }

        this.epsiClosure = (qs) => {
            const set = new Set();
            const queue = Array.isArray(qs) ? qs : [qs];
            while(queue.length > 0) {
                const q = queue.shift();
                if(!set.has(q)) {
                    set.add(q);
                    if(q in this.transitions && EPSI in this.transitions[q]) {
                        queue.push(...this.transitions[q][EPSI]);
                    }
                }
            }
            return set;
        }
        this.epsiClosuredStates = () => {
            return Object.keys(this.transitions).reduce((a, q) => { a[q] = this.epsiClosure(q); return a; }, {});
        }
        this.toDfa = () => {
            const dfa = new Dfa();
            const allStatesMap = Object.keys(this.transitions).reduce((a, q) => { a[q] = this.epsiClosure(q); return a; }, {});
            const final = new Set();
            const destinationSets = new Set();
            const queue = Object.values(allStatesMap);
            dfa.start = setToKey(allStatesMap[this.start]);
            while(queue.length > 0) {
                const statesSet = queue.shift();
                const statesSetKey = setToKey(statesSet);
                ["a", "b"].forEach(ch => {
                    const deltaSet = new Set();
                    statesSet.forEach(p => {
                        if(p in this.transitions && ch in this.transitions[p]) {
                            deltaSet.add(this.transitions[p][ch]);
                        }
                    });
                    if(deltaSet.size > 0) {
                        const closuredDeltaSet = this.epsiClosure([...deltaSet.values()]);
                        const closuredDeltaSetKey = setToKey(closuredDeltaSet);
                        if(!destinationSets.has(closuredDeltaSetKey)) {
                            queue.push(closuredDeltaSet);
                        }
                        destinationSets.add(closuredDeltaSetKey);
                        destinationSets.add(statesSetKey);
                        dfa.link(ch, statesSetKey, closuredDeltaSetKey);
                    }
                });
            }
            destinationSets.forEach((qs) => {
                const qSet = new Set(qs.split(","));
                if(any([...qSet.values()], v => v === this.final)) {
                    final.add(qs);
                }
            })
            dfa.final = final;
            return dfa;
        }
    }
}

function fastExponent(M, n) {
    return power_wrp(M, M, n);
}

function power_wrp(M, F, n) {
    if(n == 1) {
        return F;
    }
    const sb = power_wrp(M, F, Math.floor(n / 2));
    let su = mult(sb, sb);
    if(n % 2 != 0) {
        su = mult(su, M);
    }
    return su;
}

function mult(A, B) {
    const nMatrix = Array.from({ length: A.length }).map(() => Array.from({ length: A.length }).map(() => 0n));
    for(let i = 0; i < A.length; i++) {
        for(let j = 0; j < A.length; j++) {
            for(let k = 0; k < A.length; k++) {
                nMatrix[i][j] = (nMatrix[i][j] + A[i][k] * B[k][j]) % MODULO;
            }
        }
    }
    return nMatrix;
}

[
    "a*",
    "((ab)|(baa))",
    "((((ab)*)((ba)*))*)",
    "(a((b*)(a)))",
    "((ab)|(bb))",
    "((((((((((((((((ba)b)b)a)b)b)a)a)a)a)b)b)a)a)b)a)",
    "((a*)(b(a*)))",
    "((((a|a)*)(((((((b|(a|b))|b)|b)*)b)(a*))|(((a|(((b*)*)*))*)b)))*)",
    "(((((ab)|(ba))*)|(((aa)|(bb))*))*)",
    "((((ab)|a)*)|(((aa)|(bb))*))",
    "(((a)(((a)(b*))(((a)(b*))*)))*)",
    "((((b)((bb)*))|((a)(((a)(b*))(((a)(b*))*))))*)",
    "(((a*)(b))*)"
].forEach(regex => {
    const enfa = regexToEpsiNFA(regex);
    const dfa = enfa.toDfa();
    const minDfa = dfa.minimize();
    ["a", "aa", "aaa", "aaaa", "abab", "abbba", "baaab", "", "ababab", "baab", "bb", "b", "baaa", "babbabbaaaabbaaba"].forEach(str => {
        if(![
            enfa.test(str),
            dfa.test(str),
            minDfa.test(str)
        ].reduce((a, v, i, arr) => i === 0 || (a && (v === arr[i - 1])), true)) {
            console.log(regex, str);
            console.log("states",
                "enfa: " + Object.keys(enfa.transitions).length,
                "dfa: " + Object.keys(dfa.transitions).length,
                "minDfa: " + Object.keys(minDfa.transitions).length,
            );
            console.log("Mindfa: ", minDfa);
            console.log("Enfa test: ", enfa.test(str));
            console.log("Dfa test: ", dfa.test(str));
            console.log("MinDfa test: ", minDfa.test(str));
            throw "FAILED MATCH TEST";
        }
    })
});