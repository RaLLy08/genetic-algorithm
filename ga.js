class GA {
    static pickRandomElements(arr, numElements) {
        const shuffledArray = [...arr];
      
        // Fisher-Yates shuffle algorithm
        for (let i = shuffledArray.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
        }
      
        return shuffledArray.slice(0, numElements);
    }

    constructor(
        {
            maxGenerations, 
            populationSize, 
            mutationRate, 
            elite, 
            bestSurvivePercent, 
            genomeLength,
            fitnessFunction,
            randPopulationFunction,
            randMutationFunction
        }
    ) {
        this.maxGenerations = maxGenerations;
        this.populationSize = populationSize;
        this.mutationRate = mutationRate;
        this.elite = elite;
        this.bestSurvivePercent = bestSurvivePercent;
        this.genomeLength = genomeLength;
        this.fitnessFunction = fitnessFunction;
        this.randPopulationFunction = randPopulationFunction;
        this.randMutationFunction = randMutationFunction;

        this.population = [];
        this._terminate = false;
    }

    createInitialPopulation = () => {
        this.population = [];
    
        for (let i = 0; i < this.populationSize; i++) {
            const genome = [];
    
            for (let j = 0; j < this.genomeLength; j++) {
                genome.push(
                    this.randPopulationFunction()
                );
            }
    
            this.population.push(genome);
        }
    }

    selection(bestSurvivePercent, populationSize) {
        const sorted = this.population.sort((a, b) => this.fitnessFunction(a) - this.fitnessFunction(b));
    
        const bestParentSurviveSize = Math.floor(populationSize * bestSurvivePercent);
        const badParentSurviveSize = populationSize - bestParentSurviveSize;
    
        const bestSurvive = sorted.slice(0, bestParentSurviveSize);
        const restSurvive = sorted.slice(bestParentSurviveSize, this.population.length);
    
        const badSurvive = GA.pickRandomElements(restSurvive, badParentSurviveSize);
    
        this.population = [
            ...bestSurvive,
            ...badSurvive
        ];
    }

    crossover(genomeA, genomeB) {
        const mid = Math.floor(this.genomeLength / 2);
    
        const child = [...genomeA.slice(0, mid), ...genomeB.slice(mid)];
    
        return child;
    }
    
    mutate = (genome) => {
        const index = Math.floor(Math.random() * genome.length);
        const delta = this.randMutationFunction();

        genome[index] += delta;
    }

    addNewPopulation(mutRandMin, mutRandMax) {
        const newPopulation = [];

        const parents = this.population;
        const eliteSize = this.elite * this.population.length;
    
        for (let j = 0; j <= parents.length - 1; j++) {
            const parentA = parents[j];
            const parentB = parents[Math.floor(Math.random() * parents.length)];

            if (j < eliteSize) {
                newPopulation.push(parentA);
                continue;
            }

            const child = this.crossover(parentA, parentB);
        
            if (Math.random() < this.mutationRate) {
                this.mutate(child, mutRandMin, mutRandMax);
            }
    
            newPopulation.push(child);
        }
    
        this.population.push(...newPopulation);
    }

    async run(delay=0, onGeneration=()=>{}) {
        this.createInitialPopulation();

        for (let i = 0; i < this.maxGenerations; i++) {   
            if (this._terminate) {
                return;
            }
            
            await new Promise(resolve => setTimeout(resolve, delay));

            // will create children from bestSurvivePercent% parents 
            this.addNewPopulation();
    
            this.selection(this.bestSurvivePercent, this.populationSize);
    
            onGeneration(i);
        }
    }

    terminate() {
        this._terminate = true;
    }
}