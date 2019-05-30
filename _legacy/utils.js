const request = require('request');
const fs = require('fs');

exports.getWebContentsOf = function(url, onRetrieved = () => { }, silenceLog = false)
{
    request.get(url, (error, response, body) => {
        if(error || response.statusCode != 200) throw new Error("Could not retrieve '" + url + "': " + error);
        
        if(!silenceLog) console.log("LOG: Successfully retrieved contents of '" + url);
        onRetrieved(body);
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