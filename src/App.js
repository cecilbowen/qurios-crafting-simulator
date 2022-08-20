import ARMOR8 from './data/armor_rarity8.json';
import ARMOR9 from './data/armor_rarity9.json';
import ARMOR10 from './data/armor_rarity10.json';
import AUGMENTS from './data/augments.json';
import SKILLS from './data/skills_all.json';
import PREROLL_POOL1 from './data/defense_prerolls/pool_1.json';
import PREROLL_POOL2 from './data/defense_prerolls/pool_2.json';
import PREROLL_POOL3 from './data/defense_prerolls/pool_3.json';
import PREROLL_POOL4 from './data/defense_prerolls/pool_4.json';
import PREROLL_POOL5 from './data/defense_prerolls/pool_5.json';
import PREROLL_POOL6 from './data/defense_prerolls/pool_6.json';
import PREROLL_POOL13 from './data/defense_prerolls/pool_13.json';
import FIRE from './images/fire.webp';
import WATER from './images/water.webp';
import THUNDER from './images/thunder.webp';
import ICE from './images/ice.webp';
import DRAGON from './images/dragon.webp';
import GENERIC from './images/generic.png';

import React, { useEffect, useState } from 'react';
import './App.css';
import Datalist from './components/Datalist';
import LabeledInput, { Label } from './components/LabeledInput';
import SkillInput from './components/SkillInput';
import SlotInput from './components/SlotInput';
import { Solver } from './subset';
import { getElementalResistanceTax, getExpandedAugments, getSkillTax,
  getSlotTax, getSortedUniqueSolutions, getReducedArray, getWikiSimExportString
} from './utils';
import { getSkillByName, getStatKey } from './utils';
import styled from '@emotion/styled';

const MAIN_COLOR = "#5d0206";

const AugmentBox = styled.div`
  border: 4px solid ${MAIN_COLOR};
  width: 20em;
  background-color: #131313;
  position: relative;
  border-radius: 8px;
`;

const AugmentHeader = styled.div`
  width: 100%;
  height: 20px;
  background-color: ${MAIN_COLOR};
  font-weight: bold;
  color: #ada9a9;
  line-height: 13px;
`;

const SkillDecoration = styled.div`
  border: 1px solid black;
  color: #e1d17f;
  font-size: 14px;
  filter: drop-shadow(0px 0px 2px black);
  font-family: sans-serif;
  background-color: #272727;
  border-radius: 70px;
  margin: auto;
  margin-top: 0.5em;
  margin-bottom: 2px;
  width: 85%;
`;

const SkillsBox = styled.div`

`;

const Footer = styled.div`
  position: absolute;
  right: 0;
  bottom: 0;
  background-color: white;
  border-radius: 12px;
  height: 25px;
  margin: 7px 7px;
`;

const Link = styled.a`
  margin: 0em 1em;
  font-family: monospace;
`;

const SpacedDiv = styled.div`
  display: flex;
  justify-content: space-between;
  margin: 0em 2em;
  font-weight: bold;
`;

// #ff5496 - quirou pink
// #122549 - blue

const DEBUG_MODE = false;
const USING_PRE_ROLLS = true;

const App = () => {

  const defaultDiffs = new Map([
    ["Slot", 0],
    ["Defense", 0],
    ["Fire Resistance", 0],
    ["Water Resistance", 0],
    ["Thunder Resistance", 0],
    ["Ice Resistance", 0],
    ["Dragon Resistance", 0],
    // ["_Name of Skill", skillLevelDiff]
  ]);

  const [armorList, setArmorList] = useState([]);
  const [skillList, setSkillList] = useState([]);
  const [reset, setReset] = useState(false); // used to reset all values when swapping to new armor piece
  const [currentArmor, setCurrentArmor] = useState(undefined);
  const [modSkills, setModSkills] = useState([]); // extra, added skills
  const [budget, setBudget] = useState(0);
  const [augmentCount, setAugmentCount] = useState(0);
  const [diffs, setDiffs] = useState(new Map(defaultDiffs));
  const [budgetDiffs, setBudgetDiffs] = useState(new Map(defaultDiffs));
  const [augmentDiffs, setAugmentDiffs] = useState(new Map(defaultDiffs));
  const [slotDiffs, setSlotDiffs] = useState([0, 0, 0]);

  useEffect(() => {
    setArmorList([...ARMOR8, ...ARMOR9, ...ARMOR10]);
    setSkillList(SKILLS);
  }, []);

  useEffect(() => {
    setReset(true);
    setBudget(currentArmor?.budget || budget);
    setModSkills([]);
    setDiffs(new Map(defaultDiffs));
    setBudgetDiffs(new Map(defaultDiffs));
    setAugmentDiffs(new Map(defaultDiffs));
    setAugmentCount(0);
  }, [currentArmor]);

  useEffect(() => {
    if (reset) {
      setReset(false);
    }
  }, [reset]);

  useEffect(() => {
    let totalBudget = 0;
    for (const value of budgetDiffs.values()) {
      totalBudget += value;
    }

    setBudget(totalBudget);
  }, [budgetDiffs]);

  useEffect(() => {
    let totalAugments = 0;
    for (const value of augmentDiffs.values()) {
      totalAugments += value;
    }

    setAugmentCount(totalAugments);
    getWikiSimExportString(currentArmor, diffs, slotDiffs);
  }, [augmentDiffs]);

  const calculateAugmentCount = (tempDiffs, key, value) => {
    // budget and augment count
    const tempBudgetDiffs = new Map(budgetDiffs);
    const tempAugmentDiffs = new Map(augmentDiffs);

    if (value === 0) {
      tempBudgetDiffs.set(key, 0);
      tempAugmentDiffs.set(key, 0);
      
      return {
        tempBudgetDiffs,
        tempAugmentDiffs,
      };
    }

    let statKey = getStatKey({ label: key, value: value }, currentArmor?.pool, true);

    // if skill or slot, easy to handle
    let elemental = false;
    let skill = getSkillByName(key.substr(1));
    if (key === "Slot") {
      const tax = getSlotTax(currentArmor, value);
      tempBudgetDiffs.set(key, tax.cost);
      tempAugmentDiffs.set(key, tax.augments);
    } else if (skill) {
      const tax = getSkillTax(skill, value);
      tempBudgetDiffs.set(`_${skill.name}`, tax.cost);
      tempAugmentDiffs.set(`_${skill.name}`, tax.augments);
    } else if (key.indexOf("Resistance") !== -1) {
      const tax = getElementalResistanceTax(value);
      tempBudgetDiffs.set(key, tax.cost);
      tempAugmentDiffs.set(key, tax.augments);
      elemental = true;
    }

    if (!statKey || elemental) {
      return {
        tempBudgetDiffs,
        tempAugmentDiffs,
      };
    }

    // from here on, handle defense
    if (USING_PRE_ROLLS) {
      let preRollObj;
      switch (currentArmor?.pool) {
        case "1": preRollObj = PREROLL_POOL1; break;
        case "2": preRollObj = PREROLL_POOL2; break;
        case "3": preRollObj = PREROLL_POOL3; break;
        case "4": preRollObj = PREROLL_POOL4; break;
        case "5": preRollObj = PREROLL_POOL5; break;
        case "6": preRollObj = PREROLL_POOL6; break;
        case "13": preRollObj = PREROLL_POOL13; break;
        default:
          console.warn("currentArmor?.pool undefined");
          tempBudgetDiffs.set(key, 0);
          tempAugmentDiffs.set(key, 0);
          
          return {
            tempBudgetDiffs,
            tempAugmentDiffs,
          };
      }

      const preRollMap = new Map(Object.entries(preRollObj));

      tempBudgetDiffs.set(key, preRollMap.get(`${value}`).cost);
      tempAugmentDiffs.set(key, preRollMap.get(`${value}`).augments);

      return {
        tempBudgetDiffs,
        tempAugmentDiffs,
      };
    }


    // get catered list by pool and statKey
    const potentialAugmentList = AUGMENTS.slice(0).filter(x =>
      x.pool === currentArmor?.pool // warning: "pool" is still a string, not an int
      && x.description.indexOf(statKey) !== -1 // include + and - values
      // && !x.unknown
    );

    let augmentList = [];
    for (const x of potentialAugmentList) {
      for (let i = 0; i < 3; i++) {
        const lv = x[`level${i+1}`];

        if (lv !== 0) {
          augmentList.push({
            id: x.id,
            description: x.description,
            value: lv,
            cost: x.cost,
          });
        }
      }
    }

    // attempt to ease processing load by checking to see if target value
    // exists in potential list, and if it does, choose one with lowest cost
    // (eg. no further processing needed)
    // to do this, we first sort by cost, so filter() will return lowest cost
    augmentList.sort((a, b) => {
      return a.cost - b.cost;
    });

    const hasTargetAlready = augmentList.filter(x => x.value === value);
    if (hasTargetAlready[0]) {
      augmentList = [hasTargetAlready[0]];
    }
    
    console.log(augmentList);
    let found = false;
    let sortedSolutions = [];
    let expandLimit = 3;
    let expandNum = 1;
    while (!found && expandNum < expandLimit) {
      const expandedAugments = getExpandedAugments(augmentList, expandNum);
      const solver = new Solver(expandedAugments, value, "value");
      const unsortedSolutions = solver.run();
      if (solver.hasSolution) {
        sortedSolutions = getSortedUniqueSolutions(unsortedSolutions).filter(x => x.totalAugments < 7);
        found = true;
      } else {
        if (solver.noSolutionType === 1) { // out of bounds (< - or > +)
          let boundsSolution = [];
          const positiveSum = expandedAugments.filter(x => x.value < 0).reduce((partialSum, a) => partialSum + a.value, 0);

          expandedAugments.sort((a, b) => {
            return b.value - a.value;
          });

          let est = (value > positiveSum) ? expandedAugments[0] : expandedAugments[expandedAugments.length - 1];
          const edgeCount = Math.floor(value / est);
          const leftover = value % est;

          for (let i = 0; i < edgeCount; i++) {
            boundsSolution.push(est);
          }

          const tempSolver = new Solver(expandedAugments, leftover, "value");
          const tempSolutions = tempSolver.run();
          if (tempSolver.hasSolution) {
            const tempSortedSolutions = getSortedUniqueSolutions(tempSolutions).filter(x => x.totalAugments < 7);
            sortedSolutions = [ ...boundsSolution, ...tempSortedSolutions[0] ];
            found = true;
          }

        }
      }

      expandNum++;
    }

    if (!sortedSolutions[0]) {
      console.warn(`no solution found for ${key} mod by ${value}`);
    }

    const tax = {
      cost: sortedSolutions[0]?.totalCost || 0,
      augments: sortedSolutions[0]?.totalAugments || 0,
    };

    tempBudgetDiffs.set(key, tax.cost);
    tempAugmentDiffs.set(key, tax.augments);

    return {
      tempBudgetDiffs,
      tempAugmentDiffs,
    };
  };

  const store = pool => {
    // debug function used to pre-roll defense values to store them as json map objects
    // [value, { combo, budget, cost }]

    var defHardLimits = new Map([
      ["1", {
        upper: 280,
        lower: -84
      }],
      ["2", {
        upper: 224,
        lower: -84
      }],
      ["3", {
        upper: 182,
        lower: -84
      }],
      ["4", {
        upper: 140,
        lower: -84
      }],
      ["5", {
        upper: 112,
        lower: -84
      }],
      ["6", {
        upper: 84,
        lower: -84
      }],
      ["13", {
        upper: 84,
        lower: -84
      }],
    ]);

    var preRolls = new Map();
    
    const limit = defHardLimits.get(pool);
    for (let value = limit.lower; value <= limit.upper; value++) {
      if (value === 0) { continue; }
      if (preRolls.get(value)) {
        return;
      } // don't need duplicates
      console.log("__" + value + "__");

      const potentialAugmentList = AUGMENTS.slice(0).filter(x =>
        x.pool === pool &&
        x.description.indexOf("Defense") !== -1
      );
      let augmentList = [];
      for (const x of potentialAugmentList) {
        for (let i = 0; i < 3; i++) {
          const lv = x[`level${i+1}`];

          if (lv !== 0) {
            augmentList.push({
              id: x.id,
              description: x.description,
              value: lv,
              cost: x.cost,
            });
          }
        }
      }

      const hasTargetAlready = augmentList.filter(x => x.value === value)[0];
      if (hasTargetAlready) {
        augmentList = [hasTargetAlready];
      }

      let found = false;
      let bestSolution;
      let expandLimit = 2;
      let expandNum = 1;
      while (!found && !hasTargetAlready && expandNum <= expandLimit) {
        const expandedAugments = getExpandedAugments(augmentList, expandNum);

        expandedAugments.sort((a, b) => {
          return b.value - a.value;
        });

        console.log(`__value check: value, max, min`, value, expandedAugments[0].value, expandedAugments[expandedAugments.length - 1].value);
        if (value > expandedAugments[0].value || value < expandedAugments[expandedAugments.length - 1].value) {
          console.log("REDUCING...", expandedAugments);
          bestSolution = getReducedArray(expandedAugments.slice(0), value)[0];
          console.log("REDUCED SOLUTION", bestSolution);
          if (bestSolution) {
            found = true;
          }
        }

        if (!found) {
          const solver = new Solver(expandedAugments.slice(0), value, "value");
          const unsortedSolutions = solver.run();
          if (solver.hasSolution) {
            bestSolution = getSortedUniqueSolutions(unsortedSolutions)[0];
            found = true;
          } else {
            if (solver.noSolutionType === 1) { // out of bounds (< - or > +)
              bestSolution = getReducedArray(expandedAugments.slice(0), value)[0];
              if (bestSolution) {
                found = true;
              }
            }
          }          
        }

        expandNum++;
      }

      if (hasTargetAlready) {
        console.log("\tez grab", value);
        bestSolution = getSortedUniqueSolutions([augmentList])[0];
      }

      if (!bestSolution) {
        console.warn(`no solution found for Defense mod by ${value}`);
      }

      const tax = {
        cost: bestSolution?.totalCost || 0,
        augments: bestSolution?.totalAugments || 0,
      };

      preRolls.set(value, tax);
    }

    console.log("pre rolls", preRolls);
  };
  
  const getActiveSkills = () => {
    const armorSkills = currentArmor.skills.map((skillContainer) => {
      return {
        skill: getSkillByName(skillContainer.name),
        currentSkillLevel: skillContainer.level
      };
    });

    return [...armorSkills, ...modSkills];
  };

  const updateDiffs = (key, value) => {
    const tempDiffs = new Map(diffs);
    tempDiffs.set(key, value);

    setDiffs(tempDiffs);
    console.log(tempDiffs);

    const newDiffs = calculateAugmentCount(tempDiffs, key, value);

    setBudgetDiffs(newDiffs.tempBudgetDiffs);
    setAugmentDiffs(newDiffs.tempAugmentDiffs);

    console.log("newDiffs", newDiffs);
  };

  const onArmorChange = armor => {
    console.log("Armor Changed", armor);

    setCurrentArmor(armor);
  };

  const onNewSkill = skill => {
    console.log(skill);

    const activeSkills = getActiveSkills();
    const alreadyExists = activeSkills.filter(x => x.skill.name === skill.name)[0];
    if (alreadyExists) {
      console.warn("tried to add duplicate skill " + skill.name);
      return;
    }

    const tempModSkills = modSkills.slice(0);
    tempModSkills.push({
      skill,
      currentSkillLevel: 0,
      new: true,
    });
    setModSkills(tempModSkills);

    updateDiffs("_" + skill.name, 1);
  };

  const onSkillDropped = skill => {
    const tempModSkills = modSkills.slice(0).filter(x => x.skill.name !== skill.name);
    setModSkills(tempModSkills);

    updateDiffs("_" + skill.name, 0);
  };

  const onStatUpdate = stat => {
    const key = getStatKey(stat, currentArmor?.pool);
    console.log("new stat", stat);
    console.log(key);

    updateDiffs(stat.label, stat.value);
  };

  const onSkillLevelChanged = (skill, levelDiff) => {
    console.log(skill.name + " mod", levelDiff);
    
    updateDiffs("_" + skill.name, levelDiff);
  };

  const onSlotsUpdated = (slotsAdded, sDiffs) => {
    console.log("Slots diff", slotsAdded);

    setSlotDiffs(sDiffs);
    updateDiffs("Slot", slotsAdded);
  };

  const renderSkills = () => {
    const activeSkills = getActiveSkills();

    const displaySkills = activeSkills.map((x, index) =>
      <SkillInput
        key={`skillInput-${index}`}
        skill={x.skill}
        currentSkillLevel={x.currentSkillLevel}
        onSkillLevelChanged={onSkillLevelChanged}
        onSkillDropped={onSkillDropped}
        new={x.new}
        disabled={currentArmor?.pool === "13"}
      />
    );
    
    return <SkillsBox>
      <SkillDecoration>Skills</SkillDecoration>
      {displaySkills}
    </SkillsBox>;
  };

  const renderInputs = () => {
    if (!currentArmor || reset) { return null; }

    let budgetStyle = {};
    let augmentStyle = {};

    if (budget > currentArmor?.budget) {
      budgetStyle = { color: "red" };
    }

    if (augmentCount > 7) {
      augmentStyle = { color: "red" };
    }

    return (
      <AugmentBox>
        <AugmentHeader>Augmented Status</AugmentHeader>
        <SpacedDiv style={{ marginTop: '1em' }}>
          <Label>Budget Used</Label>
          <Label style={ budgetStyle }>{budget}/{currentArmor?.budget}</Label>
        </SpacedDiv>
        <SpacedDiv>
          <Label>Augments Used</Label>
          <Label style={ augmentStyle }>{augmentCount}/7</Label>
        </SpacedDiv>
        <br />
        <SlotInput slots={currentArmor.slots} onSlotsUpdated={onSlotsUpdated} />
        <LabeledInput label="Defense" defaultValue={currentArmor.defense}
          onChange={onStatUpdate} pool={currentArmor?.pool} icon={GENERIC}
          iconStyle={{ width: '16px', left: '-2px', top: '3px' }}
        />
        <LabeledInput label="Fire Resistance" defaultValue={currentArmor.resistances.fire} onChange={onStatUpdate} pool={currentArmor?.pool} icon={FIRE} />
        <LabeledInput label="Water Resistance" defaultValue={currentArmor.resistances.water} onChange={onStatUpdate} pool={currentArmor?.pool} icon={WATER} />
        <LabeledInput label="Thunder Resistance" defaultValue={currentArmor.resistances.thunder} onChange={onStatUpdate} pool={currentArmor?.pool} icon={THUNDER} />
        <LabeledInput label="Ice Resistance" defaultValue={currentArmor.resistances.ice} onChange={onStatUpdate} pool={currentArmor?.pool} icon={ICE} />
        <LabeledInput label="Dragon Resistance" defaultValue={currentArmor.resistances.dragon} onChange={onStatUpdate} pool={currentArmor?.pool} icon={DRAGON} />
        {renderSkills()}
        {currentArmor?.pool !== "13" &&
          <Datalist id="skillList" list={skillList.filter(x => x.augmentable)}
            onChange={onNewSkill} placeholder="Add New Skill" dontPersist
            style={{ margin: '1em' }}
          />
        }
        {DEBUG_MODE && <button onClick={() => store("13")}>test</button>}
      </AugmentBox>
    );
  };

  return (
    <div className="App">
      <Datalist id="armorList" list={armorList}
        onChange={onArmorChange} placeholder="Select Armor"
        style={{ marginBottom: '1em' }}
      />
      {renderInputs()}
      <Footer>
        <Link target={"_blank"} href={'https://cinnamoonie.tumblr.com/post/174059151817/some-monster-hunter-patterns-feel-free-to-use'}>background credit</Link>
        <Link target={"_blank"} href={'https://docs.google.com/spreadsheets/d/1FFYv2em4LErylP6_dlzZ7Zt3h76UluzU3f1dpZCeP8w/'}>data used</Link>
        <Link target={"_blank"} href={'https://jsfiddle.net/InfexiousBand/vapog15j/13/show'}>Charm Tool</Link>
      </Footer>
    </div>
  );
};

export default App;
