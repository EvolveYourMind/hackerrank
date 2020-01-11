"use strict";
let rslt = "";
process.stdin.resume();
process.stdin.on("data", ch => rslt += ch.toString());
process.stdin.on("end", () => main(rslt));

function main(input) {
    const inputLines = input.split("\n");
    inputLines.shift();
    while(inputLines.length > 0) {
        const jack = inputLines.shift();
        const dani = inputLines.shift();
        let j = 0;
        let d = 0;
        let ph = 0;
        let pj = null;
        let pd = null;
        let last = null;
        let res = "";
        while(j < jack.length && d < dani.length) {
            let h = ph;
            if(pj !== jack[j] || pd !== dani[d]) {
                h = 0;
                while(h + j < jack.length
                    && h + d < dani.length
                    && jack[h + j] === dani[h + d]
                ) {
                    h++;
                }
                ph = h;
                pj = jack[j];
                pd = dani[d];
                if(h + d === dani.length || jack[h + j] < dani[h + d]) {
                    res += jack[j];
                    j++;
                    last = 0;
                } else {
                    res += dani[d];
                    d++;
                    last = 1;
                }
            } else {
                if(last === 0) {
                    res += jack[j];
                    j++;
                } else {
                    res += dani[d];
                    d++;
                }
            }
        }
        res += j < jack.length ? jack.substr(j) : "";
        res += d < dani.length ? dani.substr(d) : "";
        console.log(res);
    }
}