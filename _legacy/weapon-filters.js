const _ = require('lodash');

const KNOWN_VARIANTS = [
    "Prime",
    "Umbra"
];

const WEAPON_ATTRIBUTE_MAP = [
    { key: "Name", newKey: "name" },
    { key: "Mastery", newKey: "mastery" },
    { key: "MaxAmmo", newKey: "maxAmmo" },
    { key: "NoiseLevel", newKey: "noiselevel" },
    { key: "Trigger", newKey: "triggerType" },
    { key: "Accuracy", newKey: "accuracy" },
    { key: "Reload", newKey: "reloadSpeed" },
    { key: "Magazine", newKey: "magSize" },
    { key: "FinisherDamage", newKey: "finisherDamage" },
    { key: "BlockResist", newKey: "blockResist" },
    { key: "Polarities", newKey: "polarities" },
    { key: "StancePolarity", newKey: "stancePolarity" }
];

const NO_COMPARE_ATTRIBUTES = [
    "name",
    "img",
    "id"
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

exports.filterWeaponNormalData = function(inputJSON, weaponCategory, weaponClasses)
{
    let snewksWeapons = JSON.parse(inputJSON).data.Weapons;
    let weaponBuffer = [];
    
    // Iterate through weapons.
    for(var weaponKey in snewksWeapons)
    {
        if(!_.has(snewksWeapons, weaponKey)) continue;

        let weaponSource = snewksWeapons[weaponKey];
        if(KNOWN_VARIANTS.some(variant => weaponSource.Name.includes(variant))) continue;
        if(weaponSource.Type != weaponCategory || !weaponClasses.filter.some(weaponClass => weaponSource.Class == weaponClass)) continue;

        // Weapon: Load & Translate everything except attacks.
        let weaponObject = new Object;
        for(var i = 0; i < WEAPON_ATTRIBUTE_MAP.length; ++i)
        {
            if(!_.has(weaponSource, WEAPON_ATTRIBUTE_MAP[i].key)) continue;

            if(WEAPON_ATTRIBUTE_MAP[i].key == "BlockResist")
            {
                weaponObject[WEAPON_ATTRIBUTE_MAP[i].newKey] = _.round(weaponSource["BlockResist"] * 100, 2);
            }
            else
            {
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
        weaponObject["img"] = "assets/weapons/" + weaponCategory.toLowerCase() + "/" + weaponClasses.name.toLowerCase() + "/" + weaponObject.name + ".webp";
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

        weaponBuffer.push(weaponObject);
    }

    return _.sortBy(weaponBuffer, ["name"]);
}

exports.filterWeaponVariantData = function(inputJSON, weaponCategory, weaponClasses, variantName)
{
    let snewksWeapons = JSON.parse(inputJSON).data.Weapons;
    let weaponBuffer = [];
    
    // Iterate through weapons.
    for(var weaponKey in snewksWeapons)
    {
        if(!_.has(snewksWeapons, weaponKey)) continue;

        let weaponSource = snewksWeapons[weaponKey];
        if(!weaponSource.Name.includes(variantName)) continue;
        if(weaponSource.Type != weaponCategory || !weaponClasses.filter.some(weaponClass => weaponSource.Class == weaponClass)) continue;

        // Weapon: Load & Translate everything except attacks.
        let weaponObject = new Object;
        for(var i = 0; i < WEAPON_ATTRIBUTE_MAP.length; ++i)
        {
            if(!_.has(weaponSource, WEAPON_ATTRIBUTE_MAP[i].key)) continue;

            if(WEAPON_ATTRIBUTE_MAP[i].key == "BlockResist")
            {
                weaponObject[WEAPON_ATTRIBUTE_MAP[i].newKey] = _.round(weaponSource["BlockResist"] * 100, 2);
            }
            else
            {
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
        weaponObject["img"] = "assets/weapons/" + weaponCategory.toLowerCase() + "/" + weaponClasses.name.toLowerCase() + "/" + weaponObject.name + ".webp";
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
                variantWeapon["id"] = _.uniqueId();
                deltaBuffer.push(variantWeapon);
                continue;
            // Expected behavior:
            case 1:
                parentWeapon = parentWeapon[0];
                break;
            // Multiple versions were identified as normal version:
            default:
                console.assert(true, "ERROR: parseDeltaWeaponData(): Found multiple objects identified as parent of: '" + variantWeapon.name * "'! Identified: " + parentWeapon);
                break;
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

            // The attribute is new.
            if(parentWeapon[weaponAttribute] == undefined)
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

                // Customized (non-default) behavior:
                if(weaponAttribute == "attacks")
                {
                    // Rate each attribute change of each attack object.
                    for(var i = 0; i < variantWeapon["attacks"].length; ++i)
                    {
                        variantWeapon["attacks"][i] = parseDeltaWeaponAttackData(parentWeapon["attacks"][i], variantWeapon["attacks"][i]);
                    }
                }
                // All elements are numbers:
                else if(variantWeapon[weaponAttribute].every(element => _.isNumber(element)))
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
        }

        variantWeapon["id"] = parentWeapon["id"];
        deltaBuffer.push(variantWeapon);
    }

    return _.sortBy(deltaBuffer, ["name"]);
}

parseDeltaWeaponAttackData = function(parentObject, variantObject)
{
    let deltaObject = new Object;

    // Iterate through object attributes.
    for(var attackAttribute in variantObject)
    {
        if(!_.has(variantObject, attackAttribute)) continue;

        // The attribute values are equal.
        if(_.isEqual(variantObject[attackAttribute], parentObject[attackAttribute]))
        {
            // Nothing changed. The attribute is copied, since it is on level 2 (deepness) of the object structure.
            deltaObject[attackAttribute] = variantObject[attackAttribute];
            continue;
        }
        
        // The attribute is new.
        if(parentObject[attackAttribute] == undefined)
        {
            // New attributes are rated as positive change.
            deltaObject[attackAttribute] = [ variantObject[attackAttribute], "+" ];
            continue;
        }


        /* The attribute values differ: */
        // Encoding:
        // '+' - positive change (green)
        // '-' - negative change (red)
        // 'm' - neutral  change (yellow)

        // Attribute type: number
        if(_.isNumber(variantObject[attackAttribute])) 
        {
            // Higher numbers are better.
            deltaObject[attackAttribute] = [ variantObject[attackAttribute], ( variantObject[attackAttribute] > parentObject[attackAttribute] ? "+" : "-" ) ];
            continue;
        }

        // Attribute type: object
        if(_.isObject(variantObject[attackAttribute]))
        {
            // Customized (non-default) behavior:
            if(attackAttribute == "damage")
            {
                deltaObject["damage"] = new Object;

                // Check if the weapon variant is missing a damage attribute.
                for(var damageAttribute in parentObject["damage"])
                {
                    if(!_.has(variantObject, damageAttribute))
                    {
                        // Missing attributes are rated as negative change, since they are equivalent to the value of 0.
                        deltaObject["damage"][damageAttribute] = [ 0, "-" ];
                    }
                }
                // Rate changes for the new damage object.
                for(var damageAttribute in variantObject["damage"])
                {
                    // The damage attribute did not exist before.
                    if(!_.has(parentObject, damageAttribute))
                    {
                        // New attributes are rated as positive change.
                        deltaObject["damage"][damageAttribute] = [ variantObject["damage"][damageAttribute], "+" ];
                    }
                    // The attribute value did not change.
                    else if(variantObject["damage"][damageAttribute] == parentObject["damage"][damageAttribute])
                    {
                        deltaObject["damage"][damageAttribute] = parentObject["damage"][damageAttribute];
                    }
                    // Rate the change of the attribute value.
                    else
                    {
                        deltaObject["damage"][damageAttribute] = [ variantObject["damage"][damageAttribute], variantObject["damage"][damageAttribute] > parentObject["damage"][damageAttribute] ? "+" : "-" ];
                    }
                }
            }
            // Default behavior:
            else
            {
                console.assert(true, "WARNING: parseDeltaWeaponAttackData(): Unexpected object-type attribute '" + attackAttribute + "' in weapon attack data!");
            }
            continue;
        }

        // Fallback behavior (unrated):
        deltaObject[attackAttribute] = [ variantObject[attackAttribute], "m" ];
    }

    return deltaObject;
}