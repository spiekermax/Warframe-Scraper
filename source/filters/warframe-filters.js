const _ = require('lodash');
const cheerio = require('cheerio');
const utils = require('../utils');

const WARFRAME_ATTRIBUTE_MAP = [
    { key: "mastery", newKey: "mastery" },
    { key: "health", newKey: "health" },
    { key: "shieldcapacity", newKey: "shield" },
    { key: "armor", newKey: "armor" },
    { key: "powercapacity", newKey: "energy" },
    { key: "sprintspeed", newKey: "speed" }
];

const NO_COMPARE_ATTRIBUTES = [
    "id",
    "name",
    "img",
    "description"
];

exports.retrieveWarframeWebContents = function(onRetrieved = (htmlContents, jsonContents) => {})
{
    // HTML contents
    let htmlLinks = [];
    let htmlLinkContents = [];

    // JSON contents
    let jsonLinks = [
        "https://raw.githubusercontent.com/WFCD/warframe-items/development/data/json/Warframes.json"
    ];
    let jsonLinkContents = [];

    utils.getWebContentOf("https://warframe.fandom.com/wiki/Warframes", (url, content) =>
    {
        // Retrieve HTML links.
        let $ = cheerio.load(content);
        $("#mw-content-text").children().eq(1).find(".WarframeNavBox").each((index, element) =>
        {
            let link = "https://warframe.fandom.com" + $(element).find("div div a").attr("href");
            htmlLinks.push(link);
        });

        // Retrieve link contents seperately.
        utils.getWebContentsOf(htmlLinks, (urls, contents) =>
        {
            htmlLinkContents = contents;
            
            utils.getWebContentsOf(jsonLinks, (urls, contents) =>
            {
                jsonLinkContents = contents;

                // All contents have been fetched.
                onRetrieved(htmlLinkContents, jsonLinkContents);
            }, true);
        }, true);
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
        if(!_.isEmpty(name))
        {
            let warframeObject = new Object;
            warframeObject["name"] = name;
            warframeObject["img"] = "assets/warframes/normal/" + name + ".webp";
            warframeObject["id"] = parseInt(_.uniqueId());

            warframeBuffer.push(warframeObject);
        } else continue;

        // Warframe: Polarities
        let polaritiesElement = $('.tabbertab[title="Main"] [data-source="polarities"] div');
        let polarities = [];
        $(polaritiesElement).find("a").each((index, element) => {
            polarities.push($(element).find("img").attr("alt").split(" ")[0].toLowerCase());
        });
        if(!_.isEmpty(polarities))
        {
            warframeBuffer[warframeBuffer.length - 1]["polarities"] = polarities;
        }

        // Warframe: Aura polarity
        let auraElement = $('.tabbertab[title="Main"] [data-source="aurapolarity"] div');
        let aura = $(auraElement).find("a img");
        if(!_.isEmpty(aura))
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
                // Remove attribute value units.
                if(/[\-\+]?[0-9]+(\.[0-9]+)?(([a-zA-Z]+)|(%))/g.test(warframeAttribute)) warframeAttribute = warframeAttribute.match(/[\-\+]?[0-9]+(\.[0-9]+)?/g)[0];

                // Transform 'at rank 30' strings in to arrays.
                if(/\d+ \(\d+ at rank 30\)/g.test(warframeAttribute)) warframeBuffer[warframeBuffer.length - 1][WARFRAME_ATTRIBUTE_MAP[n].newKey] = [ parseFloat(warframeAttribute.match(/\d+/g)[0]), parseFloat(warframeAttribute.match(/\d+/g)[1]) ];
                // Cast attribute value to float if possible.
                else if(!isNaN(warframeAttribute)) warframeBuffer[warframeBuffer.length - 1][WARFRAME_ATTRIBUTE_MAP[n].newKey] = parseFloat(warframeAttribute);
                // Default: Copy the given value.
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
                warframeBuffer[warframeBuffer.length - 1]["passive"] = nexusHubWarframes[n].passiveDescription;
                warframeBuffer[warframeBuffer.length - 1]["abilities"] = nexusHubWarframes[n].abilities;

                // Remove '<DT_DAMAGETYPE>' tags from descriptions.
                warframeBuffer[warframeBuffer.length - 1].passive = warframeBuffer[warframeBuffer.length - 1].passive.replace(/<DT_[a-zA-Z]+>/g, "")
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
        if(!_.isEmpty(name))
        {
            let warframeObject = new Object();
            warframeObject["name"] = name;
            warframeObject["img"] = "assets/warframes/" + variantName.toLowerCase() + "/" + name + ".webp";

            warframeBuffer.push(warframeObject);
        } else continue;

        // Warframe: Polarities
        let polaritiesElement = $('.tabbertab[title="' + variantName + '"] [data-source="polarities"] div');
        let polarities = [];
        $(polaritiesElement).find("a").each((index, element) => {
            polarities.push($(element).find("img").attr("alt").split(" ")[0].toLowerCase());
        })
        if(!_.isEmpty(polarities))
        {
            warframeBuffer[warframeBuffer.length - 1]["polarities"] = polarities;
        }

        // Warframe: Aura polarity
        let auraElement = $('.tabbertab[title="' + variantName + '"] [data-source="aurapolarity"] div');
        let aura = $(auraElement).find("a img");
        if(!_.isEmpty(aura))
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
                // Remove attribute value units.
                if(/[\-\+]?[0-9]+(\.[0-9]+)?(([a-zA-Z]+)|(%))/g.test(warframeAttribute)) warframeAttribute = warframeAttribute.match(/[\-\+]?[0-9]+(\.[0-9]+)?/g)[0];

                // Transform 'at rank 30' strings in to arrays.
                if(/\d+ \(\d+ at rank 30\)/g.test(warframeAttribute)) warframeBuffer[warframeBuffer.length - 1][WARFRAME_ATTRIBUTE_MAP[n].newKey] = [ parseFloat(warframeAttribute.match(/\d+/g)[0]), parseFloat(warframeAttribute.match(/\d+/g)[1]) ];
                // Cast attribute value to float if possible.
                else if(!isNaN(warframeAttribute)) warframeBuffer[warframeBuffer.length - 1][WARFRAME_ATTRIBUTE_MAP[n].newKey] = parseFloat(warframeAttribute);
                // Default: Copy the given value.
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
                warframeBuffer[warframeBuffer.length - 1]["passive"] = nexusHubWarframes[n].passiveDescription;
                warframeBuffer[warframeBuffer.length - 1]["abilities"] = nexusHubWarframes[n].abilities;

                // Remove '<DT_DAMAGETYPE>' tags from descriptions.
                warframeBuffer[warframeBuffer.length - 1].passive = warframeBuffer[warframeBuffer.length - 1].passive.replace(/<DT_[a-zA-Z]+>/g, "")
                for(var x = 0; x < warframeBuffer[warframeBuffer.length - 1]["abilities"].length; ++x)
                {
                    warframeBuffer[warframeBuffer.length - 1]["abilities"][x].description = warframeBuffer[warframeBuffer.length - 1]["abilities"][x].description.replace(/<DT_[a-zA-Z]+>/g, "");
                }
            }
        }
    }

    return _.sortBy(warframeBuffer, ["name"]);
}

exports.parseDeltaWarframeData = function(parentBuffer, variantBuffer, variantName)
{
    let deltaBuffer = [];

    // Iterate through Warframes.
    for(var variantIndex = 0; variantIndex < variantBuffer.length; ++variantIndex)
    {
        let variantWarframe = variantBuffer[variantIndex];
        // Find normal version of Warframe variant.
        let parentWarframe = parentBuffer.filter((warframe) => {
            return warframe.name == variantWarframe.name.replace(" " + variantName, "");
        }); console.assert(parentWarframe.length == 1, "ERROR: parseDeltaWarframeData(): Found multiple objects identified as parent of: '" + variantWarframe.name + "'! Identified: " + parentWarframe);
        parentWarframe = parentWarframe[0];

        // Add missing attributes so they don't get ignored in rating.
        for(var warframeAttribute in parentWarframe)
        {
            if(!_.has(parentWarframe, warframeAttribute)) continue;
            if(!_.has(variantWarframe, warframeAttribute)) variantWarframe[warframeAttribute] = undefined;
        }
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

            // The attribute is undefined.
            if(_.isUndefined(variantWarframe[warframeAttribute]))
            {
                // Missing attribute values are rated as negative change.
                variantWarframe[warframeAttribute] = [ variantWarframe[warframeAttribute], "-" ];
                continue;
            }

            // The attribute is new.
            if(!_.has(parentWarframe, warframeAttribute))
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
                // Ignore name changes in the rating.
                if(variantWarframe[warframeAttribute].replace(variantWarframe.name, "") != parentWarframe[warframeAttribute].replace(parentWarframe.name, ""))
                {
                    // String modifications can't be rated.
                    variantWarframe[warframeAttribute] = [ variantWarframe[warframeAttribute], "m" ];
                }
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

                // All elements are objects:
                if(variantWarframe[warframeAttribute].every(element => _.isObject(element)))
                {
                    // Rate objects individually (semi-recursive behavior).
                    for(var i = 0; i < variantWarframe[warframeAttribute].length; ++i)
                    {
                        if(_.isEqual(variantWarframe[warframeAttribute][i], parentWarframe[warframeAttribute][i])) continue;

                        // Don't rate deep changes, instead just rate this as modification 'm'.
                        variantWarframe[warframeAttribute][i] = [ variantWarframe[warframeAttribute][i], "m" ];
                    }
                }
                // All elements are numbers:
                else if(variantWarframe[warframeAttribute].every(element => _.isNumber(element)))
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
                // Fallback behavior (unrated):
                else
                {
                    // The changes can't be rated.
                    variantWarframe[warframeAttribute] = [ variantWarframe[warframeAttribute], "m" ];
                }
                continue;
            }

            console.assert(false, "ERROR: parseDeltaWarframeData(): Unhandled attribute type of '" + variantWarframe[warframeAttribute] + "'");
        }

        variantWarframe["id"] = parentWarframe["id"];
        deltaBuffer.push(variantWarframe);
    }

    return _.sortBy(deltaBuffer, ["name"]);
}