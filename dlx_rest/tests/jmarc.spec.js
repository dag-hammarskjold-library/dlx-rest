
var apiUrl = "http://localhost:5000/api/";
var jmarcCompiled = __dirname + "/jmarc.umd.js";



test("load", async function() {
    var rollup = require("rollup");
    
    const bundle = await rollup.rollup({input: __dirname + "/../static/js/jmarc.js"});  
    await bundle.write({format: "umd", file: jmarcCompiled, name: "jmarcjs"});
    await bundle.close();
    
    const jmarcjs = require(jmarcCompiled);
    jmarcjs.Jmarc.apiUrl = apiUrl;
    
    var bib = new jmarcjs.Bib()
    
    bib.createField("245").createSubfield("a").value = "new"
})