const _ = require('lodash');
const cheerio = require('cheerio');
const utils = require('../utils');

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

const NO_COMPARE_ATTRIBUTES = [
    "id",
    "name",
    "img",
    "description"
];

exports.filterPetNormalData = function(inputHTML)
{
    let petBuffer = [];
    let $ = cheerio.load(inputHTML);

    $(".tabbertab").each((index, element) =>
    {
        if($(element).find(".tabbertab").length != 0) return;

        // Pet: Name
        let nameElement = $(element).find("[data-source='name'] span div");
        let name = $(nameElement).clone().children().remove().end().text().trim();
        if(!_.isEmpty(name))
        {
            let petObject = new Object;
            petObject["name"] = name;
            petObject["img"] = "assets/companions/pets/" + name + ".webp";
            petObject["id"] = parseInt(_.uniqueId());

            petBuffer.push(petObject);
        } else return;

        // Pet: Description
        let descriptionElement = $(element).find(".codexflower");
        let description = $(descriptionElement).text().trim();
        if(!_.isEmpty(description))
        {
            petBuffer[petBuffer.length - 1]["description"] = description;
        }
    
        // Pet: Polarities
        let polaritiesElement = $(element).find("[data-source='polarities'] div")
        let polaritiesCount = $(polaritiesElement).clone().children().remove().end().text().trim();
        let polarities = [];
        if(!_.isEmpty(polaritiesCount))
        {
            polaritiesCount = polaritiesCount.match(/\d/g);
            for(var i = 0; i < polaritiesCount.length; ++i)
            {
                for(var n = 0; n < parseInt(polaritiesCount[i]); ++n)
                {
                    polarities.push($(polaritiesElement).find("a").eq(i).find("img").attr("alt").split(" ")[0].toLowerCase());
                }
            }

            petBuffer[petBuffer.length - 1]["polarities"] = polarities;
        }
    
        // Pet: Attributes
        for(var i = 0; i < PET_ATTRIBUTE_MAP.length; ++i)
        {
            let attributeElement = $(element).find("[data-source='" + PET_ATTRIBUTE_MAP[i].key + "'] div");
            let sentinelAttribute = $(attributeElement).clone().children().remove().end().text().trim();
            if(sentinelAttribute != "")
            {
                // Remove attribute value units.
                if(/[\-\+]?[0-9]+(\.[0-9]+)?(([a-zA-Z]+)|(%))/g.test(sentinelAttribute)) sentinelAttribute = sentinelAttribute.match(/[\-\+]?[0-9]+(\.[0-9]+)?/g)[0];

                // Transform 'at rank 30' strings in to arrays.
                if(/\d+ \(\d+ at rank 30\)/g.test(sentinelAttribute)) petBuffer[petBuffer.length - 1][PET_ATTRIBUTE_MAP[i].newKey] = [ parseFloat(sentinelAttribute.match(/\d+/g)[0]), parseFloat(sentinelAttribute.match(/\d+/g)[1]) ];
                // Cast attribute value to float if possible.
                else if(!isNaN(sentinelAttribute)) petBuffer[petBuffer.length - 1][PET_ATTRIBUTE_MAP[i].newKey] = parseFloat(sentinelAttribute);
                // Default: Copy the given value.
                else petBuffer[petBuffer.length - 1][PET_ATTRIBUTE_MAP[i].newKey] = sentinelAttribute;
            }
        }
    });

    return _.sortBy(petBuffer, "name");
}

const SENTINEL_ATTRIBUTE_MAP = [
    { key: "health", newKey: "health" },
    { key: "shieldcapacity", newKey: "shield" },
    { key: "armor", newKey: "armor" },
    { key: "range", newKey: "range" }
];

exports.retrieveSentinelWebContents = function(onRetrieved = (contents) => {})
{
    let sentinelLinks = [];
    let sentinelContents = [];
    utils.getWebContentOf("https://warframe.fandom.com/wiki/Sentinel", (url, content) =>
    {
        // Fetch sentinel links.
        let $ = cheerio.load(content);
        $("#mw-content-text").children().eq(1).find(".WarframeNavBox").each((index, element) =>
        {
            let sentinelLink = "https://warframe.fandom.com" + $(element).find("div div a").attr("href");
            sentinelLinks.push(sentinelLink);
        });
        
        let weaponLinks = [];
        let weaponContents = [];
        let primeWeaponLinks = [];
        let primeWeaponContents = [];
        utils.getWebContentsOf(sentinelLinks, (urls, contents) =>
        {
            sentinelContents = contents;
            for(var i = 0; i < contents.length; ++i)
            {
                if($(contents[i]).has(".tabbertab[title='Prime']"))
                {
                    let primeWeaponLink = $(contents[i]).find(".tabbertab[title='Prime'] [data-source='weapon'] div span a").eq(1).attr("href");
                    
                    if(!_.isUndefined(primeWeaponLink))
                    {
                        primeWeaponLink = "https://warframe.fandom.com" + primeWeaponLink;
                        primeWeaponLinks.push(primeWeaponLink);
                    }
                }

                let weaponLink = "https://warframe.fandom.com" + $(contents[i]).find(".tabbertab[title='Main'] [data-source='weapon'] div span a").eq(1).attr("href");
                weaponLinks.push(weaponLink);
            }

            utils.getWebContentsOf(weaponLinks, (urls, contents) =>
            {
                weaponContents = contents;
                utils.getWebContentsOf(primeWeaponLinks, (urls, contents) =>
                {
                    primeWeaponContents = contents;

                    onRetrieved(sentinelContents, weaponContents, primeWeaponContents);
                });
            });
        });
    });
}

exports.filterSentinelNormalData = function(sentinelHTMLs, weaponHTMLs)
{
    let sentinelBuffer = [];

    for(var i = 0; i < sentinelHTMLs.length; ++i)
    {
        let $ = cheerio.load(sentinelHTMLs[i]);

        // Sentinel: Name
        let nameElement = $('.tabbertab[title="Main"] [data-source="name"] span');
        let name = $(nameElement).clone().children().remove().end().text().trim();
        if(!_.isEmpty(name))
        {
            let sentinelObject = new Object;
            sentinelObject["name"] = name;
            sentinelObject["img"] = "assets/companions/sentinels/normal/" + name + ".webp";
            sentinelObject["id"] = parseInt(_.uniqueId());

            sentinelBuffer.push(sentinelObject);
        } else continue;

        // Sentinel: Description
        let descriptionElement = $('.tabbertab[title="Main"] .codexflower');
        let description = $(descriptionElement).text().trim();
        if(!_.isEmpty(description))
        {
            sentinelBuffer[sentinelBuffer.length - 1]["description"] = description;
        }

        // Sentinel: Polarities
        let polaritiesElement = $('.tabbertab[title="Main"] [data-source="polarities"] div');
        let polaritiesCount = $(polaritiesElement).clone().children().remove().end().text().trim();
        let polarities = [];
        if(!_.isEmpty(polaritiesCount))
        {
            polaritiesCount = polaritiesCount.match(/\d/g);
            for(var x = 0; x < polaritiesCount.length; ++x)
            {
                for(var n = 0; n < parseInt(polaritiesCount[x]); ++n)
                {
                    polarities.push($(polaritiesElement).find("a").eq(x).find("img").attr("alt").split(" ")[0].toLowerCase());
                }
            }

            sentinelBuffer[sentinelBuffer.length - 1]["polarities"] = polarities;
        }

        // Sentinel: Attributes
        for(var n = 0; n < SENTINEL_ATTRIBUTE_MAP.length; ++n)
        {
            let attributeElement = $('.tabbertab[title="Main"] [data-source="' + SENTINEL_ATTRIBUTE_MAP[n].key + '"] div');
            let sentinelAttribute = $(attributeElement).clone().children().remove().end().text().trim();
            if(sentinelAttribute != "")
            {
                // Remove attribute value units.
                if(/[\-\+]?[0-9]+(\.[0-9]+)?(([a-zA-Z]+)|(%))/g.test(sentinelAttribute)) sentinelAttribute = sentinelAttribute.match(/[\-\+]?[0-9]+(\.[0-9]+)?/g)[0];

                // Transform 'at rank 30' strings in to arrays.
                if(/\d+ \(\d+ at rank 30\)/g.test(sentinelAttribute)) sentinelBuffer[sentinelBuffer.length - 1][SENTINEL_ATTRIBUTE_MAP[n].newKey] = [ parseFloat(sentinelAttribute.match(/\d+/g)[0]), parseFloat(sentinelAttribute.match(/\d+/g)[1]) ];
                // Cast attribute value to float if possible.
                else if(!isNaN(sentinelAttribute)) sentinelBuffer[sentinelBuffer.length - 1][SENTINEL_ATTRIBUTE_MAP[n].newKey] = parseFloat(sentinelAttribute);
                // Default: Copy the given value.
                else sentinelBuffer[sentinelBuffer.length - 1][SENTINEL_ATTRIBUTE_MAP[n].newKey] = sentinelAttribute;
            }
        }

        // Sentinel: Weapon
        $ = cheerio.load(weaponHTMLs[i]);
        sentinelBuffer[sentinelBuffer.length - 1]["weapon"] =
        {
            name: $(".pi-title span").text().trim(),
            mastery: parseInt($("[data-source='mastery level'] div").text().trim()),
            noiselevel: $("[data-source='noise level'] div").text().trim(),
            fireRate: parseFloat($("[data-source='fire rate'] div").text().trim().match(/[\-\+]?[0-9]+(\.[0-9]+)?/g)),
            accuracy: parseFloat($("[data-source='accuracy'] div").text().trim()),
            magSize: parseInt($("[data-source='magazine'] div").text().trim().match(/[\-\+]?[0-9]+(\.[0-9]+)?/g)),
            reloadSpeed: parseFloat($("[data-source='reload'] div").text().trim().match(/[\-\+]?[0-9]+(\.[0-9]+)?/g)),
            damage: parseFloat($("[data-source='normal damage'] div").text().trim().match(/[\-\+]?[0-9]+(\.[0-9]+)?/g)[0]),
            critChance: parseFloat($("[data-source='normal critical chance'] div").text().trim().match(/[\-\+]?[0-9]+(\.[0-9]+)?/g)),
            critDamage: parseFloat($("[data-source='normal critical damage'] div").text().trim().match(/[\-\+]?[0-9]+(\.[0-9]+)?/g)),
            statusChance: parseFloat($("[data-source='normal status chance'] div").text().trim().match(/[\-\+]?[0-9]+(\.[0-9]+)?/g))
        };
        // Remove 'noiselevel' attribute if it's value is "Alarming"
        if(sentinelBuffer[sentinelBuffer.length - 1].weapon.noiselevel == "Alarming") delete sentinelBuffer[sentinelBuffer.length - 1].weapon.noiselevel;
    }

    return _.sortBy(sentinelBuffer, "name");
}

exports.filterSentinelVariantData = function(sentinelHTMLs, weaponHTMLs, variantName)
{
    let sentinelBuffer = [];

    for(var i = 0; i < sentinelHTMLs.length; ++i)
    {
        let $ = cheerio.load(sentinelHTMLs[i]);

        // Sentinel: Name
        let nameElement = $('.tabbertab[title="' + variantName + '"] [data-source="name"] span');
        let name = $(nameElement).clone().children().remove().end().text().trim();
        if(!_.isEmpty(name))
        {
            let sentinelObject = new Object();
            sentinelObject["name"] = name;
            sentinelObject["img"] = "assets/companions/sentinels/" + variantName.toLowerCase() + "/" + name + ".webp";

            sentinelBuffer.push(sentinelObject);
        } else continue;

        // Sentinel: Description
        let descriptionElement = $('.tabbertab[title="' + variantName + '"] .codexflower');
        let description = $(descriptionElement).text().trim();
        if(!_.isEmpty(description))
        {
            sentinelBuffer[sentinelBuffer.length - 1]["description"] = description;
        }

        // Sentinel: Polarities
        let polaritiesElement = $('.tabbertab[title="' + variantName + '"] [data-source="polarities"] div');
        let polaritiesCount = $(polaritiesElement).clone().children().remove().end().text().trim();
        let polarities = [];
        if(!_.isEmpty(polaritiesCount))
        {
            polaritiesCount = polaritiesCount.match(/\d/g);
            for(var x = 0; x < polaritiesCount.length; ++x)
            {
                for(var n = 0; n < parseInt(polaritiesCount[x]); ++n)
                {
                    polarities.push($(polaritiesElement).find("a").eq(x).find("img").attr("alt").split(" ")[0].toLowerCase());
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
                // Remove attribute value units.
                if(/[\-\+]?[0-9]+(\.[0-9]+)?(([a-zA-Z]+)|(%))/g.test(sentinelAttribute)) sentinelAttribute = sentinelAttribute.match(/[\-\+]?[0-9]+(\.[0-9]+)?/g)[0];
                
                // Transform 'at rank 30' strings in to arrays.
                if(/\d+ \(\d+ at rank 30\)/g.test(sentinelAttribute)) sentinelBuffer[sentinelBuffer.length - 1][SENTINEL_ATTRIBUTE_MAP[n].newKey] = [ parseFloat(sentinelAttribute.match(/\d+/g)[0]), parseFloat(sentinelAttribute.match(/\d+/g)[1]) ];
                // Cast attribute value to float if possible.
                else if(!isNaN(sentinelAttribute)) sentinelBuffer[sentinelBuffer.length - 1][SENTINEL_ATTRIBUTE_MAP[n].newKey] = parseFloat(sentinelAttribute);
                // Default: Copy the given value.
                else sentinelBuffer[sentinelBuffer.length - 1][SENTINEL_ATTRIBUTE_MAP[n].newKey] = sentinelAttribute;
            }
        }

        // Sentinel: Weapon
        $ = cheerio.load(weaponHTMLs[sentinelBuffer.length - 1]);
        sentinelBuffer[sentinelBuffer.length - 1]["weapon"] =
        {
            name: $(".pi-title span").text().trim(),
            mastery: parseInt($("[data-source='mastery level'] div").text().trim()),
            noiselevel: $("[data-source='noise level'] div").text().trim(),
            fireRate: parseFloat($("[data-source='fire rate'] div").text().trim().match(/[\-\+]?[0-9]+(\.[0-9]+)?/g)),
            accuracy: parseFloat($("[data-source='accuracy'] div").text().trim()),
            magSize: parseInt($("[data-source='magazine'] div").text().trim().match(/[\-\+]?[0-9]+(\.[0-9]+)?/g)),
            reloadSpeed: parseFloat($("[data-source='reload'] div").text().trim().match(/[\-\+]?[0-9]+(\.[0-9]+)?/g)),
            damage: parseFloat($("[data-source='normal damage'] div").text().trim().match(/[\-\+]?[0-9]+(\.[0-9]+)?/g)[0]),
            critChance: parseFloat($("[data-source='normal critical chance'] div").text().trim().match(/[\-\+]?[0-9]+(\.[0-9]+)?/g)),
            critDamage: parseFloat($("[data-source='normal critical damage'] div").text().trim().match(/[\-\+]?[0-9]+(\.[0-9]+)?/g)),
            statusChance: parseFloat($("[data-source='normal status chance'] div").text().trim().match(/[\-\+]?[0-9]+(\.[0-9]+)?/g))
        };
        // Remove 'noiselevel' attribute if it's value is "Alarming"
        if(sentinelBuffer[sentinelBuffer.length - 1].weapon.noiselevel == "Alarming") delete sentinelBuffer[sentinelBuffer.length - 1].weapon.noiselevel;
    }

    return _.sortBy(sentinelBuffer, "name");
}

exports.parseDeltaSentinelData = function(parentBuffer, variantBuffer, variantName)
{
    let deltaBuffer = [];

    // Iterate through Warframes.
    for(var variantIndex = 0; variantIndex < variantBuffer.length; ++variantIndex)
    {
        let variantSentinel = variantBuffer[variantIndex];
        // Find normal version of Warframe variant.
        let parentSentinel = parentBuffer.filter((warframe) => {
            return warframe.name == variantSentinel.name.replace(" " + variantName, "");
        }); console.assert(parentSentinel.length == 1, "ERROR: parseDeltaSentinelData(): Found multiple objects identified as parent of: '" + variantSentinel.name + "'! Identified: " + parentSentinel);
        parentSentinel = parentSentinel[0];

        // Add missing attributes so they don't get ignored in rating.
        for(var warframeAttribute in parentSentinel)
        {
            if(!_.has(parentSentinel, sentinelAttribute)) continue;
            if(!_.has(variantSentinel, sentinelAttribute)) variantSentinel[sentinelAttribute] = undefined;
        }
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

            // The attribute is undefined.
            if(_.isUndefined(variantSentinel[sentinelAttribute]))
            {
                // Missing attribute values are rated as negative change.
                variantSentinel[sentinelAttribute] = [ variantSentinel[sentinelAttribute], "-" ];
                continue;
            }

            // The attribute is new.
            if(!_.has(parentSentinel, warframeAttribute))
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
                // Ignore name changes in the rating.
                if(variantSentinel[sentinelAttribute].replace(variantSentinel.name, "") != parentSentinel[sentinelAttribute].replace(parentSentinel.name, ""))
                {
                    // String modifications can't be rated.
                    variantSentinel[sentinelAttribute] = [ variantSentinel[sentinelAttribute], "m" ];
                }
                continue;
            }

            // Attribute type: number
            if(_.isNumber(variantSentinel[sentinelAttribute])) 
            {
                // Customized (non-default) behavior:
                if(sentinelAttribute == "mastery")
                {
                    // Lower numbers are better.
                    variantSentinel[sentinelAttribute] = [ variantSentinel[sentinelAttribute], ( variantSentinel[sentinelAttribute] > parentSentinel[sentinelAttribute] ? "-" : "+" ) ];
                }
                // Default behavior:
                else
                {
                    // Higher numbers are better.
                    variantSentinel[sentinelAttribute] = [ variantSentinel[sentinelAttribute], ( variantSentinel[sentinelAttribute] > parentSentinel[sentinelAttribute] ? "+" : "-" ) ];
                }
                continue;
            }

            // Attribute type: array
            if(_.isArray(variantSentinel[sentinelAttribute]))
            {
                // The new array is longer.
                if(variantSentinel[sentinelAttribute].length > parentSentinel[sentinelAttribute].length)
                {
                    variantSentinel[sentinelAttribute] = [ variantSentinel[sentinelAttribute], "+" ];
                    continue;
                }
                // The new array is shorter.
                else if(variantSentinel[sentinelAttribute].length < parentSentinel[sentinelAttribute].length) 
                { 
                    variantSentinel[sentinelAttribute] = [ variantSentinel[sentinelAttribute], "-" ];
                    continue;
                } 


                /* The arrays are of the same length: */

                // The changes can't be rated.
                variantSentinel[sentinelAttribute] = [ variantSentinel[sentinelAttribute], "m" ];
                continue;
            }

            // Attribute type: object
            if(_.isObject(variantSentinel[sentinelAttribute]))
            {
                // Iterate through object attributes.
                for(var objectAttribute in variantSentinel[sentinelAttribute])
                {
                    if(!_.has(variantSentinel[sentinelAttribute], objectAttribute)) continue;
                    
                    // The attribute is new
                    if(!_.has(parentSentinel[sentinelAttribute], objectAttribute))
                    {
                        // New attributes are rated as positive change.
                        variantSentinel[sentinelAttribute][objectAttribute] = [ variantSentinel[sentinelAttribute][objectAttribute], "+" ];
                        continue;
                    }
                    
                    // Attribute type: number
                    if(_.isNumber(variantSentinel[sentinelAttribute][objectAttribute]))
                    {
                        if(variantSentinel[sentinelAttribute][objectAttribute] == parentSentinel[sentinelAttribute][objectAttribute]) continue;

                        if(objectAttribute == "mastery" || objectAttribute == "reloadSpeed")
                        {
                            variantSentinel[sentinelAttribute][objectAttribute] = 
                            [
                                variantSentinel[sentinelAttribute][objectAttribute],
                                variantSentinel[sentinelAttribute][objectAttribute] > parentSentinel[sentinelAttribute][objectAttribute] ? "-" : "+"
                            ];
                        }
                        else
                        {
                            variantSentinel[sentinelAttribute][objectAttribute] = 
                            [
                                variantSentinel[sentinelAttribute][objectAttribute],
                                variantSentinel[sentinelAttribute][objectAttribute] > parentSentinel[sentinelAttribute][objectAttribute] ? "+" : "-"
                            ];
                        }
                        continue;
                    }
                }
                continue;
            }

            console.assert(false, "ERROR: parseDeltaSentinelData(): Unhandled attribute type of '" + variantSentinel[sentinelAttribute] + "'");
        }

        variantSentinel["id"] = parentSentinel["id"];
        deltaBuffer.push(variantSentinel);
    }

    return deltaBuffer;
}