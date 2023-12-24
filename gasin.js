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

const dataXLength = 500;

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

const meanSquareError = (yData) => {
    const distances = getDistances(yData);

    const sum = distances.reduce((acc, distance) => {
        return acc + Math.pow(distance, 2);
    }, 0);

    return sum / distances.length;
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

    return meanSquareError(
        dataY
    );
}

const createInitialPopulation = (populationSize, genomeLength, randMin, randMax) => {
    const population = [];

    for (let i = 0; i < populationSize; i++) {
        const genome = [];

        for (let j = 0; j < genomeLength; j++) {
            genome.push(
                randFloat(randMin, randMax)
            );
        }

        population.push(genome);
    }

    return population;
}

function getRandomElements(arr, numElements) {
    const shuffledArray = [...arr];
  
    // Fisher-Yates shuffle algorithm
    for (let i = shuffledArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
    }
  
    return shuffledArray.slice(0, numElements);
  }

const selection = (population, bestSurvivePercent, populationSize) => {
    const sorted = population.sort((a, b) => fitness(a) - fitness(b));

    const bestParentSurviveSize = Math.floor(populationSize * bestSurvivePercent);
    const badParentSurviveSize = populationSize - bestParentSurviveSize;

    const bestSurvive = sorted.slice(0, bestParentSurviveSize);
    const restSurvive = sorted.slice(bestParentSurviveSize, population.length);

    const badSurvive = getRandomElements(restSurvive, badParentSurviveSize);

    return [
        ...bestSurvive,
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

const mutate = (genome, randMin, randMax) => {
    const index = Math.floor(Math.random() * genome.length);

    genome[index] += randFloat(randMin, randMax);
}

const nextGeneration = (parents, mutationRate, eliteSize, mutRandMin, mutRandMax) => {
    const newPopulation = [];

    for (let j = 0; j <= parents.length - 1; j++) {
        const parentA = parents[j]; // change this also test
        const parentB = parents[Math.floor(Math.random() * parents.length)];
        // const parentC = parents[Math.floor(Math.random() * parents.length)];
        // const parentD = parents[Math.floor(Math.random() * parents.length)];

        // const sortedFitness = [parentA, parentB, parentC, parentD].sort((a, b) => fitness(a) - fitness(b));

        const child = crossover(parentA, parentB);
    
        if (Math.random() < mutationRate && j > eliteSize) {
            mutate(child, mutRandMin, mutRandMax);
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
    bestSurvivePercent, 
) => {
    let population = createInitialPopulation(populationSize, 3, -40, 40);

    const currentRun = runCount;

    for (let i = 0; i < maxGenerations; i++) {
        if (currentRun !== runCount) {
            return;
        }

        await new Promise(resolve => setTimeout(resolve));
        displayDenoisedWave(population[0])

        const eliteSize = elite * population.length;

        // will create children from bestSurvivePercent% parents 
        // dont mutate elite
        const children = nextGeneration(population, mutationRate, eliteSize, -5, 5);

        population = [
            ...population,
            ...children,
        ];

        population = selection(population, bestSurvivePercent, populationSize);

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
    maxGenerations = 200,
    populationSize = 200,
    mutationRate = 0.4,
    elite = 0.1,
    bestSurvivePercent=0.4,
)

restart.onclick = () => { 
    runCount++;

    run(
        maxGenerations = 200,
        populationSize = 200,
        mutationRate = 0.4,
        elite = 0.1,
        bestSurvivePercent=0.4,
    )
}
