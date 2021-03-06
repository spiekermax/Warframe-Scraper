const _ = require('lodash');

const KNOWN_VARIANTS = [
    "Prime",
    "Umbra"
];

const WEAPON_ATTRIBUTE_MAP = [
    { key: "Name", altKey: "name", newKey: "name" },
    { key: "Mastery", altKey: "masteryReq", newKey: "mastery" },
    { key: "MaxAmmo", altKey: "ammo", newKey: "maxAmmo" },
    { key: "NoiseLevel", altKey: "noise", newKey: "noiselevel" },
    { key: "Trigger", altKey: undefined, newKey: "triggerType" }, // <- 'altKey' exists but it's related data is useless.
    { key: "Accuracy", altKey: "accuracy", newKey: "accuracy" },
    { key: "Reload", altKey: "reloadTime", newKey: "reloadSpeed" },
    { key: "Magazine", altKey: "magazineSize", newKey: "magSize" },
    { key: "FinisherDamage", altKey: undefined, newKey: "finisherDamage" },
    { key: "BlockResist", altKey: undefined, newKey: "blockResist" },
    { key: "Polarities", altKey: "polarities", newKey: "polarities" },
    { key: "StancePolarity", altKey: "stancePolarity", newKey: "stancePolarity" }
];

const POLARITIES_MAP = [
    { key: "Bar", newKey: "naramon" },
    { key: "V", newKey: "madurai" },
    { key: "D", newKey: "vazarin" },
    { key: "Ability", newKey: "zenurik" },
    { key: "Zenurik", newKey: "zenurik" },
    { key: "R", newKey: "unairu" },
    { key: "Y", newKey: "penjaga" },
    { key: "U", newKey: "umbra" }
];

const NO_COMPARE_ATTRIBUTES = [
    "name",
    "img",
    "id"
];

const ATTACK_ATTRIBUTE_MAP = [
    { key: "AttackName", newKey: "attackName" },
    { key: "Damage", newKey: "damage" },
    { key: "Radius", newKey: "radius" },
    { key: "PunchThrough", newKey: "punchThrough" },
    { key: "ChargeTime", newKey: "chargeTime" },
    { key: "CritChance", newKey: "critChance" },
    { key: "CritMultiplier", newKey: "critDamage" },
    { key: "StatusChance", newKey: "statusChance" },
    { key: "ShotType", newKey: "shotType" },
    { key: "ShotSpeed", newKey: "shotSpeed" },
    { key: "FireRate", newKey: "fireRate" },
    { key: "NoiseLevel", newKey: "noiselevel" },
    { key: "Duration", newKey: "duration" },
    { key: "PelletName", newKey: "pelletName" },
    { key: "PelletCount", newKey: "pelletCount" },
    { key: "Range", newKey: "range" },
    { key: "Trigger", newKey: "triggerType" },
    { key: "Accuracy", newKey: "accuracy" },
    { key: "Reload", newKey: "reloadSpeed" },
    { key: "AmmoCost", newKey: "ammoCost" },
    { key: "BurstCount", newKey: "bulletCount" }
];

const ATTACK_TYPE_ORDER = [
    "Normal",
    "Charge",
    "Throw",
    "Charged Throw",
    "Secondary",
    "Area",
    "Secondary Area",
    "Jump",
    "Slide",
    "Wall"
];

exports.filterWeaponNormalData = function(inputJSONs, weaponCategory, weaponClasses)
{
    let snewksWeapons = JSON.parse(inputJSONs[0]).data.Weapons;
    let nexusHubWeapons = _.union(JSON.parse(inputJSONs[1]), JSON.parse(inputJSONs[2]), JSON.parse(inputJSONs[3]));
    let weaponBuffer = [];
    
    // Iterate through weapons.
    for(var weaponKey in snewksWeapons)
    {
        if(!_.has(snewksWeapons, weaponKey)) continue;

        let weaponSource = snewksWeapons[weaponKey];
        let altWeaponSource = nexusHubWeapons.find(weapon => weapon.name == weaponSource.Name);

        if(KNOWN_VARIANTS.some(variant => weaponSource.Name.includes(variant))) continue;
        if(weaponSource.Type != weaponCategory || !weaponClasses.filter.some(weaponClass => weaponSource.Class == weaponClass)) continue;


        // Weapon: Load & Translate everything except attacks.
        let weaponObject = new Object;
        for(var i = 0; i < WEAPON_ATTRIBUTE_MAP.length; ++i)
        {
            if(!_.has(weaponSource, WEAPON_ATTRIBUTE_MAP[i].key))
            {
                // Check if the alternative weapon sourced provides data for the missing attribute.
                if(!_.has(altWeaponSource, WEAPON_ATTRIBUTE_MAP[i].altKey)) /*console.log("WARNING: Could not find '" + WEAPON_ATTRIBUTE_MAP[i].newKey + "' source data for '" + weaponSource.Name + "'")*/;
                else if(WEAPON_ATTRIBUTE_MAP[i].altKey != undefined && !_.isEmpty(altWeaponSource[WEAPON_ATTRIBUTE_MAP[i].altKey]))
                {
                    // Skip the 'noiselevel' attribute for melee weapons, since it'S redundant.
                    if(weaponSource.Type == "Melee" && WEAPON_ATTRIBUTE_MAP[i].key == "NoiseLevel") continue;
                    
                    weaponObject[WEAPON_ATTRIBUTE_MAP[i].newKey] = altWeaponSource[WEAPON_ATTRIBUTE_MAP[i].altKey];
                    console.log("WARNING: Using alternative attribute data for '" + WEAPON_ATTRIBUTE_MAP[i].newKey + "' of '" + weaponSource.Name + "'");
                }
                continue;
            }

            // Custom (non-default) behavior:
            if(WEAPON_ATTRIBUTE_MAP[i].key == "BlockResist")
            {
                // Transform attribute names and convert values into percentages.
                weaponObject[WEAPON_ATTRIBUTE_MAP[i].newKey] = _.round(weaponSource["BlockResist"] * 100, 2);
            }
            // Default behavior:
            else
            {
                // Copy values and transform attribute names.
                weaponObject[WEAPON_ATTRIBUTE_MAP[i].newKey] = weaponSource[WEAPON_ATTRIBUTE_MAP[i].key];
            }
        }

        // Attacks: Load & Translate attack objects.
        let weaponAttacks = [];
        for(weaponAttribute in weaponSource)
        {
            if(!weaponAttribute.includes("Attack")) continue;

            let attackObject;
            // The attack attribute is already an object.
            if(_.isObject(weaponSource[weaponAttribute]))
            {
                attackObject = weaponSource[weaponAttribute];
            }
            // The attack attribute is no object.
            else
            {
                // Take care of attributes that originally only provided a damage number
                // and this weren't wrapped in an object.
                attackObject = new Object;
                attackObject["Damage"] = weaponSource[weaponAttribute];
            }

            // Attacks: Attribute translation
            for(attackAttribute in attackObject)
            {
                if(!ATTACK_ATTRIBUTE_MAP.map(elem => elem.key).includes(attackAttribute)) 
                {
                    console.log("WARNING: filterWeaponNormalData(): New unindexed attack attribute: " + attackAttribute);
                    delete attackObject[attackAttribute];
                    continue;
                }

                // Custom (non-default) behavior:
                if(weaponCategory == "Melee" && attackAttribute == "FireRate")
                {
                    // Rename 'FireRate' to 'attackSpeed', since the weapon is no gun.
                    attackObject["attackSpeed"] = attackObject["FireRate"];
                    delete attackObject["FireRate"];
                }
                else if(attackAttribute == "CritChance" || attackAttribute == "StatusChance")
                {
                    let translationIndex = ATTACK_ATTRIBUTE_MAP.map(elem => elem.key).indexOf(attackAttribute);
                    attackObject[ATTACK_ATTRIBUTE_MAP[translationIndex].newKey] = _.round(attackObject[attackAttribute] * 100, 2);
                    delete attackObject[attackAttribute];
                }
                // Default behavior:
                else
                {
                    let translationIndex = ATTACK_ATTRIBUTE_MAP.map(elem => elem.key).indexOf(attackAttribute);
                    attackObject[ATTACK_ATTRIBUTE_MAP[translationIndex].newKey] = attackObject[attackAttribute];
                    delete attackObject[attackAttribute];
                }
            }

            // Attacks: Retrieve attack type from original attribute name.
            attackObject["attackType"] = weaponAttribute.replace("Attack", "").replace(/([a-z](?=[A-Z]))/g, "$1 ");

            weaponAttacks.push(attackObject);
        }
        // Attacks: Sorting
        weaponAttacks = _.sortBy(weaponAttacks, ["attackType"]); // Alphabetical sorting fallback
        weaponAttacks = _.sortBy(weaponAttacks, (attack) =>
        {
            if(!ATTACK_TYPE_ORDER.includes(attack.attackType))
            {
                console.log("WARNING: filterWeaponNormalData(): New unordered attack type: " + attack.attackType);
                return 0;
            }
            return ATTACK_TYPE_ORDER.indexOf(attack.attackType);
        });

        // Weapon: Add customized attributes
        weaponObject["id"] = parseInt(_.uniqueId());
        weaponObject["img"] = "assets/weapons/" + weaponCategory.toLowerCase() + "/" + weaponClasses.name.toLowerCase() + "/" + weaponObject.name.replace("MK1-", "") + ".webp";
        weaponObject["attacks"] = weaponAttacks;

        // Accuracy: Transform data string into array.
        if(/[\-\+]?[0-9]+(\.[0-9]+)? \([\-\+]?[0-9]+(\.[0-9]+)? aimed|Aimed|when aimed\)/g.test(weaponObject.accuracy)) weaponObject.accuracy = [ 
            parseFloat(weaponObject.accuracy.match(/[\-\+]?[0-9]+(\.[0-9]+)?/g)[0]), 
            parseFloat(weaponObject.accuracy.match(/[\-\+]?[0-9]+(\.[0-9]+)?/g)[1]) 
        ];

        // Weapon: Polarities translation
        if(_.has(weaponObject, "polarities"))
        {
            for(var i = 0; i < weaponObject.polarities.length; ++i)
            {
                let translationIndex = POLARITIES_MAP.map(elem => elem.key).indexOf(weaponObject.polarities[i]);

                if(translationIndex != -1) weaponObject.polarities[i] = POLARITIES_MAP[translationIndex].newKey;
                else console.log("WARNING: '" + weaponObject.polarities[i] + "' polarity could'nt be translated!");
            }
        }

        // Weapon: Stance polarity translation
        if(_.has(weaponObject, "stancePolarity"))
        {
            let translationIndex = POLARITIES_MAP.map(elem => elem.key).indexOf(weaponObject.stancePolarity);

            if(translationIndex != -1) weaponObject.stancePolarity = POLARITIES_MAP[translationIndex].newKey;
            else console.log("WARNING: '" + weaponObject.stancePolarity + "' polarity could'nt be translated!");
        }

        // Weapon: Remove 'noiselevel' attribute if it's value is "Alarming"
        if(weaponObject.noiselevel == "Alarming") delete weaponObject.noiselevel;

        weaponBuffer.push(weaponObject);
    }

    return _.sortBy(weaponBuffer, ["name"]);
}

exports.filterWeaponVariantData = function(inputJSONs, weaponCategory, weaponClasses, variantName)
{
    let snewksWeapons = JSON.parse(inputJSONs[0]).data.Weapons;
    let nexusHubWeapons = _.union(JSON.parse(inputJSONs[1]), JSON.parse(inputJSONs[2]), JSON.parse(inputJSONs[3]));
    let weaponBuffer = [];
    
    // Iterate through weapons.
    for(var weaponKey in snewksWeapons)
    {
        if(!_.has(snewksWeapons, weaponKey)) continue;

        let weaponSource = snewksWeapons[weaponKey];
        let altWeaponSource = nexusHubWeapons.find(weapon => weapon.name == weaponSource.Name);
        if(!weaponSource.Name.includes(variantName)) continue;
        if(weaponSource.Type != weaponCategory || !weaponClasses.filter.some(weaponClass => weaponSource.Class == weaponClass)) continue;


        // Weapon: Load & Translate everything except attacks.
        let weaponObject = new Object;
        for(var i = 0; i < WEAPON_ATTRIBUTE_MAP.length; ++i)
        {
            if(!_.has(weaponSource, WEAPON_ATTRIBUTE_MAP[i].key))
            {
                // Check if the alternative weapon sourced provides data for the missing attribute.
                if(!_.has(altWeaponSource, WEAPON_ATTRIBUTE_MAP[i].altKey)) /*console.log("WARNING: Could not find '" + WEAPON_ATTRIBUTE_MAP[i].newKey + "' source data for '" + weaponSource.Name + "'")*/;
                else if(WEAPON_ATTRIBUTE_MAP[i].altKey != undefined && !_.isEmpty(altWeaponSource[WEAPON_ATTRIBUTE_MAP[i].altKey]))
                {
                    if(weaponSource.Type == "Melee" && WEAPON_ATTRIBUTE_MAP[i].key == "NoiseLevel") continue;

                    weaponObject[WEAPON_ATTRIBUTE_MAP[i].newKey] = altWeaponSource[WEAPON_ATTRIBUTE_MAP[i].altKey];
                    console.log("WARNING: Using alternative attribute data for '" + WEAPON_ATTRIBUTE_MAP[i].newKey + "' of '" + weaponSource.Name + "'");
                }
                continue;
            }

            // Custom (non-default) behavior:
            if(WEAPON_ATTRIBUTE_MAP[i].key == "BlockResist")
            {
                // Transform attribute names and convert values into percentages.
                weaponObject[WEAPON_ATTRIBUTE_MAP[i].newKey] = _.round(weaponSource["BlockResist"] * 100, 2);
            }
            // Default behavior:
            else
            {
                // Copy values and transform attribute names.
                weaponObject[WEAPON_ATTRIBUTE_MAP[i].newKey] = weaponSource[WEAPON_ATTRIBUTE_MAP[i].key];
            }
        }

        // Attacks: Load & Translate attack objects.
        let weaponAttacks = [];
        for(weaponAttribute in weaponSource)
        {
            if(!weaponAttribute.includes("Attack")) continue;

            let attackObject;
            // The attack attribute is already an object.
            if(_.isObject(weaponSource[weaponAttribute]))
            {
                attackObject = weaponSource[weaponAttribute];
            }
            // The attack attribute is no object.
            else
            {
                // Take care of attributes that originally only provided a damage number
                // and this weren't wrapped in an object.
                attackObject = new Object;
                attackObject["Damage"] = weaponSource[weaponAttribute];
            }

            // Attacks: Attribute translation
            for(attackAttribute in attackObject)
            {
                if(!ATTACK_ATTRIBUTE_MAP.map(elem => elem.key).includes(attackAttribute)) 
                {
                    console.log("WARNING: filterWeaponVariantData(): New unindexed attack attribute: " + attackAttribute);
                    delete attackObject[attackAttribute];
                    continue;
                }

                // Custom (non-default) behavior:
                if(weaponCategory == "Melee" && attackAttribute == "FireRate")
                {
                    // Rename 'FireRate' to 'attackSpeed', since the weapon is no gun.
                    attackObject["attackSpeed"] = attackObject[attackAttribute];
                    delete attackObject["FireRate"];
                }
                else if(attackAttribute == "CritChance" || attackAttribute == "StatusChance")
                {
                    let translationIndex = ATTACK_ATTRIBUTE_MAP.map(elem => elem.key).indexOf(attackAttribute);
                    attackObject[ATTACK_ATTRIBUTE_MAP[translationIndex].newKey] = _.round(attackObject[attackAttribute], 2) * 100;;
                    delete attackObject[attackAttribute];
                }
                // Default behavior:
                else
                {
                    let translationIndex = ATTACK_ATTRIBUTE_MAP.map(elem => elem.key).indexOf(attackAttribute);
                    attackObject[ATTACK_ATTRIBUTE_MAP[translationIndex].newKey] = attackObject[attackAttribute];
                    delete attackObject[attackAttribute];
                }
            }

            // Attacks: Retrieve attack type from original attribute name.
            attackObject["attackType"] = weaponAttribute.replace("Attack", "").replace(/([a-z](?=[A-Z]))/g, "$1 ");

            weaponAttacks.push(attackObject);
        }
        // Attacks: Sorting
        weaponAttacks = _.sortBy(weaponAttacks, ["attackType"]); // Alphabetical sorting fallback
        weaponAttacks = _.sortBy(weaponAttacks, (attack) =>
        {
            if(!ATTACK_TYPE_ORDER.includes(attack.attackType))
            {
                console.log("WARNING: filterWeaponVariantData(): New unordered attack type: " + attack.attackType);
                return 0;
            }
            return ATTACK_TYPE_ORDER.indexOf(attack.attackType);
        });

        // Weapon: Add customized attributes
        weaponObject["img"] = "assets/weapons/" + weaponCategory.toLowerCase() + "/" + weaponClasses.name.toLowerCase() + "/" + weaponObject.name.replace("MK1-", "") + ".webp";
        weaponObject["attacks"] = weaponAttacks;

        // Accuracy: Transform data string into array.
        if(/[\-\+]?[0-9]+(\.[0-9]+)? \([\-\+]?[0-9]+(\.[0-9]+)? aimed|Aimed|when aimed\)/g.test(weaponObject.accuracy)) weaponObject.accuracy = [ 
            parseFloat(weaponObject.accuracy.match(/[\-\+]?[0-9]+(\.[0-9]+)?/g)[0]), 
            parseFloat(weaponObject.accuracy.match(/[\-\+]?[0-9]+(\.[0-9]+)?/g)[1]) 
        ];

        // Weapon: Polarities translation
        if(_.has(weaponObject, "polarities"))
        {
            for(var i = 0; i < weaponObject.polarities.length; ++i)
            {
                let translationIndex = POLARITIES_MAP.map(elem => elem.key).indexOf(weaponObject.polarities[i]);

                if(translationIndex != -1) weaponObject.polarities[i] = POLARITIES_MAP[translationIndex].newKey;
                else console.log("WARNING: '" + weaponObject.polarities[i] + "' polarity could'nt be translated!");
            }
        }
        
        // Weapon: Stance polarity translation
        if(_.has(weaponObject, "stancePolarity"))
        {
            let translationIndex = POLARITIES_MAP.map(elem => elem.key).indexOf(weaponObject.stancePolarity);

            if(translationIndex != -1) weaponObject.stancePolarity = POLARITIES_MAP[translationIndex].newKey;
            else console.log("WARNING: '" + weaponObject.stancePolarity + "' polarity could'nt be translated!");
        }

        // Weapon: Remove 'noiselevel' attribute if it's value is "Alarming"
        if(weaponObject.noiselevel == "Alarming") delete weaponObject.noiselevel;

        weaponBuffer.push(weaponObject);
    }

    return _.sortBy(weaponBuffer, ["name"]);
}

exports.parseDeltaWeaponData = function(parentBuffer, variantBuffer, variantName)
{
    let deltaBuffer = [];

    // Iterate through weapons.
    for(var variantIndex = 0; variantIndex < variantBuffer.length; ++variantIndex)
    {
        // The variant version of the weapon.
        let variantWeapon = variantBuffer[variantIndex];

        // Find the normal version of the weapon variant.
        let parentWeapon = parentBuffer.filter((weapon) => {
            return weapon.name == variantWeapon.name.replace(" " + variantName, "");
        });
        switch(parentWeapon.length)
        {
            // Standalone variants or errors:
            case 0:
                console.log("WARNING: parseDeltaWeaponData(): Could not find corresponding normal version of: " + variantWeapon.name);
                variantWeapon["id"] = parseInt(_.uniqueId());
                deltaBuffer.push(variantWeapon);
                continue;
            // Expected behavior:
            case 1:
                parentWeapon = parentWeapon[0];
                break;
            // Multiple versions were identified as normal version:
            default:
                console.assert(false, "ERROR: parseDeltaWeaponData(): Found multiple objects identified as parent of: '" + variantWeapon.name * "'! Identified: " + parentWeapon);
                break;
        }

        // Add missing attributes so they don't get ignored in rating.
        for(var weaponAttribute in parentWeapon)
        {
            if(!_.has(parentWeapon, weaponAttribute)) continue;
            if(!_.has(variantWeapon, weaponAttribute)) variantWeapon[weaponAttribute] = undefined;
        }
        // Iterate through attributes.
        for(var weaponAttribute in variantWeapon)
        {
            if(!_.has(variantWeapon, weaponAttribute)) continue;
            if(NO_COMPARE_ATTRIBUTES.includes(weaponAttribute)) continue;

            // The attribute values are equal.
            if(_.isEqual(variantWeapon[weaponAttribute], parentWeapon[weaponAttribute]))
            {
                // Delete redundant attribute.
                variantWeapon = _.omit(variantWeapon, weaponAttribute);
                continue;
            }

            // The attribute is undefined.
            if(_.isUndefined(variantWeapon[weaponAttribute]))
            {
                // Missing attribute values are rated as negative change.
                variantWeapon[weaponAttribute] = [ variantWeapon[weaponAttribute], "-" ];
                continue;
            }

            // The attribute is new.
            if(!_.has(parentWeapon, weaponAttribute))
            {
                // New attributes are rated as positive change.
                variantWeapon[weaponAttribute] = [ variantWeapon[weaponAttribute], "+" ];
                continue;
            }


            /* The attribute values differ: */
            // Encoding:
            // '+' - positive change (green)
            // '-' - negative change (red)
            // 'm' - neutral  change (yellow)

            // Attribute type: string
            if(_.isString(variantWeapon[weaponAttribute]))
            {
                // String modifications can't be rated.
                variantWeapon[weaponAttribute] = [ variantWeapon[weaponAttribute], "m" ];
                continue;
            }

            // Attribute type: number
            if(_.isNumber(variantWeapon[weaponAttribute])) 
            {
                // Customized (non-default) behavior:
                if(weaponAttribute == "mastery" || weaponAttribute == "reloadSpeed")
                {
                    // Lower numbers are better.
                    variantWeapon[weaponAttribute] = [ variantWeapon[weaponAttribute], ( variantWeapon[weaponAttribute] > parentWeapon[weaponAttribute] ? "-" : "+" ) ];
                }
                // Default behavior:
                else
                {
                    // Higher numbers are better.
                    variantWeapon[weaponAttribute] = [ variantWeapon[weaponAttribute], ( variantWeapon[weaponAttribute] > parentWeapon[weaponAttribute] ? "+" : "-" ) ];
                }
                continue;
            }

            // Attribute type: array
            if(_.isArray(variantWeapon[weaponAttribute]))
            {
                // Customized (non-default) behavior:
                if(weaponAttribute == "attacks")
                {
                    // Rate each attribute change of each attack object.
                    for(var i = 0; i < variantWeapon["attacks"].length; ++i)
                    {
                        variantWeapon["attacks"][i] = parseDeltaWeaponAttackData(parentWeapon["attacks"][i], variantWeapon["attacks"][i]);
                    }
                    continue;
                }

                // The new array is longer:
                if(variantWeapon[weaponAttribute].length > parentWeapon[weaponAttribute].length)
                {
                    // Longer arrays are rated as positive change.
                    variantWeapon[weaponAttribute] = [ variantWeapon[weaponAttribute], "+" ];
                    continue;
                }
                // The new array is shorter:
                else if(variantWeapon[weaponAttribute].length < parentWeapon[weaponAttribute].length) 
                { 
                    // Shorter arrays are rated as negative change.
                    variantWeapon[weaponAttribute] = [ variantWeapon[weaponAttribute], "-" ];
                    continue;
                } 


                /* The arrays are of the same length: */
                
                // All elements are numbers:
                if(variantWeapon[weaponAttribute].every(element => _.isNumber(element)))
                {
                    // All values of the variant are higher or equal:
                    if(variantWeapon[weaponAttribute].every((element, index) => element >= parentWeapon[weaponAttribute][index]))
                    {
                        // Higher numbers are better.
                        variantWeapon[weaponAttribute] = [ variantWeapon[weaponAttribute], "+" ];
                    }
                    // All values of the variant are lower or equal:
                    else if(variantWeapon[weaponAttribute].every((element, index) => element <= parentWeapon[weaponAttribute][index]))
                    {
                        // Lower numbers are worse.
                        variantWeapon[weaponAttribute] = [ variantWeapon[weaponAttribute], "-" ];
                    }
                    // The relations of the numbers can't be generalized (fallback):
                    else
                    {
                        // The changes can't be rated.
                        variantWeapon[weaponAttribute] = [ variantWeapon[weaponAttribute], "m" ];
                    }
                }
                // Fallback behavior (unrated):
                else
                {
                    // The changes can't be rated.
                    variantWeapon[weaponAttribute] = [ variantWeapon[weaponAttribute], "m" ];
                }
                continue;
            }

            console.assert(false, "ERROR: parseDeltaWeaponData(): Unhandled attribute type of '" + variantWeapon[weaponAttribute] + "'");
        }

        variantWeapon["id"] = parentWeapon["id"];
        deltaBuffer.push(variantWeapon);
    }

    return _.sortBy(deltaBuffer, ["name"]);
}

parseDeltaWeaponAttackData = function(parentAttackObject, variantAttackObject)
{
    // The attack did not exist before.
    if(_.isUndefined(parentAttackObject))
    {
        variantAttackObject.attackType = [ variantAttackObject.attackType, "+" ];
        return variantAttackObject;
    }

    let deltaAttackObject = new Object;

    // Iterate through object attributes.
    for(var attackAttribute in variantAttackObject)
    {
        if(!_.has(variantAttackObject, attackAttribute)) continue;

        // The attribute values are equal.
        if(_.isEqual(variantAttackObject[attackAttribute], parentAttackObject[attackAttribute]))
        {
            // Nothing changed. The attribute is copied, since it is on level 2 (deepness) of the object structure.
            deltaAttackObject[attackAttribute] = variantAttackObject[attackAttribute];
            continue;
        }
        
        // The attribute is new.
        if(!_.has(parentAttackObject, attackAttribute))
        {
            // New attributes are rated as positive change.
            deltaAttackObject[attackAttribute] = [ variantAttackObject[attackAttribute], "+" ];
            continue;
        }


        /* The attribute values differ: */
        // Encoding:
        // '+' - positive change (green)
        // '-' - negative change (red)
        // 'm' - neutral  change (yellow)

        // Attribute type: string
        if(_.isString(variantAttackObject[attackAttribute]))
        {
            // String modifications can't be rated.
            variantAttackObject[attackAttribute] = [ variantAttackObject[attackAttribute], "m" ];
            continue;
        }

        // Attribute type: number
        if(_.isNumber(variantAttackObject[attackAttribute])) 
        {
            // Higher numbers are better.
            deltaAttackObject[attackAttribute] = [ variantAttackObject[attackAttribute], ( variantAttackObject[attackAttribute] > parentAttackObject[attackAttribute] ? "+" : "-" ) ];
            continue;
        }

        // Attribute type: object
        if(_.isObject(variantAttackObject[attackAttribute]))
        {
            // Customized (non-default) behavior:
            if(attackAttribute == "damage")
            {
                deltaAttackObject["damage"] = new Object;

                // Check if the weapon variant is missing a damage attribute.
                for(var damageAttribute in parentAttackObject["damage"])
                {
                    if(!_.has(variantAttackObject, damageAttribute))
                    {
                        // Missing attributes are rated as negative change, since they are equivalent to the value of 0.
                        deltaAttackObject["damage"][damageAttribute] = [ 0, "-" ];
                    }
                }
                // Rate changes for the new damage object.
                for(var damageAttribute in variantAttackObject["damage"])
                {
                    // The damage attribute did not exist before.
                    if(!_.has(parentAttackObject, damageAttribute))
                    {
                        // New attributes are rated as positive change.
                        deltaAttackObject["damage"][damageAttribute] = [ variantAttackObject["damage"][damageAttribute], "+" ];
                    }
                    // The attribute value did not change.
                    else if(variantAttackObject["damage"][damageAttribute] == parentAttackObject["damage"][damageAttribute])
                    {
                        deltaAttackObject["damage"][damageAttribute] = parentAttackObject["damage"][damageAttribute];
                    }
                    // Rate the change of the attribute value.
                    else
                    {
                        deltaAttackObject["damage"][damageAttribute] = [ variantAttackObject["damage"][damageAttribute], variantAttackObject["damage"][damageAttribute] > parentAttackObject["damage"][damageAttribute] ? "+" : "-" ];
                    }
                }
            }
            // Default behavior:
            else
            {
                console.assert(false, "ERROR: parseDeltaWeaponAttackData(): Unexpected object-type attribute '" + attackAttribute + "' in weapon attack data!");
            }
            continue;
        }

        console.assert(false, "ERROR: parseDeltaWeaponAttackData(): Unhandled attribute type of '" + variantWarframe[warframeAttribute] + "'");
    }

    return deltaAttackObject;
}