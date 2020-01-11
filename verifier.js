const fs = require("fs");
let str = "";
process.stdin.on("data", v => str += v);
process.stdin.on("end", () => main(str.split("\n")))
function main(lines) {
    const file = fs.readFileSync(process.argv[2]).toString().split("\n");
    lines.forEach((v, i) => {
        if((v+"").replace("n", "") !== file[i]) {
            console.log(i, v, file[i], v === file[i]);
        }
    });
}