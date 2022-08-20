// derived and converted from c++ to javascript using following source: 
// https://towardsdatascience.com/how-to-find-all-solutions-to-the-subset-sum-problem-597f77677e45

/**
 * Returns all possible solutions of the subset-sum problem, given integer values
 * Can handle both negative and positive, as well as repeating values
 * @param {array} arr - Either a plain integer array or an object array containing objects in format { [valueKey] }
 * @param {integer} target - Target integer to sum to
 * @param {string} valueKey - Name of the field which contains the integer value if using an object array
 */
export function Solver(arr, target, valueKey) {
    const MAX_SOLUTIONS = 5000;

    const NO_SOLUTION = {
        NO_COMBO: 0,
        OUT_OF_BOUNDS: 1,
        MANUAL_CUTOFF: 2,
        EMTPY_ARRAY: 3,
    };

    this.valueKey = valueKey;
    this.plainArr = []; // used for display logging purposes only
    this.nums = arr.slice(0);
    this.target = target;
    this.noSolutionType = NO_SOLUTION.NO_COMBO; //0 - no combo, 1 - out of bounds, 2 - manual cutoff, 3 - empty array

    this.hasSolution = true;
    this.queue = [];

    this.dpTable = undefined;
    this.negativeSum = 0;
    this.positiveSum = 0;
    this.rowCount = 0;
    this.colCount = 0;

    this.signFlipped = false;

    Solver.prototype.test = () => {
        console.log("basic solution test");
        const basicTest = new Solver([-2, 2, -1, 1, 0], 0).run();

        console.log("repeating test");
        const repeatingTest = new Solver([-1, -1, 0, 1, 1], 0).run();

        console.log("target too high test");
        const targetTooHighTest = new Solver([-3, -5, 0, 4, 3], 8).run();
        
        console.log("target too low test");
        const targetTooLowTest = new Solver([-3, -5, 0, 4, 3], -9).run();

        console.log("max target test");
        const maxTargetTest = new Solver([-1, -1, 1, 1], 2).run();

        console.log("min target test");
        const minTargetTest = new Solver([-1, -1, 1, 1], -2).run();

        //console.log("combinatorial test");
        //const combinatorialTest = new Solver([0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 0).run();
    };

    // gets array value
    // handles plain array (number) values (num[index])
    // and object array values (num[index].valueKey)
    Solver.prototype.get = index => {
        if (this.valueKey) {
            return (this.nums[index])[this.valueKey];
        }

        return this.nums[index];
    };

    Solver.prototype.getPlainArray = pArr => {
        if (this.valueKey) {
            return pArr.slice(0).map(x => x[this.valueKey]);
        }

        return pArr.slice(0);
    };

    Solver.prototype.flipSigns = (way = true) => {
        this.signFlipped = way;
        this.target *= -1;

        if (this.valueKey) {
            this.nums = this.nums.slice(0).map(x => {
                return {
                    ...x,
                    [this.valueKey]: x[this.valueKey] * -1,
                };
            });

            return;
        }

        this.nums = this.nums.map(x => x * -1);
    };

    Solver.prototype.sortArray = () => {
        if (this.valueKey) {
            this.nums.sort((a, b) => {
                return a[this.valueKey] - b[this.valueKey];
            });

            return;
        }

        this.nums.sort();
    };

    Solver.prototype.getNegativeArraySum = () => {
        if (this.valueKey) {
            return this.nums.filter(x => x[this.valueKey] < 0).reduce((partialSum, a) => partialSum + a[this.valueKey], 0);
        }

        return this.nums.filter(x => x < 0).reduce((partialSum, a) => partialSum + a, 0);
    };

    Solver.prototype.getPositiveArraySum = () => {
        if (this.valueKey) {
            return this.nums.filter(x => x[this.valueKey] > 0).reduce((partialSum, a) => partialSum + a[this.valueKey], 0);
        }

        return this.nums.filter(x => x > 0).reduce((partialSum, a) => partialSum + a, 0);
    };
    
    // originally used to keep original order of array,
    // but that is not important for what I'm using it for
    Solver.prototype.genSolution = item => {
        return item.take;
    };

    Solver.prototype.initSolutionIterator = () => {
        if (this.hasSolution) {
            this.queue.push({
                row: this.rowCount - 1,
                col: this.target - this.negativeSum, // ??? in their github, it's 'this.colCount - 1', which was causing failures here
                take: [this.rowCount - 1],
                togo: this.target - this.get(this.rowCount - 1),
            });
        }
    };

    Solver.prototype.fillDpTable = () => {
        // fill first row of table
        for (let j = 0; j < this.colCount; ++j) {
            this.dpTable[j] = this.get(0) === (this.negativeSum + j);
        }
        
        // fill remaining rows
        for (let i = 1; i < this.rowCount; ++i) {
            for (let j = 0; j < this.colCount; ++j) {
                const current = i * this.colCount + j;
                const previous = (i - 1) * this.colCount + j;
                const s = this.negativeSum + j;
                this.dpTable[current] = this.dpTable[previous] || this.get(i) === s;
                if (!this.dpTable[current]) {
                    const nextColumn = s - this.get(i) - this.negativeSum;
                    if (0 <= nextColumn && nextColumn < this.colCount) {
                        this.dpTable[current] = this.dpTable[previous - j + nextColumn];
                    }
                }
            }
        }
    };

    Solver.prototype.genNextSolution = () => {
        if (!this.hasSolution) { return []; }
        
        while (this.queue.length > 0) {
            const item = this.queue.pop();
            
            const row = item.row;
            const col = item.col;
            
            // scenario 1
            if (row > 0 && this.dpTable[(row - 1) * this.colCount + col]) {
                let take = item.take.slice(0); // possibly just use take here
                take[take.length - 1] = row - 1;
                const togo = item.togo + this.get(row) - this.get(row - 1);
                this.queue.push({
                    row: row - 1,
                    col,
                    take,
                    togo,
                });
            }
            
            // scenario 2
            const nextCol = col - this.get(row);
            if (row > 0 && 0 <= nextCol && nextCol < this.colCount) {
                if (this.dpTable[(row - 1) * this.colCount + nextCol]) {
                    let take = item.take.slice(0); // possibly just use take here
                    take.push(row - 1);
                    const togo = item.togo - this.get(row - 1);
                    this.queue.push({
                        row: row - 1,
                        col: nextCol,
                        take,
                        togo,
                    });				
                }
            }
            
            // scenario 3
            if (item.togo === 0) {
                return this.genSolution(item);
            }
        }
        
        return [];
    };
    
    Solver.prototype.run = () => {
        if (this.nums.length === 0) {
            this.noSolutionType = NO_SOLUTION.EMTPY_ARRAY;
            this.hasSolution = false;
            return;
        }

        this.plainArr = this.getPlainArray(this.nums);

        console.log(`[${this.plainArr.join(", ")}], target = ${this.target}`);
        
        // if target is negative, flip sign of target and all array elements
        if (this.target < 0) {
            this.flipSigns();
        }
        
        // now sort array in ascending order
        this.sortArray();
        
        this.negativeSum = this.getNegativeArraySum();
        this.positiveSum = this.getPositiveArraySum();
        
        if (this.target < this.negativeSum || this.target > this.positiveSum) {
            this.noSolutionType = NO_SOLUTION.OUT_OF_BOUNDS;
            this.hasSolution = false;
            console.warn("target < negative or > positiveSum, no solution");
            return;
        }
        
        this.rowCount = this.nums.length;
        this.colCount = this.target - this.negativeSum + 1;

        // shouldn't be necessary
        /*
        if (this.rowCount * this.colCount < 0) {
            this.noSolutionType = NO_SOLUTION.EMTPY_ARRAY;
            this.hasSolution = false;
            return;
        }
        */
        
        this.dpTable = new Array(this.rowCount * this.colCount);
        
        this.fillDpTable();

        // if bottom-right cell of table is not true, then
        // a solution does not exist
        if (!this.dpTable[this.rowCount * this.colCount - 1]) {
            this.noSolutionType = NO_SOLUTION.NO_COMBO;
            this.hasSolution = false;
        }
        
        this.initSolutionIterator();

        let ret = [];
        let solution = this.genNextSolution();

        console.groupCollapsed("solutions");
        while (solution.length > 0) {
            // prevent seemingly-infinite solution searching
            if (ret.length > MAX_SOLUTIONS) {
                console.warn("hit solution hard max of " + MAX_SOLUTIONS);
                break;
            }

            let subset = [];
            let sum = 0;

            // makes sure to flip signs back if we flipped them at beginning
            // because of a negative target. normally this doesn't matter, but
            // if solution subsets only contain negative numbers, they will
            // show up as positive incorrectly
            if (this.signFlipped) {
                this.flipSigns();
            }

            // loop through array of this solution, eg. [2, 4] or [{ id: "A", [valueKey]: 2 }, { id: "B", [valueKey]: 4 }]
            for (const index of solution) {
                subset.push(this.nums[index]);
                sum += this.get(index);
            }
            
            console.log(subset, `sum = ${sum}`);
            ret.push(subset);

            // flip sign back for next solution in loop
            if (this.signFlipped) {
                this.flipSigns();
            }

            solution = this.genNextSolution();
        }
        console.groupEnd();

        // return only unique solutions if not an object array
        if (!this.valueKey) {
            ret = Array.from(new Set(ret.map(JSON.stringify)), JSON.parse);
        }

        console.log(`${this.valueKey ? 'all' : 'unique'}`, ret);
        console.log("--------------------------");
        return ret;
    };
};
