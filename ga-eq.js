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

// Fitness function is used to evaluate how close is genome to the result
const fitness = (genome) => {
    const [a, b, c, d, e, f] = genome;
    const score = Math.abs(equation(a, b, c, d, e, f) - result);

    return score;
}

const gaParams = {
    maxGenerations: 1000,
    populationSize: 200,
    mutationRate: 0.3,
    bestSurvivePercent: 0.4,
    elite: 0,
    genomeLength: 6,
    fitnessFunction: fitness,

    // Generate random integer to simplify equation
    randPopulationFunction: () => randomInt(0, 30),
    randMutationFunction: () => randomInt(-1, 1),
    CR: 0.9,
    scalingFactor: 1
}

let ga = new GA(gaParams);


const runGa = () => {
    ga.run(10, (g) => {
        const bestGenome = ga.population[0];

        updateView(...bestGenome, equation(...bestGenome), g);

        
        if (fitness(bestGenome) === 0) {
            ga.terminate();
        }
    });
}

runGa();

if (typeof window !== 'undefined') {
    document.getElementById('run').onclick = () => {
        ga.terminate();

        ga = new GA(gaParams);

        runGa();
    }
}