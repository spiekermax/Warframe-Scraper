const _ = require('lodash');
const cheerio = require('cheerio');
const utils = require('../utils');

const WARFRAME_ATTRIBUTE_MAP = [
    { key: "mastery", newKey: "mastery" },
    { key: "health", newKey: "health" },
    { key: "shieldcapacity", newKey: "shield" },
    { key: "armor", newKey: "armor" },
    { key: "powercapacity", newKey: "energy" },
    { key: "sprintspeed", newKey: "speed" },
    { key: "mastery", newKey: "mastery" }
];

const NO_COMPARE_ATTRIBUTES = [
    "name",
    "img",
    "id"
];

exports.retrieveWarframeWebContents = function(onRetrieved = () => { })
{
    let htmlLinks = [];
    let htmlLinkContents = [];
    let jsonLinks = [
        "https://raw.githubusercontent.com/WFCD/warframe-items/development/data/json/Warframes.json"
    ];
    let jsonLinkContents = [];
    utils.getWebContentsOf("https://warframe.fandom.com/wiki/Warframes", (content) =>
    {
        let $ = cheerio.load(content);
        $("#mw-content-text").children().eq(1).find(".WarframeNavBox").each((index, item) =>
        {
            let link = $(item).find("div div a").attr("href");
            htmlLinks.push(link);
        });
        
        let linksOpened = 0;
        for(var i = 0; i < htmlLinks.length; ++i)
        {
            utils.getWebContentsOf("https://warframe.fandom.com" + htmlLinks[i], (content) => 
            {
                htmlLinkContents.push(content);
                if(++linksOpened == htmlLinks.length + jsonLinks.length) onRetrieved(htmlLinkContents, jsonLinkContents);
            }, true);
        }

        for(var i = 0; i < jsonLinks.length; ++i)
        {
            utils.getWebContentsOf(jsonLinks[i], (content) => 
            {
                jsonLinkContents.push(content);
                if(++linksOpened == htmlLinks.length + jsonLinks.length) onRetrieved(htmlLinkContents, jsonLinkContents);
            }, true);
        }
    });
}

exports.filterWarframeNormalData = function(inputHTMLs, inputJSONs)
{
    let warframeBuffer = [];

    for(var i = 0; i < inputHTMLs.length; ++i)
    {
        let $ = cheerio.load(inputHTMLs[i]);

        // Warframe: Name
        let nameElement = $('.tabbertab[title="Main"] .pi-title span');
        let name = $(nameElement).clone().children().remove().end().text().trim();
        if(name != "")
        {
            let warframeObject = new Object();
            warframeObject["name"] = name;
            warframeObject["img"] = "assets/warframes/normal/" + name + ".webp";
            warframeObject["id"] = parseInt(_.uniqueId());

            warframeBuffer.push(warframeObject);
        } else continue;

        // Warframe: Polarities
        let polaritiesElement = $('.tabbertab[title="Main"] [data-source="polarities"] div');
        let polarities = [];
        $(polaritiesElement).find("a").each((index, item) => {
            polarities.push($(item).find("img").attr("alt").split(" ")[0].toLowerCase());
        })
        if(polarities.length != 0)
        {
            warframeBuffer[warframeBuffer.length - 1]["polarities"] = polarities;
        }

        // Warframe: Aura polarity
        let auraElement = $('.tabbertab[title="Main"] [data-source="aurapolarity"] div');
        let aura = $(auraElement).find("a img");
        if(aura.length != 0)
        {
            aura = aura.attr("alt").split(" ")[0].toLowerCase();
            warframeBuffer[warframeBuffer.length - 1]["auraPolarity"] = aura;
        }

        // Warframe: Attributes
        for(var n = 0; n < WARFRAME_ATTRIBUTE_MAP.length; ++n)
        {
            let attributeElement = $('.tabbertab[title="Main"] [data-source="' + WARFRAME_ATTRIBUTE_MAP[n].key + '"] div');
            let warframeAttribute = $(attributeElement).clone().children().remove().end().text().trim();
            if(warframeAttribute != "")
            {
                // Remove units.
                if(/[\-\+]?[0-9]+(\.[0-9]+)?(([a-zA-Z]+)|(%))/g.test(warframeAttribute)) warframeAttribute = warframeAttribute.match(/[\-\+]?[0-9]+(\.[0-9]+)?/g)[0];

                if(/\d+ \(\d+ at rank 30\)/g.test(warframeAttribute)) warframeBuffer[warframeBuffer.length - 1][WARFRAME_ATTRIBUTE_MAP[n].newKey] = [ parseFloat(warframeAttribute.match(/\d+/g)[0]), parseFloat(warframeAttribute.match(/\d+/g)[1]) ];
                else if(!isNaN(warframeAttribute)) warframeBuffer[warframeBuffer.length - 1][WARFRAME_ATTRIBUTE_MAP[n].newKey] = parseFloat(warframeAttribute);
                else warframeBuffer[warframeBuffer.length - 1][WARFRAME_ATTRIBUTE_MAP[n].newKey] = warframeAttribute;
            }
        }

        // Warframe: Description, Passive & Abilities
        let nexusHubWarframes = JSON.parse(inputJSONs[0]);
        for(var n = 0; n < nexusHubWarframes.length; ++n)
        {
            if(nexusHubWarframes[n].name == name)
            {
                warframeBuffer[warframeBuffer.length - 1]["description"] = nexusHubWarframes[n].description;

                // Also removes <DT_ELEMENT> signs from ability descriptions.
                warframeBuffer[warframeBuffer.length - 1]["passive"] = nexusHubWarframes[n].passiveDescription.replace(/<DT_[a-zA-Z]+>/g, "");
                warframeBuffer[warframeBuffer.length - 1]["abilities"] = nexusHubWarframes[n].abilities;
                for(var x = 0; x < warframeBuffer[warframeBuffer.length - 1]["abilities"].length; ++x)
                {
                    warframeBuffer[warframeBuffer.length - 1]["abilities"][x].description = warframeBuffer[warframeBuffer.length - 1]["abilities"][x].description.replace(/<DT_[a-zA-Z]+>/g, "");
                }
            }
        }
    }

    return _.sortBy(warframeBuffer, ["name"]);
}

exports.filterWarframeVariantData = function(inputHTMLs, inputJSONs, variantName)
{
    let warframeBuffer = [];

    for(var i = 0; i < inputHTMLs.length; ++i)
    {
        let $ = cheerio.load(inputHTMLs[i]);

        // Warframe: Name
        let nameElement = $('.tabbertab[title="' + variantName + '"] .pi-title span');
        let name = $(nameElement).clone().children().remove().end().text().trim();
        if(name != "")
        {
            let warframeObject = new Object();
            warframeObject["name"] = name;
            warframeObject["img"] = "assets/warframes/" + variantName.toLowerCase() + "/" + name + ".webp";

            warframeBuffer.push(warframeObject);
        } else continue;

        // Warframe: Polarities
        let polaritiesElement = $('.tabbertab[title="' + variantName + '"] [data-source="polarities"] div');
        let polarities = [];
        $(polaritiesElement).find("a").each((index, item) => {
            polarities.push($(item).find("img").attr("alt").split(" ")[0].toLowerCase());
        })
        if(polarities.length != 0)
        {
            warframeBuffer[warframeBuffer.length - 1]["polarities"] = polarities;
        }

        // Warframe: Aura polarity
        let auraElement = $('.tabbertab[title="' + variantName + '"] [data-source="aurapolarity"] div');
        let aura = $(auraElement).find("a img");
        if(aura.length != 0)
        {
            aura = aura.attr("alt").split(" ")[0].toLowerCase();
            warframeBuffer[warframeBuffer.length - 1]["auraPolarity"] = aura;
        }

        // Warframe: Attributes
        for(var n = 0; n < WARFRAME_ATTRIBUTE_MAP.length; ++n)
        {
            let attributeElement = $('.tabbertab[title="' + variantName + '"] [data-source="' + WARFRAME_ATTRIBUTE_MAP[n].key + '"] div');
            let warframeAttribute = $(attributeElement).clone().children().remove().end().text().trim();
            if(warframeAttribute != "")
            {
                // Remove units.
                if(/[\-\+]?[0-9]+(\.[0-9]+)?(([a-zA-Z]+)|(%))/g.test(warframeAttribute)) warframeAttribute = warframeAttribute.match(/[\-\+]?[0-9]+(\.[0-9]+)?/g)[0];

                if(/\d+ \(\d+ at rank 30\)/g.test(warframeAttribute)) warframeBuffer[warframeBuffer.length - 1][WARFRAME_ATTRIBUTE_MAP[n].newKey] = [ parseFloat(warframeAttribute.match(/\d+/g)[0]), parseFloat(warframeAttribute.match(/\d+/g)[1]) ];
                else if(!isNaN(warframeAttribute)) warframeBuffer[warframeBuffer.length - 1][WARFRAME_ATTRIBUTE_MAP[n].newKey] = parseFloat(warframeAttribute);
                else warframeBuffer[warframeBuffer.length - 1][WARFRAME_ATTRIBUTE_MAP[n].newKey] = warframeAttribute;
            }
        }

        // Warframe: Passive & Abilities
        let nexusHubWarframes = JSON.parse(inputJSONs[0]);
        for(var n = 0; n < nexusHubWarframes.length; ++n)
        {
            if(nexusHubWarframes[n].name == name)
            {
                warframeBuffer[warframeBuffer.length - 1]["description"] = nexusHubWarframes[n].description;

                // Also removes <DT_ELEMENT> signs from ability descriptions.
                warframeBuffer[warframeBuffer.length - 1]["passive"] = nexusHubWarframes[n].passiveDescription.replace(/<DT_[a-zA-Z]+>/g, "");
                warframeBuffer[warframeBuffer.length - 1]["abilities"] = nexusHubWarframes[n].abilities;
                for(var x = 0; x < warframeBuffer[warframeBuffer.length - 1]["abilities"].length; ++x)
                {
                    warframeBuffer[warframeBuffer.length - 1]["abilities"][x].description = warframeBuffer[warframeBuffer.length - 1]["abilities"][x].description.replace(/<DT_[a-zA-Z]+>/g, "");
                }
            }
        }
    }

    return _.sortBy(warframeBuffer, ["name"]);
}

exports.parseDeltaWarframeData = function(normalBuffer, variantBuffer, variantName)
{
    let deltaBuffer = [];

    // Iterate through Warframes.
    for(var variantIndex = 0; variantIndex < variantBuffer.length; ++variantIndex)
    {
        let variantWarframe = variantBuffer[variantIndex];
        // Find normal version of Warframe variant.
        let parentWarframe = normalBuffer.filter((warframe) => {
            return warframe.name == variantWarframe.name.replace(" " + variantName, "");
        }); console.assert(parentWarframe.length == 1, "ERROR: parseDeltaWarframeData(): Found multiple objects identified as parent of: '" + variantWarframe.name + "'! Identified: " + parentWarframe);
        parentWarframe = parentWarframe[0];

        // Iterate through attributes.
        for(var warframeAttribute in variantWarframe)
        {
            if(!_.has(variantWarframe, warframeAttribute)) continue;
            if(NO_COMPARE_ATTRIBUTES.includes(warframeAttribute)) continue;

            // The attribute values are equal.
            if(_.isEqual(variantWarframe[warframeAttribute], parentWarframe[warframeAttribute]))
            {
                // Delete redundant attribute.
                variantWarframe = _.omit(variantWarframe, warframeAttribute);
                continue;
            }

            // The attribute is new.
            if(parentWarframe[warframeAttribute] == undefined)
            {
                // New attributes are rated as positive change.
                variantWarframe[warframeAttribute] = [ variantWarframe[warframeAttribute], "+" ];
                continue;
            }


            /* The attribute values differ: */
            // Encoding:
            // '+' - positive change (green)
            // '-' - negative change (red)
            // 'm' - neutral  change (yellow)

            // Attribute type: string
            if(_.isString(variantWarframe[warframeAttribute]))
            {
                // String modifications can't be rated.
                variantWarframe[warframeAttribute] = [ variantWarframe[warframeAttribute], "m" ];
                continue;
            }

            // Attribute type: number
            if(_.isNumber(variantWarframe[warframeAttribute])) 
            {
                // Customized (non-default) behavior:
                if(warframeAttribute == "mastery")
                {
                    // Lower numbers are better.
                    variantWarframe[warframeAttribute] = [ variantWarframe[warframeAttribute], ( variantWarframe[warframeAttribute] > parentWarframe[warframeAttribute] ? "-" : "+" ) ];
                }
                // Default behavior:
                else
                {
                    // Higher numbers are better.
                    variantWarframe[warframeAttribute] = [ variantWarframe[warframeAttribute], ( variantWarframe[warframeAttribute] > parentWarframe[warframeAttribute] ? "+" : "-" ) ];
                }
                continue;
            }

            // Attribute type: array
            if(_.isArray(variantWarframe[warframeAttribute]))
            {
                // The new array is longer:
                if(variantWarframe[warframeAttribute].length > parentWarframe[warframeAttribute].length)
                {
                    // Longer arrays are rated as positive change.
                    variantWarframe[warframeAttribute] = [ variantWarframe[warframeAttribute], "+" ];
                    continue;
                }
                // The new array is shorter:
                else if(variantWarframe[warframeAttribute].length < parentWarframe[warframeAttribute].length) 
                { 
                    // Shorter arrays are rated as negative change.
                    variantWarframe[warframeAttribute] = [ variantWarframe[warframeAttribute], "-" ];
                    continue;
                }


                /* The arrays are of the same length: */

                // All elements are numbers:
                if(variantWarframe[warframeAttribute].every(element => _.isNumber(element)))
                {
                    // All values of the variant are higher or equal:
                    if(variantWarframe[warframeAttribute].every((element, index) => element >= parentWarframe[warframeAttribute][index]))
                    {
                        // Higher numbers are better.
                        variantWarframe[warframeAttribute] = [ variantWarframe[warframeAttribute], "+" ];
                    }
                    // All values of the variant are lower or equal:
                    else if(variantWarframe[warframeAttribute].every((element, index) => element <= parentWarframe[warframeAttribute][index]))
                    {
                        // Lower numbers are worse.
                        variantWarframe[warframeAttribute] = [ variantWarframe[warframeAttribute], "-" ];
                    }
                    else
                    {
                        // The changes can't be rated.
                        variantWarframe[warframeAttribute] = [ variantWarframe[warframeAttribute], "m" ];
                    }
                }
                // All elements are objects:
                else if(variantWarframe[warframeAttribute].every(element => _.isObject(element)))
                {
                    for(var i = 0; i < variantWarframe[warframeAttribute].length; ++i)
                    {
                        if(_.isEqual(variantWarframe[warframeAttribute][i], parentWarframe[warframeAttribute][i])) continue;
                        variantWarframe[warframeAttribute][i] = [ variantWarframe[warframeAttribute][i], "m" ];
                    }
                }
                // Fallback behavior (unrated):
                else
                {
                    // The changes can't be rated.
                    variantWarframe[warframeAttribute] = [ variantWarframe[warframeAttribute], "m" ];
                }
                continue;
            }
        }

        variantWarframe["id"] = parentWarframe["id"];
        deltaBuffer.push(variantWarframe);
    }

    return _.sortBy(deltaBuffer, ["name"]);
}