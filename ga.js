const updateView = (a, b, c, d, e, f, result, generation) => {
    if (typeof window === 'undefined') {
        return;
    }

    const aEl = document.getElementById('a');
    const bEl = document.getElementById('b');
    const cEl = document.getElementById('c');
    const dEl = document.getElementById('d');
    const eEl = document.getElementById('e');
    const [f1El, f2El] = [document.getElementById('f'), document.getElementById('f2')];
    const resultEl = document.getElementById('result');
    const generationEl = document.getElementById('generation');

    aEl.innerHTML = a;
    bEl.innerHTML = b;
    cEl.innerHTML = c;
    dEl.innerHTML = d;
    eEl.innerHTML = e;
    f1El.innerHTML = f;
    f2El.innerHTML = f;
    resultEl.innerHTML = result;
    generationEl.innerHTML = generation;
}

const equation = (a, b, c, d, e, f) => a**2 / b + c**2 - d*0.5 - e/f - f**2;
const result = 5000;


const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const fitness = (genome) => {
    const [a, b, c, d, e, f] = genome;
    const score = Math.abs(equation(a, b, c, d, e, f) - result);

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

const run = async (maxGenerations, populationSize, mutationRate) => {
    let population = createInitialPopulation(populationSize, 6);

    for (let i = 0; i < maxGenerations; i++) {
        await new Promise((resolve) => setTimeout(resolve, 10));
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

        updateView(...parents[0], equation(...parents[0]), i + 1);

        if (fitness(parents[0]) === 0) {
            
            console.log(`Best genome: ${parents[0]}`);

            return;
        }
    }
}


run(
    maxGenerations = 1000,
    populationSize = 100,
    mutationRate = 0.1
)