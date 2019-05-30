const _ = require('lodash');
const cheerio = require('cheerio');

const MOD_ATTRIBUTE_MAP = [
    { key: "name", newKey: "name" },
    { key: "drops", newKey: "drops" }
];

exports.filterModData = function(inputJSON, inputHTML, modCategories)
{
    let modSource = retrieveModData(inputJSON);
    let modBuffer = [];
    let modNames = [];

    let $ = cheerio.load(inputHTML);
    for(var i = 0; i < modCategories.filter.length; ++i)
    {
        $(".tabbertab[title='" + modCategories.filter[i] + "'] tbody").children().each((index, item) =>
        {
            if(!$(item).is("tr")) return;

            let modName = $(item).find("td").eq(0).find("a").text().trim();
            if(modName != "") modNames.push(modName);
        });
    }

    for(var i = 0; i < modSource.length; ++i)
    {
        if(!modNames.includes(modSource[i].name)) continue;
        let modObject = modSource[i];
        modObject["img"] = "assets/mods/" + modCategories.name.toLowerCase() + "/" + modObject.name + ".webp";

        modBuffer.push(modSource[i]);
    }

    return modBuffer;
}

retrieveModData = function(inputJSON)
{
    let nexusMods = JSON.parse(inputJSON);
    let modBuffer = [];

    for(var i = 0; i < nexusMods.length; ++i)
    {
        let modSource = nexusMods[i];

        let modObject = new Object;
        for(var n = 0; n < MOD_ATTRIBUTE_MAP.length; ++n)
        {
            if(MOD_ATTRIBUTE_MAP[n].key == "drops")
            {
                if(modSource["drops"] == undefined) continue;

                modObject[MOD_ATTRIBUTE_MAP[n].newKey] = [];
                for(var x = 0; x < modSource["drops"].length; ++x)
                {
                    modObject[MOD_ATTRIBUTE_MAP[n].newKey].push(_.omit(modSource["drops"][x], "rarity"));
                }
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