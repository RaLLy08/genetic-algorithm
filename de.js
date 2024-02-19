/**
 * Differential Evolution (DE) algorithm
 */
class DE extends GA {
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
            randMutationFunction,
            CR,
            scalingFactor
        }
    ) {
        super({
            maxGenerations, 
            populationSize, 
            mutationRate, 
            elite, 
            bestSurvivePercent, 
            genomeLength,
            fitnessFunction,
            randPopulationFunction,
            randMutationFunction
        });

        this.CR = CR;
        this.scalingFactor = scalingFactor;
    }

    /** 
     * @param {Array} genomeA
     * @param {Array} genomeB
     * @returns {Array} child - New genome created from half of genomeA and half of genomeB
     * */
    crossover(genomeA, genomeB, genomeC) {
        const child = [];
    
        for (let i = 0; i < genomeA.length; i++) {
            if (Math.random() < this.CR) {
                child.push(genomeA[i] + this.scalingFactor * (genomeB[i] - genomeC[i]));
            } else {
                child.push(genomeA[i]);
            }
        }
    
        return child;
    }


    /**
     * Adding new population by creating children from population
    */
    addNewPopulation() {
        const newPopulation = [];

        const parents = this.population;
        const eliteSize = this.elite * this.population.length;
    
        for (let j = 0; j <= parents.length - 1; j++) {
            const parentA = parents[j];
            const parentB = parents[Math.floor(Math.random() * parents.length)];
            const parentC = parents[Math.floor(Math.random() * parents.length)];
            // Crossover between best parent and random parent to increase diversity

            if (j < eliteSize) {
                // Elite genomes pass to next generation without changes
                newPopulation.push(parentA);
                continue;
            }
            
            const child = this.crossover(parentA, parentB, parentC);
        
            if (Math.random() < this.mutationRate) {
                // Mutate child with probability of mutationRate
                this.mutate(child);
            }
    
            newPopulation.push(child);
        }
    
        this.population.push(...newPopulation);
    }

}
