const _ = require('lodash');
const cheerio = require('cheerio');

const MOD_ATTRIBUTE_MAP = [
    { key: "name", newKey: "name" },
    { key: "drops", newKey: "drops" }
];

exports.filterModsByCategory = function(inputJSON, inputHTML, category)
{
    let modSource = retrieveModData(inputJSON);
    let modBuffer = [];
    let whitelist = [];

    // Fetch whitelist data.
    let $ = cheerio.load(inputHTML);
    for(var i = 0; i < category.filter.length; ++i)
    {
        $(".tabbertab[title='" + category.filter[i] + "'] tbody").children().each((index, element) =>
        {
            let name = $(element).find("td").eq(0).find("a").text().trim();
            if(!_.isEmpty(name)) whitelist.push({ name: name });
        });
    }

    // Retrieve whitelisted mods.
    for(var i = 0; i < whitelist.length; ++i)
    {
        let sourceIndex = modSource.map(e => e.name.toLowerCase()).indexOf(whitelist[i].name.toLowerCase());
        if(sourceIndex == -1)
        {
            console.log("WARNING: filterModsByCategory(): Couldn't find source for mod '" + whitelist[i].name + "'");
            continue;
        }

        // Copy mod data.
        let modObject = modSource[sourceIndex];
        // Add custom attributes.
        modObject["img"] = "assets/mods/" + category.name.toLowerCase() + "/" + modObject.name + ".webp";
        
        modBuffer.push(modObject);
    }

    return modBuffer;
}

exports.filterAugmentMods = function(inputJSON, inputHTML)
{
    let modSource = retrieveModData(inputJSON);
    let modBuffer = [];
    let whitelist = [];

    // Fetch whitelist data.
    let $ = cheerio.load(inputHTML);
    $(".tabbertab[title='PvE'] tbody tr").each((index, element) =>
    {
        let parentWarframe = $(element).find("td a").eq(0).text().trim();
        
        $(element).find("td span a").each((index, element) =>
        {
            let name = $(element).text().trim();
            if(!_.isEmpty(name)) whitelist.push({ name: name, parentWarframe: parentWarframe });
        });
    });

    // Retrieve whitelisted mods.
    for(var i = 0; i < whitelist.length; ++i)
    {
        let sourceIndex = modSource.map(e => e.name.toLowerCase()).indexOf(whitelist[i].name.toLowerCase());
        if(sourceIndex == -1)
        {
            console.log("WARNING: filterAugmentMods(): Couldn't find source for mod '" + whitelist[i].name + "'");
            continue;
        }

        // Copy mod data.
        let modObject = modSource[sourceIndex];
        // Add custom attributes.
        modObject["img"] = "assets/mods/augments/" + whitelist[i].parentWarframe.toLowerCase() + "/" + modObject.name + ".webp";
        modObject.name = modObject.name + " (" + whitelist[i].parentWarframe + ")";
        
        modBuffer.push(modObject);
    }

    return modBuffer;
}

exports.filterCompanionMods = function(inputJSON, inputHTML)
{
    let modSource = retrieveModData(inputJSON);
    let modBuffer = [];
    let whitelist = [];

    // Fetch whitelist data.
    let $ = cheerio.load(inputHTML);
    $(".tabbertab[title='Companion'] tbody").children().each((index, element) =>
    {
        let name = $(element).find("td").eq(0).find("a").text().trim();
        let isNonSentinel = $(element).find("span[style='color: darkviolet;']").length != 0;

        if(!_.isEmpty(name)) whitelist.push({ name: name, isNonSentinel: isNonSentinel });
    });

    // Retrieve whitelisted mods.
    for(var i = 0; i < whitelist.length; ++i)
    {
        let sourceIndex = modSource.map(e => e.name.toLowerCase()).indexOf(whitelist[i].name.toLowerCase());
        if(sourceIndex == -1)
        {
            console.log("WARNING: filterCompanionMods(): Couldn't find source for mod '" + whitelist[i].name + "'");
            continue;
        }

        // Copy mod data.
        let modObject = modSource[sourceIndex];
        // Add custom attributes.
        modObject["img"] = "assets/mods/companion/" + modObject.name + ".webp";
        if(whitelist[i].isNonSentinel) modObject["isNonSentinel"] = true;
        
        modBuffer.push(modObject);
    }

    return modBuffer;
}

exports.filterSentinelMods = function(inputJSON, inputHTML)
{
    let modSource = retrieveModData(inputJSON);
    let modBuffer = [];
    let whitelist = [];

    // Fetch whitelist data.
    let $ = cheerio.load(inputHTML);
    $(".tabbertab[title='Sentinel'] tbody tr").each((index, element) =>
    {
        let parentSentinel = $(element).find("td").eq(2).text().trim();
        
        $(element).find("td span a").each((index, element) =>
        {
            let name = $(element).text().trim();
            if(!_.isEmpty(name)) whitelist.push({ name: name, parentSentinel: parentSentinel });
        });
    });

    // Retrieve whitelisted mods.
    for(var i = 0; i < whitelist.length; ++i)
    {
        let sourceIndex = modSource.map(e => e.name.toLowerCase()).indexOf(whitelist[i].name.toLowerCase());
        if(sourceIndex == -1)
        {
            console.log("WARNING: filterSentinelMods(): Couldn't find source for mod '" + whitelist[i].name + "'");
            continue;
        }

        // Copy mod data.
        let modObject = modSource[sourceIndex];
        // Add custom attributes.
        modObject["img"] = "assets/mods/sentinel/" + modObject.name + ".webp";
        modObject["parentSentinel"] = whitelist[i].parentSentinel;
        
        modBuffer.push(modObject);
    }

    // Sort by parent sentinel.
    modBuffer = _.sortBy(modBuffer, [(elem) => {
        // Give 'any' priority in sorting.
        if(elem.parentSentinel == "Any") return 0;
        else return 1;
    }, "parentSentinel"]);

    // Remove 'parentSentinel' attribute.
    modBuffer.forEach(e => delete e.parentSentinel);

    return modBuffer;
}

exports.filterKavatMods = function(inputJSON, inputHTML)
{
    let modSource = retrieveModData(inputJSON);
    let modBuffer = [];
    let whitelist = [];

    // Fetch whitelist data.
    let $ = cheerio.load(inputHTML);
    $(".tabbertab[title='Kavat'] tbody tr").each((index, element) =>
    {
        let parentKavat = $(element).find("td").eq(2).text().trim();
        
        $(element).find("td span a").each((index, element) =>
        {
            let name = $(element).text().trim();
            if(!_.isEmpty(name)) whitelist.push({ name: name, parentKavat: parentKavat });
        });
    });

    // Retrieve whitelisted mods.
    for(var i = 0; i < whitelist.length; ++i)
    {
        let sourceIndex = modSource.map(e => e.name.toLowerCase()).indexOf(whitelist[i].name.toLowerCase());
        if(sourceIndex == -1)
        {
            console.log("WARNING: filterKavatMods(): Couldn't find source for mod '" + whitelist[i].name + "'");
            continue;
        }

        // Copy mod data.
        let modObject = modSource[sourceIndex];
        // Add custom attributes.
        modObject["img"] = "assets/mods/kavat/" + modObject.name + ".webp";
        modObject["parentKavat"] = whitelist[i].parentKavat;
        
        modBuffer.push(modObject);
    }

    // Sort by parent kavat.
    modBuffer = _.sortBy(modBuffer, [(elem) => {
        // Give 'any' priority in sorting.
        if(elem.parentKavat == "Any") return 0;
        else return 1;
    }, "parentKavat"]);

    // Remove 'parentKavat' attribute.
    modBuffer.forEach(e => delete e.parentKavat);

    return modBuffer;
}

exports.filterKubrowMods = function(inputJSON, inputHTML)
{
    let modSource = retrieveModData(inputJSON);
    let modBuffer = [];
    let whitelist = [];

    // Fetch whitelist data.
    let $ = cheerio.load(inputHTML);
    $(".tabbertab[title='Kubrow'] tbody tr").each((index, element) =>
    {
        let parentKubrow = $(element).find("td").eq(2).text().trim();
        
        $(element).find("td span a").each((index, element) =>
        {
            let name = $(element).text().trim();
            if(!_.isEmpty(name)) whitelist.push({ name: name, parentKubrow: parentKubrow });
        });
    });

    // Retrieve whitelisted mods.
    for(var i = 0; i < whitelist.length; ++i)
    {
        let sourceIndex = modSource.map(e => e.name.toLowerCase()).indexOf(whitelist[i].name.toLowerCase());
        if(sourceIndex == -1)
        {
            console.log("WARNING: filterKubrowMods(): Couldn't find source for mod '" + whitelist[i].name + "'");
            continue;
        }

        // Copy mod data.
        let modObject = modSource[sourceIndex];
        // Add custom attributes.
        modObject["img"] = "assets/mods/kubrow/" + modObject.name + ".webp";
        modObject["parentKubrow"] = whitelist[i].parentKubrow;
        
        modBuffer.push(modObject);
    }

    // Sort by parent kubrow.
    modBuffer = _.sortBy(modBuffer, [(elem) => {
        // Give 'any' priority in sorting.
        if(elem.parentKubrow == "Any") return 0;
        else return 1;
    }, "parentKubrow"]);

    // Remove 'parentKubrow' attribute.
    modBuffer.forEach(e => delete e.parentKubrow);

    return modBuffer;
}

retrieveModData = function(inputJSON)
{
    let nexusMods = JSON.parse(inputJSON);
    let modBuffer = [];

    for(var i = 0; i < nexusMods.length; ++i)
    {
        let modSource = nexusMods[i];

        // Remove damaged mods.
        if(modSource.uniqueName.includes("Beginner/")) continue;

        let modObject = new Object;

        // Iterate through mod attributes.
        for(var n = 0; n < MOD_ATTRIBUTE_MAP.length; ++n)
        {
            // Parse drop information.
            if(MOD_ATTRIBUTE_MAP[n].key == "drops")
            {
                if(!_.has(modSource, "drops")) continue;

                modObject["enemyDrops"] = [];
                modObject["missionDrops"] = [];
                modObject["questDrops"] = [];

                for(var x = 0; x < modSource.drops.length; ++x)
                {
                    // Convert drop chance into percentages.
                    modSource.drops[x].chance = _.round(modSource.drops[x].chance * 100, 2);

                    // Categorize drop locations.
                    switch(modSource.drops[x].type)
                    {
                        case "Enemy Mod Tables":
                            modObject.enemyDrops.push(_.omit(modSource.drops[x], ["type", "rarity"]));
                            break;
                        case "Mission Rewards":
                        case "Transient Rewards":
                        case "Cetus Bounty Rewards":
                        case "Solaris Bounty Rewards":
                            modObject.missionDrops.push(_.omit(modSource.drops[x], ["type", "rarity"]));
                            break;
                        case "Key Rewards":
                            modObject.questDrops.push(_.omit(modSource.drops[x], ["type", "rarity"]));
                            break;
                        default:
                            console.log("WARNING: Unindexed mod drop type '" + modSource.drops[x].type + "' of '" + modSource.name + "'.");
                            break;
                    }
                }
                if(_.isEmpty(modObject.enemyDrops)) delete modObject.enemyDrops;
                if(_.isEmpty(modObject.missionDrops)) delete modObject.missionDrops;
                if(_.isEmpty(modObject.questDrops)) delete modObject.questDrops;
            }
            else
            {
                modObject[MOD_ATTRIBUTE_MAP[n].newKey] = modSource[MOD_ATTRIBUTE_MAP[n].key];
            }
        }

        modBuffer.push(modObject);
    }

    return modBuffer;
}