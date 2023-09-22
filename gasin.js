const getSine = (t) => (amplitude, frequency, phase) => {
    return amplitude * Math.sin(Math.PI/180 * frequency * t + phase);
}
const randFloat = (min, max) => {
    return Math.trunc((min + (Math.random() * (max - min)) ) * 10) / 10
}
const equation = (t) => {
    const sine = getSine(t);

    return sine(1, 1, 10);
}

const dataX = Array.from({ length: 1000 }, (_, i) => i);
const noisedDataY = dataX.map((t) => {
    const sine = getSine(t);

    return sine(1, 1, 10) + sine(0.5, 20, 10);
});
const dataYWithoutNoise = dataX.map(equation);


const getDistances = (yData) => {
    return yData.map((y1, i) => {
        const y2 = equation(i);

        return Math.abs(y1 - y2);
    })
}

const getDistancesSum = (yData) => {
    const distances = getDistances(yData);

    return distances.reduce((acc, distance) => {
        return acc + distance;
    }, 0);
}

const getRootMeanSquare = (yData) => {
    const distances = getDistances(yData);

    const sum = distances.reduce((acc, distance) => {
        return acc + Math.pow(distance, 2);
    }, 0);

    return Math.sqrt(sum / distances.length);
}


// GA

const fitness = (params) => {
    const [amplitude, frequency, phase] = params;

    const yData = noisedDataY.map((ny, t) => {
        const sine = getSine(t);

        return ny + sine(amplitude, frequency, phase);
    });

    return getRootMeanSquare(yData);
}

console.log(fitness([-0.2, 20, 10]).toFixed(5));
console.log(fitness([-0, 20, 10]).toFixed(5));

const createInitialPopulation = (populationSize, genomeLength) => {
    const population = [];

    for (let i = 0; i < populationSize; i++) {
        const genome = [];

        for (let j = 0; j < genomeLength; j++) {
            genome.push(
                randFloat(-10, 10)
            );
        }

        population.push(genome);
    }

    return population;
}

const selection = (population, surviveSize) => {
    const sorted = population.sort((a, b) => fitness(a) - fitness(b));

    return sorted.slice(0, surviveSize);
}

const reduction = (population, surviveSize, eliteSize) => {
  for (let i = eliteSize; i < population.length - surviveSize; i++) {
    population.splice(Math.floor(Math.random() * population.length), 1);
  }
}

const crossover = (genomeA, genomeB) => {
    const child = [];

    child.push(genomeA[0]);
    child.push(genomeB[1]);
    child.push(genomeB[2]);
    
  
    return child;
}

const mutate = (genome) => {
    const index = Math.floor(Math.random() * genome.length);

    genome[index] += randFloat(-1, 1);
}

const nextGeneration = (parents, mutationRate, eliteSize) => {
    const newPopulation = [];

    for (let j = 0; j < parents.length - 3; j++) {
        const parentA = parents[Math.floor(Math.random() * parents.length)];
        const parentB = parents[Math.floor(Math.random() * parents.length)];
        // const parentC = parents[Math.floor(Math.random() * parents.length)];
        // const parentD = parents[Math.floor(Math.random() * parents.length)];

        // const sortedFitness = [parentA, parentB, parentC, parentD].sort((a, b) => fitness(a) - fitness(b));

        const child = crossover(parentA, parentB);

        if (Math.random() < mutationRate && j > eliteSize) {
            mutate(child);
        }

        newPopulation.push(child);
    }

    return newPopulation;
}


const run = (maxGenerations, populationSize, mutationRate) => {
    let population = createInitialPopulation(populationSize, 3);

    for (let i = 0; i < maxGenerations; i++) {

        // will remove worst 20% amount of parents
        const parentSurvivePercent = 0.8;

        const parents = selection(population, population.length * parentSurvivePercent);
        const eliteSize = 0.2 * population.length;
        // will create children from 80% parents 

        const familyPopulation = [
            ...parents, 
            ...nextGeneration(parents, mutationRate, eliteSize)
        ];

        // will remove keep same population size
        reduction(eliteSize, familyPopulation, populationSize);

        console.log(`Generation: ${i} | Fitness: ${fitness(parents[0])} | result: ${familyPopulation[99]}`);

        if (fitness(parents[0]) === 0) {
            console.log(`Best genome: ${parents[0]}, result: ${equation(...parents[0])}`);
            return;
        }
    }
}

run(
    maxGenerations = 1000,
    populationSize = 100,
    mutationRate = 0.9
)
