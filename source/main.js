const utils = require('./utils');

const warframeFilters = require('./filters/warframe-filters');
const companionFilters = require('./filters/companion-filters');
const weaponFilters = require('./filters/weapon-filters');
const modFilters = require('./filters/mod-filter');

// Create output directory.
utils.makeOutputDir();


/* -- WARFRAMES -- */

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


/* -- COMPANIONS -- */

// Pets
utils.getWebContentsOf(["https://warframe.fandom.com/wiki/Kubrow", "https://warframe.fandom.com/wiki/Kavat"], (urls, contents) =>
{
    let petsKubrows = companionFilters.filterPetNormalData(contents[0]);
    utils.writeOutputFile("companions-pets-kubrows.json", JSON.stringify(petsKubrows));

    let petsKavats = companionFilters.filterPetNormalData(contents[1]);
    utils.writeOutputFile("companions-pets-kavats.json", JSON.stringify(petsKavats));
});

// Sentinels
companionFilters.retrieveSentinelWebContents((sentinelContents, weaponContents, primeWeaponContents) => 
{
    let sentinelsNormal = companionFilters.filterSentinelNormalData(sentinelContents, weaponContents);
    utils.writeOutputFile("companions-sentinels-normal.json", JSON.stringify(sentinelsNormal));

    let sentinelsPrime = companionFilters.filterSentinelVariantData(sentinelContents, primeWeaponContents, "Prime");
    sentinelsPrime = companionFilters.parseDeltaSentinelData(sentinelsNormal, sentinelsPrime, "Prime");
    utils.writeOutputFile("companions-sentinels-prime.json", JSON.stringify(sentinelsPrime));
});


/* --- WEAPONS --- */

const WEAPON_SOURCES =
[
    "https://wf.snekw.com/weapons-wiki", 
    "https://raw.githubusercontent.com/WFCD/warframe-items/development/data/json/Primary.json",
    "https://raw.githubusercontent.com/WFCD/warframe-items/development/data/json/Secondary.json",
    "https://raw.githubusercontent.com/WFCD/warframe-items/development/data/json/Melee.json"
];

utils.getWebContentsOf(WEAPON_SOURCES, (urls, contents) => 
{
    /* Primary: Bows */
    let weaponsPrimaryBow = weaponFilters.filterWeaponNormalData(contents, "Primary", { name: "Bows", filter: ["Bow", "Crossbow"] });
    utils.writeOutputFile("weapons-primary-bows-normal.json", JSON.stringify(weaponsPrimaryBow));
    let weaponsPrimaryBowPrime = weaponFilters.filterWeaponVariantData(contents, "Primary", { name: "Bows", filter: ["Bow", "Crossbow"] }, "Prime");
    weaponsPrimaryBowPrime = weaponFilters.parseDeltaWeaponData(weaponsPrimaryBow, weaponsPrimaryBowPrime, "Prime");
    utils.writeOutputFile("weapons-primary-bows-prime.json", JSON.stringify(weaponsPrimaryBowPrime));

    /* Primary: Launchers */
    let weaponsPrimaryLaunchers = weaponFilters.filterWeaponNormalData(contents, "Primary", { name: "Launchers", filter: ["Launcher"] });
    utils.writeOutputFile("weapons-primary-launchers-normal.json", JSON.stringify(weaponsPrimaryLaunchers));
    let weaponsPrimaryLaunchersPrime = weaponFilters.filterWeaponVariantData(contents, "Primary", { name: "Launchers", filter: ["Launcher"] }, "Prime");
    weaponsPrimaryLaunchersPrime = weaponFilters.parseDeltaWeaponData(weaponsPrimaryLaunchers, weaponsPrimaryLaunchersPrime, "Prime");
    utils.writeOutputFile("weapons-primary-launchers-prime.json", JSON.stringify(weaponsPrimaryLaunchersPrime));

    /* Primary: Rifles */
    let weaponsPrimaryRifles = weaponFilters.filterWeaponNormalData(contents, "Primary", { name: "Rifles", filter: ["Rifle", "Speargun"] });
    utils.writeOutputFile("weapons-primary-rifles-normal.json", JSON.stringify(weaponsPrimaryRifles));
    let weaponsPrimaryRiflesPrime = weaponFilters.filterWeaponVariantData(contents, "Primary", { name: "Rifles", filter: ["Rifle", "Speargun"] }, "Prime");
    weaponsPrimaryRiflesPrime = weaponFilters.parseDeltaWeaponData(weaponsPrimaryRifles, weaponsPrimaryRiflesPrime, "Prime");
    utils.writeOutputFile("weapons-primary-rifles-prime.json", JSON.stringify(weaponsPrimaryRiflesPrime));

    /* Primary: Shotguns */
    let weaponsPrimaryShotguns = weaponFilters.filterWeaponNormalData(contents, "Primary", { name: "Shotguns", filter: ["Shotgun"] });
    utils.writeOutputFile("weapons-primary-shotguns-normal.json", JSON.stringify(weaponsPrimaryShotguns));
    let weaponsPrimaryShotgunsPrime = weaponFilters.filterWeaponVariantData(contents, "Primary", { name: "Shotguns", filter: ["Shotgun"] }, "Prime");
    weaponsPrimaryShotgunsPrime = weaponFilters.parseDeltaWeaponData(weaponsPrimaryShotguns, weaponsPrimaryShotgunsPrime, "Prime");
    utils.writeOutputFile("weapons-primary-shotguns-prime.json", JSON.stringify(weaponsPrimaryShotgunsPrime));

    /* Primary: Snipers */
    let weaponsPrimarySnipers = weaponFilters.filterWeaponNormalData(contents, "Primary", { name: "Snipers", filter: ["Sniper Rifle"] });
    utils.writeOutputFile("weapons-primary-snipers-normal.json", JSON.stringify(weaponsPrimarySnipers));
    let weaponsPrimarySnipersPrime = weaponFilters.filterWeaponVariantData(contents, "Primary", { name: "Snipers", filter: ["Sniper Rifle"] }, "Prime");
    weaponsPrimarySnipersPrime = weaponFilters.parseDeltaWeaponData(weaponsPrimarySnipers, weaponsPrimarySnipersPrime, "Prime");
    utils.writeOutputFile("weapons-primary-snipers-prime.json", JSON.stringify(weaponsPrimarySnipersPrime));

    /* Secondary: Single */
    let weaponsSecondarySingle = weaponFilters.filterWeaponNormalData(contents, "Secondary", { name: "Single", filter: ["Pistol", "Crossbow", "Shotgun Sidearm"] });
    utils.writeOutputFile("weapons-secondary-single-normal.json", JSON.stringify(weaponsSecondarySingle));
    let weaponsSecondarySinglePrime = weaponFilters.filterWeaponVariantData(contents, "Secondary", { name: "Single", filter: ["Pistol", "Crossbow", "Shotgun Sidearm"] }, "Prime");
    weaponsSecondarySinglePrime = weaponFilters.parseDeltaWeaponData(weaponsSecondarySingle, weaponsSecondarySinglePrime, "Prime");
    utils.writeOutputFile("weapons-secondary-single-prime.json", JSON.stringify(weaponsSecondarySinglePrime));

    /* Secondary: Dual */
    let weaponsSecondaryDual = weaponFilters.filterWeaponNormalData(contents, "Secondary", { name: "Dual", filter: ["Dual Pistols", "Dual Shotguns"] });
    utils.writeOutputFile("weapons-secondary-dual-normal.json", JSON.stringify(weaponsSecondaryDual));
    let weaponsSecondaryDualPrime = weaponFilters.filterWeaponVariantData(contents, "Secondary", { name: "Dual", filter: ["Dual Pistols", "Dual Shotguns"] }, "Prime");
    weaponsSecondaryDualPrime = weaponFilters.parseDeltaWeaponData(weaponsSecondaryDual, weaponsSecondaryDualPrime, "Prime");
    utils.writeOutputFile("weapons-secondary-dual-prime.json", JSON.stringify(weaponsSecondaryDualPrime));

    /* Secondary: Thrown */
    let weaponsSecondaryThrown = weaponFilters.filterWeaponNormalData(contents, "Secondary", { name: "Thrown", filter: ["Thrown"] });
    utils.writeOutputFile("weapons-secondary-thrown-normal.json", JSON.stringify(weaponsSecondaryThrown));
    let weaponsSecondaryThrownPrime = weaponFilters.filterWeaponVariantData(contents, "Secondary", { name: "Thrown", filter: ["Thrown"] }, "Prime");
    weaponsSecondaryThrownPrime = weaponFilters.parseDeltaWeaponData(weaponsSecondaryThrown, weaponsSecondaryThrownPrime, "Prime");
    utils.writeOutputFile("weapons-secondary-thrown-prime.json", JSON.stringify(weaponsSecondaryThrownPrime));

    /* Melee: Brawlers */
    let weaponsMeleeBrawler = weaponFilters.filterWeaponNormalData(contents, "Melee", { name: "Brawlers", filter: ["Fist", "Sparring", "Claws"] });
    utils.writeOutputFile("weapons-melee-brawlers-normal.json", JSON.stringify(weaponsMeleeBrawler));
    let weaponsMeleeBrawlerPrime = weaponFilters.filterWeaponVariantData(contents, "Melee", { name: "Brawlers", filter: ["Fist", "Sparring", "Claws"] }, "Prime");
    weaponsMeleeBrawlerPrime = weaponFilters.parseDeltaWeaponData(weaponsMeleeBrawler, weaponsMeleeBrawlerPrime, "Prime");
    utils.writeOutputFile("weapons-melee-brawlers-prime.json", JSON.stringify(weaponsMeleeBrawlerPrime));

    /* Melee: Daggers */
    let weaponsMeleeDagger = weaponFilters.filterWeaponNormalData(contents, "Melee", { name: "Daggers", filter: ["Dagger", "Dual Daggers"] });
    utils.writeOutputFile("weapons-melee-daggers-normal.json", JSON.stringify(weaponsMeleeDagger));
    let weaponsMeleeDaggerPrime = weaponFilters.filterWeaponVariantData(contents, "Melee", { name: "Daggers", filter: ["Dagger", "Dual Daggers"] }, "Prime");
    weaponsMeleeDaggerPrime = weaponFilters.parseDeltaWeaponData(weaponsMeleeDagger, weaponsMeleeDaggerPrime, "Prime");
    utils.writeOutputFile("weapons-melee-daggers-prime.json", JSON.stringify(weaponsMeleeDaggerPrime));

    /* Melee: Heavy */
    let weaponsMeleeHeavy = weaponFilters.filterWeaponNormalData(contents, "Melee", { name: "Heavy", filter: ["Hammer", "Heavy Blade"] });
    utils.writeOutputFile("weapons-melee-heavy-normal.json", JSON.stringify(weaponsMeleeHeavy));
    let weaponsMeleeHeavyPrime = weaponFilters.filterWeaponVariantData(contents, "Melee", { name: "Heavy", filter: ["Hammer", "Heavy Blade"] }, "Prime");
    weaponsMeleeHeavyPrime = weaponFilters.parseDeltaWeaponData(weaponsMeleeHeavy, weaponsMeleeHeavyPrime, "Prime");
    utils.writeOutputFile("weapons-melee-heavy-prime.json", JSON.stringify(weaponsMeleeHeavyPrime));

    /* Melee: Misc */
    let weaponsMeleeMisc = weaponFilters.filterWeaponNormalData(contents, "Melee", { name: "Misc", filter: ["Whip", "Tonfa", "Glaive", "Warfan", "Gunblade"] });
    utils.writeOutputFile("weapons-melee-misc-normal.json", JSON.stringify(weaponsMeleeMisc));
    let weaponsMeleeMiscPrime = weaponFilters.filterWeaponVariantData(contents, "Melee", { name: "Misc", filter: ["Whip", "Tonfa", "Glaive", "Warfan", "Gunblade"] }, "Prime");
    weaponsMeleeMiscPrime = weaponFilters.parseDeltaWeaponData(weaponsMeleeMisc, weaponsMeleeMiscPrime, "Prime");
    utils.writeOutputFile("weapons-melee-misc-prime.json", JSON.stringify(weaponsMeleeMiscPrime));

    /* Melee: Poles */
    let weaponsMeleePoles = weaponFilters.filterWeaponNormalData(contents, "Melee", { name: "Poles", filter: ["Polearm", "Scythe", "Staff"] });
    utils.writeOutputFile("weapons-melee-poles-normal.json", JSON.stringify(weaponsMeleePoles));
    let weaponsMeleePolesPrime = weaponFilters.filterWeaponVariantData(contents, "Melee", { name: "Poles", filter: ["Polearm", "Scythe", "Staff"] }, "Prime");
    weaponsMeleePolesPrime = weaponFilters.parseDeltaWeaponData(weaponsMeleePoles, weaponsMeleePolesPrime, "Prime");
    utils.writeOutputFile("weapons-melee-poles-prime.json", JSON.stringify(weaponsMeleePolesPrime));

    /* Melee: Swords */
    let weaponsMeleeSwords = weaponFilters.filterWeaponNormalData(contents, "Melee", { name: "Swords", filter: ["Sword", "Sword and Shield", "Dual Swords", "Rapier", "Blade and Whip", "Machete", "Nikana", "Two-Handed Nikana"] });
    utils.writeOutputFile("weapons-melee-swords-normal.json", JSON.stringify(weaponsMeleeSwords));
    let weaponsMeleeSwordsPrime = weaponFilters.filterWeaponVariantData(contents, "Melee", { name: "Swords", filter: ["Sword", "Sword and Shield", "Dual Swords", "Rapier", "Blade and Whip", "Machete", "Nikana", "Two-Handed Nikana"] }, "Prime");
    weaponsMeleeSwordsPrime = weaponFilters.parseDeltaWeaponData(weaponsMeleeSwords, weaponsMeleeSwordsPrime, "Prime");
    utils.writeOutputFile("weapons-melee-swords-prime.json", JSON.stringify(weaponsMeleeSwordsPrime));
});


/* ---- MODS ---- */

const MOD_CATEGORIES =
[
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
    { name: "Beast", filter: ["Beast"] },
    { name: "Archwing", filter: ["Archwing", "Archwing Gun", "Archwing Melee"] }
];

const MOD_SOURCES =
[
    "https://raw.githubusercontent.com/WFCD/warframe-items/development/data/json/Mods.json",
    "https://warframe.fandom.com/wiki/Mod"
];

utils.getWebContentsOf(MOD_SOURCES, (urls, contents) => 
{
    for(var i = 0; i < MOD_CATEGORIES.length; ++i)
    {
        let mods = modFilters.filterModsByCategory(contents[0], contents[1], MOD_CATEGORIES[i]);
        utils.writeOutputFile("mods-" + MOD_CATEGORIES[i].name.toLowerCase() + ".json", JSON.stringify(mods));
    }

    let modsAugment = modFilters.filterAugmentMods(contents[0], contents[1]);
    utils.writeOutputFile("mods-augment.json", JSON.stringify(modsAugment));

    let modsCompanion = modFilters.filterCompanionMods(contents[0], contents[1]);
    utils.writeOutputFile("mods-companion.json", JSON.stringify(modsCompanion));

    let modsSentinel = modFilters.filterSentinelMods(contents[0], contents[1]);
    utils.writeOutputFile("mods-sentinel.json", JSON.stringify(modsSentinel));

    let modsKavat = modFilters.filterKavatMods(contents[0], contents[1]);
    utils.writeOutputFile("mods-kavat.json", JSON.stringify(modsKavat));

    let modsKubrow = modFilters.filterKubrowMods(contents[0], contents[1]);
    utils.writeOutputFile("mods-kubrow.json", JSON.stringify(modsKubrow));
});