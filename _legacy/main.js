const utils = require('./utils');

const warframeFilters = require('./filters/warframe-filters');
const companionFilters = require('./filters/companion-filters');
const weaponFilters = require('./filters/weapon-filters');
const modFilters = require('./filters/mod-filter');

utils.makeOutputDir();

// Warframes
warframeFilters.retrieveWarframeWebContents((htmlContents, jsonContents) =>
{
    let warframesNormal = warframeFilters.filterWarframeNormalData(htmlContents, jsonContents);
    utils.writeOutputFile("warframes-normal.json", JSON.stringify(warframesNormal));

    let warframesPrime = warframeFilters.filterWarframeVariantData(htmlContents, jsonContents, "Prime");
    warframesPrime = warframeFilters.parseDeltaWarframeData(warframesNormal, warframesPrime, "Prime");
    utils.writeOutputFile("warframes-prime.json", JSON.stringify(warframesPrime));

    let warframesUmbra = warframeFilters.filterWarframeVariantData(htmlContents, jsonContents, "Umbra");
    warframesUmbra = warframeFilters.parseDeltaWarframeData(warframesNormal, warframesUmbra, "Umbra");
    utils.writeOutputFile("warframes-umbra.json", JSON.stringify(warframesUmbra));
});

// Companions: Pets
utils.getWebContentsOf("https://warframe.fandom.com/wiki/Kubrow", (content) =>
{
    let petsKubrows = companionFilters.filterPetNormalData(content);
    utils.writeOutputFile("companions-pets-kubrows.json", JSON.stringify(petsKubrows));
});
utils.getWebContentsOf("https://warframe.fandom.com/wiki/Kavat", (content) =>
{
    let petsKavats = companionFilters.filterPetNormalData(content);
    utils.writeOutputFile("companions-pets-kavats.json", JSON.stringify(petsKavats));
});

// Companions: Sentinels
companionFilters.retrieveSentinelWebContents((contents) => 
{
    let sentinelsNormal = companionFilters.filterSentinelNormalData(contents);
    utils.writeOutputFile("companions-sentinels-normal.json", JSON.stringify(sentinelsNormal));

    let sentinelsPrime = companionFilters.filterSentinelVariantData(contents, "Prime");
    sentinelsPrime = companionFilters.parseDeltaSentinelData(sentinelsNormal, sentinelsPrime, "Prime");
    utils.writeOutputFile("companions-sentinels-prime.json", JSON.stringify(sentinelsPrime));
});

// Weapons
utils.getWebContentsOf("https://wf.snekw.com/weapons-wiki", (content) => 
{
    /* PRIMARY: BOWS */
    let weaponsPrimaryBow = weaponFilters.filterWeaponNormalData(content, "Primary", { name: "Bows", filter: ["Bow", "Crossbow"] });
    utils.writeOutputFile("weapons-primary-bows-normal.json", JSON.stringify(weaponsPrimaryBow));
    let weaponsPrimaryBowPrime = weaponFilters.filterWeaponVariantData(content, "Primary", { name: "Bows", filter: ["Bow", "Crossbow"] }, "Prime");
    weaponsPrimaryBowPrime = weaponFilters.parseDeltaWeaponData(weaponsPrimaryBow, weaponsPrimaryBowPrime, "Prime");
    utils.writeOutputFile("weapons-primary-bows-prime.json", JSON.stringify(weaponsPrimaryBowPrime));

    /* PRIMARY: LAUNCHERS */
    let weaponsPrimaryLaunchers = weaponFilters.filterWeaponNormalData(content, "Primary", { name: "Launchers", filter: ["Launcher"] });
    utils.writeOutputFile("weapons-primary-launchers-normal.json", JSON.stringify(weaponsPrimaryLaunchers));
    let weaponsPrimaryLaunchersPrime = weaponFilters.filterWeaponVariantData(content, "Primary", { name: "Launchers", filter: ["Launcher"] }, "Prime");
    weaponsPrimaryLaunchersPrime = weaponFilters.parseDeltaWeaponData(weaponsPrimaryLaunchers, weaponsPrimaryLaunchersPrime, "Prime");
    utils.writeOutputFile("weapons-primary-launchers-prime.json", JSON.stringify(weaponsPrimaryLaunchersPrime));

    /* PRIMARY: RIFLES */
    let weaponsPrimaryRifles = weaponFilters.filterWeaponNormalData(content, "Primary", { name: "Rifles", filter: ["Rifle", "Speargun"] });
    utils.writeOutputFile("weapons-primary-rifles-normal.json", JSON.stringify(weaponsPrimaryRifles));
    let weaponsPrimaryRiflesPrime = weaponFilters.filterWeaponVariantData(content, "Primary", { name: "Rifles", filter: ["Rifle", "Speargun"] }, "Prime");
    weaponsPrimaryRiflesPrime = weaponFilters.parseDeltaWeaponData(weaponsPrimaryRifles, weaponsPrimaryRiflesPrime, "Prime");
    utils.writeOutputFile("weapons-primary-rifles-prime.json", JSON.stringify(weaponsPrimaryRiflesPrime));

    /* PRIMARY: SHOTGUNS */
    let weaponsPrimaryShotguns = weaponFilters.filterWeaponNormalData(content, "Primary", { name: "Shotguns", filter: ["Shotgun"] });
    utils.writeOutputFile("weapons-primary-shotguns-normal.json", JSON.stringify(weaponsPrimaryShotguns));
    let weaponsPrimaryShotgunsPrime = weaponFilters.filterWeaponVariantData(content, "Primary", { name: "Shotguns", filter: ["Shotgun"] }, "Prime");
    weaponsPrimaryShotgunsPrime = weaponFilters.parseDeltaWeaponData(weaponsPrimaryShotguns, weaponsPrimaryShotgunsPrime, "Prime");
    utils.writeOutputFile("weapons-primary-shotguns-prime.json", JSON.stringify(weaponsPrimaryShotgunsPrime));

    /* PRIMARY: SNIPERS */
    let weaponsPrimarySnipers = weaponFilters.filterWeaponNormalData(content, "Primary", { name: "Snipers", filter: ["Sniper Rifle"] });
    utils.writeOutputFile("weapons-primary-snipers-normal.json", JSON.stringify(weaponsPrimarySnipers));
    let weaponsPrimarySnipersPrime = weaponFilters.filterWeaponVariantData(content, "Primary", { name: "Snipers", filter: ["Sniper Rifle"] }, "Prime");
    weaponsPrimarySnipersPrime = weaponFilters.parseDeltaWeaponData(weaponsPrimarySnipers, weaponsPrimarySnipersPrime, "Prime");
    utils.writeOutputFile("weapons-primary-snipers-prime.json", JSON.stringify(weaponsPrimarySnipersPrime));

    /* SECONDARY: SINGLE */
    let weaponsSecondarySingle = weaponFilters.filterWeaponNormalData(content, "Secondary", { name: "Single", filter: ["Pistol", "Crossbow", "Shotgun Sidearm"] });
    utils.writeOutputFile("weapons-secondary-single-normal.json", JSON.stringify(weaponsSecondarySingle));
    let weaponsSecondarySinglePrime = weaponFilters.filterWeaponVariantData(content, "Secondary", { name: "Single", filter: ["Pistol", "Crossbow", "Shotgun Sidearm"] }, "Prime");
    weaponsSecondarySinglePrime = weaponFilters.parseDeltaWeaponData(weaponsSecondarySingle, weaponsSecondarySinglePrime, "Prime");
    utils.writeOutputFile("weapons-secondary-single-prime.json", JSON.stringify(weaponsSecondarySinglePrime));

    /* SECONDARY: DUAL */
    let weaponsSecondaryDual = weaponFilters.filterWeaponNormalData(content, "Secondary", { name: "Dual", filter: ["Dual Pistols", "Dual Shotguns"] });
    utils.writeOutputFile("weapons-secondary-dual-normal.json", JSON.stringify(weaponsSecondaryDual));
    let weaponsSecondaryDualPrime = weaponFilters.filterWeaponVariantData(content, "Secondary", { name: "Dual", filter: ["Dual Pistols", "Dual Shotguns"] }, "Prime");
    weaponsSecondaryDualPrime = weaponFilters.parseDeltaWeaponData(weaponsSecondaryDual, weaponsSecondaryDualPrime, "Prime");
    utils.writeOutputFile("weapons-secondary-dual-prime.json", JSON.stringify(weaponsSecondaryDualPrime));

    /* SECONDARY: THROWN */
    let weaponsSecondaryThrown = weaponFilters.filterWeaponNormalData(content, "Secondary", { name: "Thrown", filter: ["Thrown"] });
    utils.writeOutputFile("weapons-secondary-thrown-normal.json", JSON.stringify(weaponsSecondaryThrown));
    let weaponsSecondaryThrownPrime = weaponFilters.filterWeaponVariantData(content, "Secondary", { name: "Thrown", filter: ["Thrown"] }, "Prime");
    weaponsSecondaryThrownPrime = weaponFilters.parseDeltaWeaponData(weaponsSecondaryThrown, weaponsSecondaryThrownPrime, "Prime");
    utils.writeOutputFile("weapons-secondary-thrown-prime.json", JSON.stringify(weaponsSecondaryThrownPrime));

    /* MELEE: BRAWLERS */
    let weaponsMeleeBrawler = weaponFilters.filterWeaponNormalData(content, "Melee", { name: "Brawlers", filter: ["Fist", "Sparring", "Claws"] });
    utils.writeOutputFile("weapons-melee-brawlers-normal.json", JSON.stringify(weaponsMeleeBrawler));
    let weaponsMeleeBrawlerPrime = weaponFilters.filterWeaponVariantData(content, "Melee", { name: "Brawlers", filter: ["Fist", "Sparring", "Claws"] }, "Prime");
    weaponsMeleeBrawlerPrime = weaponFilters.parseDeltaWeaponData(weaponsMeleeBrawler, weaponsMeleeBrawlerPrime, "Prime");
    utils.writeOutputFile("weapons-melee-brawlers-prime.json", JSON.stringify(weaponsMeleeBrawlerPrime));

    /* MELEE: DAGGERS */
    let weaponsMeleeDagger = weaponFilters.filterWeaponNormalData(content, "Melee", { name: "Daggers", filter: ["Dagger", "Dual Daggers"] });
    utils.writeOutputFile("weapons-melee-daggers-normal.json", JSON.stringify(weaponsMeleeDagger));
    let weaponsMeleeDaggerPrime = weaponFilters.filterWeaponVariantData(content, "Melee", { name: "Daggers", filter: ["Dagger", "Dual Daggers"] }, "Prime");
    weaponsMeleeDaggerPrime = weaponFilters.parseDeltaWeaponData(weaponsMeleeDagger, weaponsMeleeDaggerPrime, "Prime");
    utils.writeOutputFile("weapons-melee-daggers-prime.json", JSON.stringify(weaponsMeleeDaggerPrime));

    /* MELEE: HEAVY */
    let weaponsMeleeHeavy = weaponFilters.filterWeaponNormalData(content, "Melee", { name: "Heavy", filter: ["Hammer", "Heavy Blade"] });
    utils.writeOutputFile("weapons-melee-heavy-normal.json", JSON.stringify(weaponsMeleeHeavy));
    let weaponsMeleeHeavyPrime = weaponFilters.filterWeaponVariantData(content, "Melee", { name: "Heavy", filter: ["Hammer", "Heavy Blade"] }, "Prime");
    weaponsMeleeHeavyPrime = weaponFilters.parseDeltaWeaponData(weaponsMeleeHeavy, weaponsMeleeHeavyPrime, "Prime");
    utils.writeOutputFile("weapons-melee-heavy-prime.json", JSON.stringify(weaponsMeleeHeavyPrime));

    /* MELEE: MISC */
    let weaponsMeleeMisc = weaponFilters.filterWeaponNormalData(content, "Melee", { name: "Misc", filter: ["Whip", "Tonfa", "Glaive", "Warfan", "Gunblade"] });
    utils.writeOutputFile("weapons-melee-misc-normal.json", JSON.stringify(weaponsMeleeMisc));
    let weaponsMeleeMiscPrime = weaponFilters.filterWeaponVariantData(content, "Melee", { name: "Misc", filter: ["Whip", "Tonfa", "Glaive", "Warfan", "Gunblade"] }, "Prime");
    weaponsMeleeMiscPrime = weaponFilters.parseDeltaWeaponData(weaponsMeleeMisc, weaponsMeleeMiscPrime, "Prime");
    utils.writeOutputFile("weapons-melee-misc-prime.json", JSON.stringify(weaponsMeleeMiscPrime));

    /* MELEE: POLES */
    let weaponsMeleePoles = weaponFilters.filterWeaponNormalData(content, "Melee", { name: "Poles", filter: ["Polearm", "Scythe", "Staff"] });
    utils.writeOutputFile("weapons-melee-poles-normal.json", JSON.stringify(weaponsMeleePoles));
    let weaponsMeleePolesPrime = weaponFilters.filterWeaponVariantData(content, "Melee", { name: "Poles", filter: ["Polearm", "Scythe", "Staff"] }, "Prime");
    weaponsMeleePolesPrime = weaponFilters.parseDeltaWeaponData(weaponsMeleePoles, weaponsMeleePolesPrime, "Prime");
    utils.writeOutputFile("weapons-melee-poles-prime.json", JSON.stringify(weaponsMeleePolesPrime));

    /* MELEE: SWORDS */
    let weaponsMeleeSwords = weaponFilters.filterWeaponNormalData(content, "Melee", { name: "Swords", filter: ["Sword", "Sword and Shield", "Dual Swords", "Rapier", "Blade and Whip", "Machete", "Nikana", "Two-Handed Nikana"] });
    utils.writeOutputFile("weapons-melee-swords-normal.json", JSON.stringify(weaponsMeleeSwords));
    let weaponsMeleeSwordsPrime = weaponFilters.filterWeaponVariantData(content, "Melee", { name: "Swords", filter: ["Sword", "Sword and Shield", "Dual Swords", "Rapier", "Blade and Whip", "Machete", "Nikana", "Two-Handed Nikana"] }, "Prime");
    weaponsMeleeSwordsPrime = weaponFilters.parseDeltaWeaponData(weaponsMeleeSwords, weaponsMeleeSwordsPrime, "Prime");
    utils.writeOutputFile("weapons-melee-swords-prime.json", JSON.stringify(weaponsMeleeSwordsPrime));
});

const MOD_CATEGORIES = [
    { name: "Warframe", filter: ["Warframe"] },
    { name: "Aura", filter: ["Aura"] },
    { name: "Primary", filter: ["Primary"] },
    { name: "Bow", filter: ["Bow"] },
    { name: "Rifle", filter: ["Rifle", "Assault Rifle"] },
    { name: "Shotgun", filter: ["Shotgun"] },
    { name: "Sniper", filter: ["Sniper"] },
    { name: "Pistol", filter: ["Pistol"] },
    { name: "Melee", filter: ["Melee", "Focus Lens"] },
    { name: "Stance", filter: ["Stance"] },
    { name: "Companion", filter: ["Companion"] },
    { name: "Sentinel", filter: ["Sentinel", "Robotic"] },
    { name: "Beast", filter: ["Beast"] },
    { name: "Kubrow", filter: ["Kubrow"] },
    { name: "Kavat", filter: ["Kavat"] },
    { name: "Archwing", filter: ["Archwing", "Archwing Gun", "Archwing Melee"] }
];

// Mods
utils.getWebContentsOf("https://raw.githubusercontent.com/WFCD/warframe-items/development/data/json/Mods.json", (content) => 
{
    let jsonContent = content;
    let htmlContent;
    utils.getWebContentsOf("https://warframe.fandom.com/wiki/Mod", (content) => 
    {
        htmlContent = content;

        for(var i = 0; i < MOD_CATEGORIES.length; ++i)
        {
            let mods = modFilters.filterModData(jsonContent, htmlContent, MOD_CATEGORIES[i]);
            utils.writeOutputFile("mods-" + MOD_CATEGORIES[i].name.toLowerCase() + ".json", JSON.stringify(mods));
        }

        let modsStance = modFilters.filterModData(jsonContent, htmlContent, ["Stance"]);
        utils.writeOutputFile("mods-stance.json", JSON.stringify(modsStance));
    });
});