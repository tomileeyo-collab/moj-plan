// Kopira web fajlove u www/ (za Android aplikaciju) i upisuje broj verzije.
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");
const out = path.join(root, "www");
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out);
for (const f of ["index.html", "manifest.webmanifest", "css", "js", "img", "icons"]) {
  fs.cpSync(path.join(root, f), path.join(out, f), { recursive: true });
}
const build = parseInt(process.env.APP_BUILD || "0", 10);
fs.writeFileSync(path.join(out, "js", "version.js"), `window.APP_BUILD = ${build};\n`);
console.log("www spreman, verzija", build);
