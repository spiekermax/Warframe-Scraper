const request = require('request');
const fs = require('fs');

exports.getWebContentsOf = function(urls, onRetrieved = (urls, contents) => {}, silenceLog = false)
{
    if(urls.length != (new Set(urls)).size) throw new Error("URL array " + urls + " contains duplicates!");

    let urlContents = new Array(urls.length);
    let urlsOpened = 0;

    for(var i = 0; i < urls.length; ++i)
    {
        exports.getWebContentOf(urls[i], (url, content) => {
            urlContents[urls.indexOf(url)] = content;
            
            if(++urlsOpened == urls.length) onRetrieved(urls, urlContents);
        }, silenceLog);
    }
}

exports.getWebContentOf = function(url, onRetrieved = (url, content) => {}, silenceLog = false)
{
    request.get(url, (error, response, body) => {
        if(error || response.statusCode != 200) throw new Error("Could not retrieve '" + url + "': " + error);

        onRetrieved(url, body);
        if(!silenceLog) console.log("LOG: Successfully retrieved contents of '" + url + "'");
    });
}

exports.makeOutputDir = function()
{
    if(fs.existsSync("./output")) return;
    
    fs.mkdirSync("./output");
    console.log("LOG: Successfully created output directory");
}

exports.writeOutputFile = function(name, content)
{
    fs.writeFile("./output/" + name, content, (error) => {
        if(error) throw error;

        console.log("LOG: Successfully saved '" + name + "' to output directory");
    })
}