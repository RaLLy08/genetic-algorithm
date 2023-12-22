 // amplitude, frequency, phase

const originalSineParameters = [
    0.5 + 2 * Math.random(), 
    10 * Math.random(),
    10 + Math.random() * 20
];
const noiseSineParams = [
    0.5 + Math.random() * 2,
    5 + Math.random() * 15,
    2 + Math.random() * 10
];


const views = {
    originalSine: [
        document.getElementById('original-A'),
        document.getElementById('original-F'),
        document.getElementById('original-P'),
    ],
    noisedSine: [
        document.getElementById('noised-A'),
        document.getElementById('noised-F'),
        document.getElementById('noised-P'),
    ],
    targetSine: [
        document.getElementById('target-A'),
        document.getElementById('target-F'),
        document.getElementById('target-P'),
    ]
}

views.originalSine.forEach((view, i) => {
    view.innerHTML = originalSineParameters[i].toFixed(3);
})

views.noisedSine.forEach((view, i) => {
    view.innerHTML = noiseSineParams[i].toFixed(3);
})


const updateView = (amplitude, frequency, phase, bestFitness, generation) => {
    document.getElementById('generation').innerHTML = generation;
    document.getElementById('best-fitness').innerHTML = Number(bestFitness).toFixed(3);

    views.targetSine.forEach((view, i) => {
        view.innerHTML = [amplitude.toFixed(3), frequency.toFixed(3), phase.toFixed(3)][i];
    })
}

const mapRange = (toMin, toMax, fromMin, fromMax) => value => {
    return (value - fromMin) * (toMax - toMin) / (fromMax - fromMin) + toMin;
}

const dataXLength = 800;

const getSine = (t) => (amplitude, frequency, phase) => {
    return amplitude * Math.sin(
            mapRange(
                -Math.PI, Math.PI, 0, dataXLength
            )(frequency * t + phase)
    );
}

const randFloat = (min, max) => {
    return Math.trunc((min + (Math.random() * (max - min)) ) * 10) / 10
}

const originalEquation = (t) => {
    const sine = getSine(t);

    return sine(...originalSineParameters);
}


const dataX = Array.from({ length: dataXLength }, (_, i) => i);

const dataYWithoutNoise = dataX.map(originalEquation);


const getDistances = (yData) => {
    return yData.map((y1, i) => {
        const y2 = originalEquation(i);

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


const applySineToData = (params, data) => {
    const [amplitude, frequency, phase] = params;

    return data.map((ny, t) => {
        const sine = getSine(t);

        return ny + sine(amplitude, frequency, phase);
    });
}
 

const noisedDataY = applySineToData(
    noiseSineParams, dataYWithoutNoise
);


let optimumPath, x, yBlack;

if (typeof window !== 'undefined') {
    const xData = dataX;

    const yRedData = dataYWithoutNoise;
    const yBlackData = noisedDataY;

    // Declare the chart dimensions and margins.
    const width = 1480;
    const height = 500;
    const marginTop = 60;
    const marginRight = 20;
    const marginBottom = 40;
    const marginLeft = 160;

    // Declare the x (horizontal position) scale.
    x = d3.scaleLinear()
        .domain([0, d3.max(xData)])
        .range([marginLeft, width - marginRight]);


    // Declare the y (vertical position) scale.
    const y = d3.scaleLinear()
        .domain([-d3.max(yBlackData), d3.max(yBlackData)])
        .range([height - marginBottom, marginTop]);

    const yRed = d3.scaleLinear()
        .domain([-d3.max(yBlackData), d3.max(yBlackData)])
        .range([height - marginBottom, marginTop]);

    yBlack = d3.scaleLinear()
        .domain([-d3.max(yBlackData), d3.max(yBlackData)])
        .range([height - marginBottom, marginTop]);

    // Create the SVG container.
    const svg = d3.create("svg")
        .attr("width", width)
        .attr("height", height);

    // Add the x-axis.
    svg.append("g")
        .attr("transform", `translate(0,${height - marginBottom})`)
        .call(d3.axisBottom(x));

    // Add the y-axis.
    svg.append("g")
        .attr("transform", `translate(${marginLeft},0)`)
        .call(d3.axisLeft(y));

    svg.datum(xData)
        .append("path")
        .attr("fill", "none")
        .attr("stroke", "blue")
        .attr("stroke-width", 1.5)
        .attr("d", d3.line()
            .x((d) => x(d))
            .y((d, i) => y(yBlackData[i]))
        );

    svg.datum(xData)
        .append("path")
        .attr("fill", "none")
        .attr("stroke", "red")
        .attr("stroke-width", 3)
        .attr("d", d3.line()
            .x((d) => x(d))
            .y((d, i) => yRed(yRedData[i]))
        );

   optimumPath = svg
            .append("path")
            .attr("fill", "none")
            .attr("stroke", "black")
            .attr("stroke-width", 3)


    // Append the SVG element.
    container.append(
        svg.node()
    );
}

// GA

const fitness = (params) => {
    const dataY = applySineToData(params, noisedDataY)

    return getDistancesSum(
        dataY
    ).toFixed(5);
}

const createInitialPopulation = (populationSize, genomeLength) => {
    const population = [];

    for (let i = 0; i < populationSize; i++) {
        const genome = [];

        for (let j = 0; j < genomeLength; j++) {
            genome.push(
                randFloat(-40, 40)
            );
        }

        population.push(genome);
    }

    return population;
}

const selection = (population, surviveSize, badParentSurvivePercent) => {
    const sorted = population.sort((a, b) => fitness(a) - fitness(b));

    const badSurviveSize = Math.floor(population.length * badParentSurvivePercent);
    const lastBad = sorted.slice(-badSurviveSize);

    const badSurvive = [];

    for (let i = 0; i < badSurviveSize; i++) {
        const index = Math.floor(Math.random() * lastBad.length);

        badSurvive.push(lastBad[index]);

        lastBad.splice(index, 1);
    }

    return [
        ...sorted.slice(0, surviveSize),
        ...badSurvive
    ];
}

const reduction = (population, surviveSize) => {
    population.splice(surviveSize, population.length);
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
    // let index = 0;

    // if (Math.random() < 0.5) {
    //     index = 2;
    // }

    genome[index] += randFloat(-5, 5);
}

const nextGeneration = (parents, mutationRate, eliteSize) => {
    const newPopulation = [];

    for (let j = 0; j <= parents.length - 1; j++) {
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


const displayDenoisedWave = (bestGenome) => {
    if (typeof window === 'undefined') {
        return;
    }

    const denoised = applySineToData(
        bestGenome,
        noisedDataY
    );

    const xy = dataX.map((x, i) => {
        return [
            x, 
            denoised[i]
        ];
    });

    // replace data in d3 graph
    optimumPath.data([xy])
        .attr("d", d3.line()
            .x((d) => x(d[0]))
            .y((d) => yBlack(d[1]))
        
    );
}

let runCount = 0;

const run = async (
    maxGenerations, 
    populationSize, 
    mutationRate, 
    elite, 
    parentSurvivePercent, 
    badParentSurvivePercent
) => {
    let population = createInitialPopulation(populationSize, 3);

    if (parentSurvivePercent + badParentSurvivePercent < 0.5) {
        throw new Error('parent Survive Percent must be more than 0.5, becuse we return 2 children from 2 parents');
    }

    if (parentSurvivePercent + badParentSurvivePercent > 1) {
        throw new Error('parent Survive Percent + bad Parent Survive Percent must be less than 1');
    }

    const currentRun = runCount;

    for (let i = 0; i < maxGenerations; i++) {
        if (currentRun !== runCount) {
            return;
        }


        await new Promise(resolve => setTimeout(resolve, 0));
        displayDenoisedWave(population[0])

        // will remove worst 20% amount of parents

        const parents = selection(population, population.length * parentSurvivePercent, badParentSurvivePercent);

        const eliteSize = elite * population.length;

        // will create children from parentSurvivePercent% parents 
        // dont mutate elite
        const newGeneration = nextGeneration(parents, mutationRate, eliteSize);


        population = [
            ...parents,
            ...newGeneration
        ];
        reduction(population, populationSize);

        // console.log(`Generation: ${i} | Fitness: ${fitness(population[0])} | result: ${population[0]}`);

        updateView(...population[0], fitness(population[0]), i);
    }

  if (typeof window !== 'undefined') {
    // purpose to find this 
    // const antiphase = [-0.5, 20, 10];
    displayDenoisedWave(population[0])
    console.log(population, population.map(fitness));
  }
}

run(
    maxGenerations = 1000,
    populationSize = 200,
    mutationRate = 0.4,
    elite = 0.1,
    parentSurvivePercent=0.4,
    badParentSurvivePercent=0.3
)

restart.onclick = () => { 
    runCount++;

    run(
        maxGenerations = 1000,
        populationSize = 160,
        mutationRate = 0.4,
        elite = 0.1,
        parentSurvivePercent=0.4,
        badParentSurvivePercent=0.3
    )
}
