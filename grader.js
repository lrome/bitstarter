#!/usr/bin/env node
/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/

var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var HTMLFILE_DEFAULT = "index.html";
var URL_DEFAULT = "http://boiling-eyrie-6293.herokuapp.com";
var CHECKSFILE_DEFAULT = "checks.json";
var sys = require('util');
var rest = require('./restler');
var result;


var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
        console.log("%s does not exist. Exiting.", instr);
        process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return instr;
};

var assertUrlExists = function(url) {
    var instr = url;
    return instr;
};

var cheerioHtmlFile = function(htmlfile) {
    return cheerio.load(fs.readFileSync(htmlfile));
    //return cheerio.load(result);
};

var cheerioHtmlUrl = function(html) {
    //return cheerio.load(fs.readFileSync(htmlfile));
    return cheerio.load(html);
};

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlFile = function(htmlfile, checksfile) {
    $ = cheerioHtmlFile(htmlfile);
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for(var ii in checks) {
        var present = $(checks[ii]).length > 0;
        out[checks[ii]] = present;
    }
    return out;
};

var checkHtmlUrl = function(html, checksfile) {
    $ = cheerioHtmlUrl(html);
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for(var ii in checks) {
        var present = $(checks[ii]).length > 0;
        out[checks[ii]] = present;
    }
    return out;
};

var clone = function(fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};
// data will be a Buffer
function processResponse(data) {
  // converting Buffers to strings is expensive, so I prefer
  // to do it explicitely when required
  var str = data.toString();
  return str;
}

var getUrl = function(url) {
    rest.get('http://boiling-eyrie-6293.herokuapp.com').on('complete', function(result) {
    if (result instanceof Error) {
        sys.puts('Error: ' + result.message);
        this.retry(5000); // try again after 5 sec
     }
        var r = processResponse(result);
        var checkJson = checkHtmlUrl(r, program.checks);
        var outJson = JSON.stringify(checkJson, null, 4);
        console.log(outJson);
   });
};

if(require.main == module) {
    program
        .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
        .option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists), HTMLFILE_DEFAULT)
        .option('-u, --url <http_url>', 'URL to html content')
        .parse(process.argv);
        if (program.url) {
           var response = getUrl('http://boiling-eyrie-6293.herokuapp.com');     
        } else {
            var checkJson = checkHtmlFile(program.file, program.checks);
            var outJson = JSON.stringify(checkJson, null, 4);
            console.log(outJson);
        }
} else {
    exports.checkHtmlFile = checkHtmlFile;
}
