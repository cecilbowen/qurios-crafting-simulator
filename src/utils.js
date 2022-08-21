import AUGMENTS from './data/augments.json';
import SKILLS from './data/skills_all.json';
import { Solver } from './subset';

// sets some hard limits on inputs that are not
// achievable legitly
export const resHardLimits = new Map([
    ["Fire Resistance", { upper: 12, lower: -18 }],
    ["Water Resistance", { upper: 12, lower: -18 }],
    ["Thunder Resistance", { upper: 12, lower: -18 }],
    ["Ice Resistance", { upper: 12, lower: -18 }],
    ["Dragon Resistance", { upper: 12, lower: -18 }],
]);

export const defHardLimits = new Map([
    ["1", { upper: 280, lower: -84 }],
    ["2", { upper: 224, lower: -84 }],
    ["3", { upper: 182, lower: -84 }],
    ["4", { upper: 140, lower: -84 }],
    ["5", { upper: 112, lower: -84 }],
    ["6", { upper: 84, lower: -84 }],
    ["13", { upper: 84, lower: -84 }],
]);

// since there are so few elemental resistance combinations,
// might as well just map them out manually here to avoid having
// to subset sum a solution
const elementalCombinations = new Map([
	[-18, [-3, -3, -3, -3, -3, -3]],
	[-17, [-3, -3, -3, -3, -3, -2]],
	[-16, [-3, -3, -3, -3, -3, -1]],
	[-15, [-3, -3, -3, -3, -3]],
	[-14, [-3, -3, -3, -3, -2]],
	[-13, [-3, -3, -3, -3, -1]],
	[-12, [-3, -3, -3, -3]],
	[-11, [-3, -3, -3, -2]],
	[-10, [-3, -3, -3, -1]],
	[-9, [-3, -3, -3]],
	[-8, [-3, -3, -2]],
	[-7, [-3, -3, -1]],
	[-6, [-3, -3]],
	[-5, [-3, -2]],
	[-4, [-3, -1]],
	[-3, [-3]],
	[-2, [-2]],
	[-1, [-1]],
	[1, [1]],
	[2, [2]],
	[3, [2, 1]],
	[4, [2, 2]],
	[5, [2, 2, 1]],
	[6, [2, 2, 2]],
	[7, [2, 2, 2, 1]],
	[8, [2, 2, 2, 2]],
	[9, [2, 2, 2, 2, 1]],
	[10, [2, 2, 2, 2, 2]],
	[11, [2, 2, 2, 2, 2, 1]],
	[12, [2, 2, 2, 2, 2, 2]],
]);

export const getElementalResistanceTax = target => {
    const hardUpperLimit = resHardLimits.get("Fire Resistance").upper;
    const hardLowerLimit = resHardLimits.get("Fire Resistance").lower;

    if (target === 0 || target > hardUpperLimit || target < hardLowerLimit) {
        return undefined;
    }

    const costMap = new Map([
        [-3, -3],
        [-2, -2],
        [-1, -2],
        [1, 2],
        [2, 2],
    ]);

    const combinations = elementalCombinations.get(target).map(value => {
        return {
            value,
            cost: costMap.get(value),
        };
    });

    const cost = combinations.map(x => x.cost).reduce((partialSum, a) => partialSum + a, 0); // cost sum of each object

    return {
        combinations,
        cost,
        augments: combinations.length,
    };
};

// returns most efficient budget cost/augment count for allocated slots
export const getSlotTax = (currentArmor, slotCount) => {
    const values = [];

    if (slotCount < 4) {
        values.push(slotCount);
    } else {
        const numOfThrees = Math.floor(slotCount / 3);
        const leftover = slotCount % 3;

        for (let i = 0; i < numOfThrees; i++) {
            values.push(3);
        }
        values.push(leftover);
    }

    let cost = 0;
    let augments = values.length;
    for (const val of values) {
        const foundAugment = AUGMENTS.slice(0).filter(x =>
            x.pool === currentArmor?.pool // warning: "pool" is still a string, not an int
            && x.description === "Slot+"
            && x.level1 === val
        )[0];

        if (foundAugment) {
            cost += foundAugment.cost;
        }
    }

    return {
        cost,
        augments,
    };
};

export const getSkillTax = (skill, value) => {
    let cost = skill.cost;
    if (value < 0) {
        cost = 10; // losing a skill always gives you -10
    }

    return {
        cost: cost * value,
        augments: Math.abs(value),
    };
};

export const getStatKey = (stat, pool, normalize = false) => {
    //stat.label stat.value
    if (stat.label === "Slot") {
        // if (stat.value > 0) { return "Slot+"; }
        // if (stat.value < 0) { return "Slot-"; }
        return undefined;
    }

    const firstWord = stat.label.split(" ")[0];
    const augmentPool = AUGMENTS.filter(x => x.pool === pool);

    for (const augment of augmentPool) {
        if (augment.description.indexOf(firstWord) !== -1) {
            if (stat.value !== 0) {
                let sign = "+";
                if (stat.value < 0) {
                    sign = "-";
                }

                if (normalize) {
                    sign = ''; // return key sans sign
                }
                return `${augment.description.substr(0, augment.description.length - 1)}${sign}`;
            }
        }
    }

    return undefined;
};

export const getSkillByName = name => {
    return SKILLS.filter(x => x.name === name)[0];
};

// returns an array with each element duplicated amount number of times
// used to simulate the possibility that an augment may be rolled more than once
export const getExpandedAugments = (augmentArr, amount = 3) => {
    if (amount <= 1) {
        return augmentArr;
    }

    var ret = [];
    for (const aug of augmentArr) {
        for (let i = 0; i < amount; i++) {
            ret.push(aug);
        }
    }

    return ret;
};

// sorts solution array and removes duplicates
// duplicates being solutions with identical budget cost and values
export const getSortedUniqueSolutions = solutionArr => {
    const uniques = [];
    const ret = [];
    //console.groupCollapsed("sorted unique solutions");
    for (const obj of solutionArr) {
        const augCount = obj.length;
        const strArr = JSON.stringify(obj.map(x => x.value)); // number array of values
        const cost = obj.map(x => x.cost).reduce((partialSum, a) => partialSum + a, 0); // cost sum of each object
        let exists = false;
        for (const u of uniques) {
            if (!exists) {
                const strArr2 = JSON.stringify(u.map(x => x.value));
                const cost2 = u.map(x => x.cost).reduce((partialSum, a) => partialSum + a, 0);
                if (strArr === strArr2 && cost === cost2) {
                    exists = true;
                }
            }
        }

        if (!exists) {
            uniques.push(obj);
            ret.push({
                combinations: obj,
                totalCost: cost,
                totalAugments: augCount,
            });
            //console.log(`${strArr}, augment count: ${augCount} cost sum: ${cost}`);
        }
    }
    //console.groupEnd();

    // sort results by total augment slots used first, and total budget cost second
    ret.sort((a, b) => {
        return a.totalAugments - b.totalAugments || a.totalCost - b.totalCost;
    });

    //console.log(ret, Math.abs(solutionArr.length - uniques.length));
    return ret;
};

export const getReducedArray = (expandedAugments, value) => {
    let ret = [];
    let boundsSolution = [];

    expandedAugments.sort((a, b) => {
        return b.value - a.value;
    });

    // const positiveSum = expandedAugments.filter(x => x.value > 0).reduce((partialSum, a) => partialSum + a.value, 0);

    let est = (value > expandedAugments[0].value) ? expandedAugments[0] : expandedAugments[expandedAugments.length - 1];
    const edgeCount = Math.floor(value / est.value);
    const leftover = value % est.value;

    for (let i = 0; i < edgeCount; i++) {
        boundsSolution.push(est);
    }

    let tempSolutions = [];
    const tempSolver = new Solver(expandedAugments, leftover, "value");
    const noLeftovers = (leftover === 0);
    const leftoverObj = expandedAugments.filter(x => x.value === leftover)[0];
    if (leftoverObj) {
        boundsSolution.push(leftoverObj);
    } else if (!noLeftovers) {
        tempSolutions = tempSolver.run();  
    }

    if (leftoverObj || tempSolver.hasSolution) {
        const solArr = (noLeftovers || leftoverObj) ? [boundsSolution] : tempSolutions;
        const bestSolution = getSortedUniqueSolutions(solArr)[0];
        const tempCost = boundsSolution.map(x => x.cost).reduce((partialSum, a) => partialSum + a, 0);
        ret = [{
            totalCost: bestSolution.totalCost + tempCost,
            totalAugments: bestSolution.totalAugments + boundsSolution.length,
            combinations: [...boundsSolution, ...bestSolution.combinations],
        }];

        if (noLeftovers || leftoverObj) {
            //console.log("no leftovers, assigning", bestSolution);
            ret = [bestSolution];
        }
    }
    
    return ret;
};

// generates an impor string to be used with the wiki set builder
export const getWikiSimExportString = (armor, diffs, slotDiffs) => {
    if (!armor || !diffs || !slotDiffs) { return; }

    // wiki set builder import format:
    //   name, defense mod, fire mod, water mod, thunder mod, ice mod, dragon mod,
    //   slot1 mod, slot2 mod, slot3 mod,
    //   skill 1 name, skill 1 mod, skill 2 name, skill 2 mod, skill 3 name, skill 3 mod, skill 4 name, skill 4 mod
    // note: wiki set builder only supports 4 skill mods
    let exportData = [];

    // name
    exportData.push(armor.name);

    // defense mod
    exportData.push(diffs.get("Defense"));
    
    // elemental resistances
    exportData.push(diffs.get("Fire Resistance"));
    exportData.push(diffs.get("Water Resistance"));
    exportData.push(diffs.get("Thunder Resistance"));
    exportData.push(diffs.get("Ice Resistance"));
    exportData.push(diffs.get("Dragon Resistance"));

    // slot diffs
    exportData.push(slotDiffs);

    // skills (limited to 4)
    let skillsAdded = 0;
    for (const [key, value] of diffs) {
        if (skillsAdded >= 4) { break; }
        const skill = getSkillByName(key.substr(1));
        if (skill && value !== 0) {
            exportData.push(skill.name, value);
            skillsAdded++;
        }
    }

    // add empty strings to fill up remaining skills
    for (let i = skillsAdded; i < 4; i++) {
        exportData.push("", "");
    }

    return exportData.join(",");
};

export const copyText = element => {
    element.target.select();
    navigator.clipboard.writeText(element.target.value);
};
