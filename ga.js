const equation = (a, b, c, d) => a**2 / b + c**2 - d;
const result = 100;


const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const fitness = (genome) => {
    const [a, b, c, d] = genome;
    const score = Math.abs(equation(a, b, c, d) - result);

    return score;
}

const crossover = (genomeA, genomeB) => {
    const mid = Math.floor(genomeA.length / 2);

    const child = [...genomeA.slice(0, mid), ...genomeB.slice(mid)];

    return child;
}

const mutate = (genome) => {
    const index = randomInt(0, genome.length - 1);
    const delta = randomInt(-1, 1);
    genome[index] += delta;

    return genome;
}

const createInitialPopulation = (populationSize, genomeLength) => {
    const population = [];

    for (let i = 0; i < populationSize; i++) {
        const genome = [];

        for (let j = 0; j < genomeLength; j++) {
            genome.push(randomInt(0, 30));
        }

        population.push(genome);
    }

    return population;
}

const reduction = (population, surviveSize) => {
    const sorted = population.sort((a, b) => fitness(a) - fitness(b));

    return sorted.slice(0, surviveSize);
}

const nextGeneration = (parents, mutationRate) => {
    const newPopulation = [];

    for (let j = 0; j < parents.length - 1; j++) {
        const parentA = parents[j];
        const parentB = parents[1 + j];

        const child = crossover(parentA, parentB, parentA.length);

        if (Math.random() < mutationRate) {
            mutate(child);
        }

        newPopulation.push(child);
    }

    return newPopulation;
}

const run = (maxGenerations, populationSize, mutationRate) => {
    let population = createInitialPopulation(populationSize, 4);

    for (let i = 0; i < maxGenerations; i++) {

        // will remove worst 20% amount of parents
        const parentSurvivePercent = 0.8;
        const parents = reduction(population, population.length * parentSurvivePercent);
        
        // will create children from 80% parents 

        const familyPopulation = [
            ...parents, 
            ...nextGeneration(parents, mutationRate)
        ];

        // will remove keep same population size
        population = reduction(familyPopulation, populationSize);

        console.log(`Generation: ${i} | Fitness: ${fitness(parents[0])} result: ${equation(...parents[0])}`);

        if (fitness(parents[0]) === 0) {
            
            console.log(`Best genome: ${parents[0]}`);

            return;
        }
    }
}

run(
    maxGenerations = 100,
    populationSize = 100,
    mutationRate = 0.01
)