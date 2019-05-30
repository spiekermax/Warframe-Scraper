const _ = require('lodash');
const cheerio = require('cheerio');
const utils = require('../utils');

const NO_COMPARE_ATTRIBUTES = [
    "name",
    "img",
    "id"
];

const PET_ATTRIBUTE_MAP = [
    { key: "health", newKey: "health" },
    { key: "shieldcapacity", newKey: "shield" },
    { key: "armor", newKey: "armor" },
    { key: "dmg", newKey: "damage" },
    { key: "elemental dmg", newKey: "elementalDamage" },
    { key: "crit chance", newKey: "critChance" },
    { key: "crit dmg", newKey: "critDamage" },
    { key: "status", newKey: "statusChance" }
];

exports.filterPetNormalData = function(inputHTML)
{
    let petBuffer = [];
    let $ = cheerio.load(inputHTML);

    $(".tabbertab").each((index, item) =>
    {
        if($(item).find(".tabbertab").length != 0) return;

        // Pet: Name
        let nameElement = $(item).find("[data-source='name'] span div");
        let name = $(nameElement).clone().children().remove().end().text().trim();
        if(name != "")
        {
            let petObject = new Object();
            petObject["name"] = name;
            petObject["img"] = "assets/companions/pets/" + name + ".webp";
            petObject["id"] = parseInt(_.uniqueId());

            petBuffer.push(petObject);
        } else return;

        // Pet: Description
        let descriptionElement = $(item).find(".codexflower");
        let description = $(descriptionElement).text().trim();
        if(description != "")
        {
            petBuffer[petBuffer.length - 1]["description"] = description;
        }
    
        // Pet: Polarities
        let polaritiesElement = $(item).find("[data-source='polarities'] div")
        let polaritiesCount = $(polaritiesElement).clone().children().remove().end().text().trim();
        let polarities = [];
        if(polaritiesCount != "")
        {
            polaritiesCount = polaritiesCount.match(/\d/g);
            for(var i = 0; i < polaritiesCount.length; ++i)
            {
                for(var n = 0; n < parseInt(polaritiesCount[i]); ++n)
                {
                    polarities.push($(polaritiesElement).find("a").eq(i).find("img").attr("alt").split(" ")[0]);
                }
            }

            petBuffer[petBuffer.length - 1]["polarities"] = polarities;
        }
    
        // Pet: Attributes
        for(var i = 0; i < PET_ATTRIBUTE_MAP.length; ++i)
        {
            let attributeElement = $(item).find("[data-source='" + PET_ATTRIBUTE_MAP[i].key + "'] div");
            let sentinelAttribute = $(attributeElement).clone().children().remove().end().text().trim();
            if(sentinelAttribute != "")
            {
                if(/[\-\+]?[0-9]+(\.[0-9]+)?(([a-zA-Z]+)|(%))/g.test(sentinelAttribute)) sentinelAttribute = sentinelAttribute.match(/[\-\+]?[0-9]+(\.[0-9]+)?/g)[0];

                if(/\d+ \(\d+ at rank 30\)/g.test(sentinelAttribute)) petBuffer[petBuffer.length - 1][PET_ATTRIBUTE_MAP[i].newKey] = [ parseFloat(sentinelAttribute.match(/\d+/g)[0]), parseFloat(sentinelAttribute.match(/\d+/g)[1]) ];
                else if(!isNaN(sentinelAttribute)) petBuffer[petBuffer.length - 1][PET_ATTRIBUTE_MAP[i].newKey] = parseFloat(sentinelAttribute);
                else petBuffer[petBuffer.length - 1][PET_ATTRIBUTE_MAP[i].newKey] = sentinelAttribute;
            }
        }
    });

    return petBuffer;
}

const SENTINEL_ATTRIBUTE_MAP = [
    { key: "health", newKey: "health" },
    { key: "shieldcapacity", newKey: "shield" },
    { key: "armor", newKey: "armor" },
    { key: "range", newKey: "range" }
];

exports.retrieveSentinelWebContents = function(onRetrieved = () => { })
{
    let links = [];
    let linkContents = [];
    utils.getWebContentsOf("https://warframe.fandom.com/wiki/Sentinel", (content) =>
    {
        let $ = cheerio.load(content);
        $("#mw-content-text").children().eq(1).find(".WarframeNavBox").each((index, item) =>
        {
            let link = $(item).find("div div a").attr("href");
            links.push(link);
        });
        
        let linksOpened = 0;
        for(var i = 0; i < links.length; ++i)
        {
            utils.getWebContentsOf("https://warframe.fandom.com" + links[i], (content) => 
            {
                linkContents.push(content);
                if(++linksOpened == links.length) onRetrieved(linkContents);
            }, true);
        }
    });
}

exports.filterSentinelNormalData = function(inputHTMLs)
{
    let sentinelBuffer = [];

    for(var i = 0; i < inputHTMLs.length; ++i)
    {
        let $ = cheerio.load(inputHTMLs[i]);

        // Sentinel: Name
        let nameElement = $('.tabbertab[title="Main"] [data-source="name"] span');
        let name = $(nameElement).clone().children().remove().end().text().trim();
        if(name != "")
        {
            let sentinelObject = new Object();
            sentinelObject["name"] = name;
            sentinelObject["img"] = "assets/companions/sentinels/normal/" + name + ".webp";
            sentinelObject["id"] = parseInt(_.uniqueId());

            sentinelBuffer.push(sentinelObject);
        } else continue;

        // Sentinel: Description
        let descriptionElement = $('.tabbertab[title="Main"] .codexflower');
        let description = $(descriptionElement).text().trim();
        if(description != "")
        {
            sentinelBuffer[sentinelBuffer.length - 1]["description"] = description;
        }

        // Sentinel: Polarities
        let polaritiesElement = $('.tabbertab[title="Main"] [data-source="polarities"] div');
        let polaritiesCount = $(polaritiesElement).clone().children().remove().end().text().trim();
        let polarities = [];
        if(polaritiesCount != "")
        {
            polaritiesCount = polaritiesCount.match(/\d/g);
            for(var x = 0; x < polaritiesCount.length; ++x)
            {
                for(var n = 0; n < parseInt(polaritiesCount[x]); ++n)
                {
                    polarities.push($(polaritiesElement).find("a").eq(x).find("img").attr("alt").split(" ")[0]);
                }
            }

            sentinelBuffer[i]["polarities"] = polarities;
        }

        // Sentinel: Attributes
        for(var n = 0; n < SENTINEL_ATTRIBUTE_MAP.length; ++n)
        {
            let attributeElement = $('.tabbertab[title="Main"] [data-source="' + SENTINEL_ATTRIBUTE_MAP[n].key + '"] div');
            let sentinelAttribute = $(attributeElement).clone().children().remove().end().text().trim();
            if(sentinelAttribute != "")
            {
                // Remove units.
                if(/[\-\+]?[0-9]+(\.[0-9]+)?(([a-zA-Z]+)|(%))/g.test(sentinelAttribute)) sentinelAttribute = sentinelAttribute.match(/[\-\+]?[0-9]+(\.[0-9]+)?/g)[0];

                // Mastery: Transform data string into array.
                if(/\d+ \(\d+ at rank 30\)/g.test(sentinelAttribute)) sentinelBuffer[sentinelBuffer.length - 1][SENTINEL_ATTRIBUTE_MAP[n].newKey] = [ parseFloat(sentinelAttribute.match(/\d+/g)[0]), parseFloat(sentinelAttribute.match(/\d+/g)[1]) ];
                // Cast to number if possible.
                else if(!isNaN(sentinelAttribute)) sentinelBuffer[sentinelBuffer.length - 1][SENTINEL_ATTRIBUTE_MAP[n].newKey] = parseFloat(sentinelAttribute);
                // Default behavior.
                else sentinelBuffer[sentinelBuffer.length - 1][SENTINEL_ATTRIBUTE_MAP[n].newKey] = sentinelAttribute;
            }
        }
    }

    return sentinelBuffer;
}

exports.filterSentinelVariantData = function(inputHTMLs, variantName)
{
    let sentinelBuffer = [];

    for(var i = 0; i < inputHTMLs.length; ++i)
    {
        let $ = cheerio.load(inputHTMLs[i]);

        // Sentinel: Name
        let nameElement = $('.tabbertab[title="' + variantName + '"] [data-source="name"] span');
        let name = $(nameElement).clone().children().remove().end().text().trim();
        if(name != "")
        {
            let sentinelObject = new Object();
            sentinelObject["name"] = name;
            sentinelObject["img"] = "assets/companions/sentinels/" + variantName.toLowerCase() + "/" + name + ".webp";

            sentinelBuffer.push(sentinelObject);
        } else continue;

        // Sentinel: Description
        let descriptionElement = $('.tabbertab[title="' + variantName + '"] .codexflower');
        let description = $(descriptionElement).text().trim();
        if(description != "")
        {
            sentinelBuffer[sentinelBuffer.length - 1]["description"] = description;
        }

        // Sentinel: Polarities
        let polaritiesElement = $('.tabbertab[title="' + variantName + '"] [data-source="polarities"] div');
        let polaritiesCount = $(polaritiesElement).clone().children().remove().end().text().trim();
        let polarities = [];
        if(polaritiesCount != "")
        {
            polaritiesCount = polaritiesCount.match(/\d/g);
            for(var x = 0; x < polaritiesCount.length; ++x)
            {
                for(var n = 0; n < parseInt(polaritiesCount[x]); ++n)
                {
                    polarities.push($(polaritiesElement).find("a").eq(x).find("img").attr("alt").split(" ")[0]);
                }
            }

            sentinelBuffer[sentinelBuffer.length - 1]["polarities"] = polarities;
        }

        // Sentinel: Attributes
        for(var n = 0; n < SENTINEL_ATTRIBUTE_MAP.length; ++n)
        {
            let attributeElement = $('.tabbertab[title="' + variantName + '"] [data-source="' + SENTINEL_ATTRIBUTE_MAP[n].key + '"] div');
            let sentinelAttribute = $(attributeElement).clone().children().remove().end().text().trim();
            if(sentinelAttribute != "")
            {
                // Remove units.
                if(/[\-\+]?[0-9]+(\.[0-9]+)?(([a-zA-Z]+)|(%))/g.test(sentinelAttribute)) sentinelAttribute = sentinelAttribute.match(/[\-\+]?[0-9]+(\.[0-9]+)?/g)[0];
                
                // Mastery: Transform data string into array.
                if(/\d+ \(\d+ at rank 30\)/g.test(sentinelAttribute)) sentinelBuffer[sentinelBuffer.length - 1][SENTINEL_ATTRIBUTE_MAP[n].newKey] = [ parseFloat(sentinelAttribute.match(/\d+/g)[0]), parseFloat(sentinelAttribute.match(/\d+/g)[1]) ];
                // Cast to number if possible.
                else if(!isNaN(sentinelAttribute)) sentinelBuffer[sentinelBuffer.length - 1][SENTINEL_ATTRIBUTE_MAP[n].newKey] = parseFloat(sentinelAttribute);
                // Default behavior.
                else sentinelBuffer[sentinelBuffer.length - 1][SENTINEL_ATTRIBUTE_MAP[n].newKey] = sentinelAttribute;
            }
        }
    }

    return sentinelBuffer;
}

exports.parseDeltaSentinelData = function(normalBuffer, variantBuffer, variantName)
{
    let deltaBuffer = [];

    // Iterate through Warframes.
    for(var variantIndex = 0; variantIndex < variantBuffer.length; ++variantIndex)
    {
        let variantSentinel = variantBuffer[variantIndex];
        // Find normal version of Warframe variant.
        let parentSentinel = normalBuffer.filter((warframe) => {
            return warframe.name == variantSentinel.name.replace(" " + variantName, "");
        }); console.assert(parentSentinel.length == 1, "ERROR: parseDeltaSentinelData(): Found multiple objects identified as parent of: '" + variantSentinel.name + "'! Identified: " + parentSentinel);
        parentSentinel = parentSentinel[0];

        // Iterate through attributes.
        for(var sentinelAttribute in variantSentinel)
        {
            if(!_.has(variantSentinel, sentinelAttribute)) continue;
            if(NO_COMPARE_ATTRIBUTES.includes(sentinelAttribute)) continue;

            // The attribute values are equal.
            if(_.isEqual(variantSentinel[sentinelAttribute], parentSentinel[sentinelAttribute]))
            {
                // Delete redundant attribute.
                variantSentinel = _.omit(variantSentinel, sentinelAttribute);
                continue;
            }

            // The attribute is new.
            if(parentSentinel[sentinelAttribute] == undefined)
            {
                // New attributes are rated as positive change.
                variantSentinel[sentinelAttribute] = [ variantSentinel[sentinelAttribute], "+" ];
                continue;
            }


            /* The attribute values differ. */
            // Encoding:
            // '+' - positive change (green)
            // '-' - negative change (red)
            // 'm' - neutral  change (yellow)

            // Attribute type: string
            if(_.isString(variantSentinel[sentinelAttribute]))
            {
                // String modifications can't be rated.
                variantSentinel[sentinelAttribute] = [ variantSentinel[sentinelAttribute], "m" ];
                continue;
            }

            // Attribute type: number
            if(_.isNumber(variantSentinel[sentinelAttribute])) 
            {
                // Higher numbers are better.
                variantSentinel[sentinelAttribute] = [ variantSentinel[sentinelAttribute], ( variantSentinel[sentinelAttribute] > parentSentinel[sentinelAttribute] ? "+" : "-" ) ];
                continue;
            }

            // Attribute type: array
            if(_.isArray(variantSentinel[sentinelAttribute]))
            {
                // The new array is longer.
                if(variantSentinel[sentinelAttribute].length > parentSentinel[sentinelAttribute].length)
                {
                    variantSentinel[sentinelAttribute] = [ variantSentinel[sentinelAttribute], "+" ];
                }
                // The new array is shorter.
                else if(variantSentinel[sentinelAttribute].length < parentSentinel[sentinelAttribute].length) 
                { 
                    variantSentinel[sentinelAttribute] = [ variantSentinel[sentinelAttribute], "-" ];
                } 
                // The arrays are of the same length.
                else
                {
                    // The changes can't be rated.
                    variantSentinel[sentinelAttribute] = [ variantSentinel[sentinelAttribute], "m" ];
                }
                continue;
            }
        }

        variantSentinel["id"] = parentSentinel["id"];
        deltaBuffer.push(variantSentinel);
    }

    return deltaBuffer;
}