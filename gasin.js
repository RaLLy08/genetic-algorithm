const mapRange = (toMin, toMax, fromMin, fromMax) => value => {
    return (value - fromMin) * (toMax - toMin) / (fromMax - fromMin) + toMin;
}

const dataXLength = 1000;

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

    return sine(1, 1, 10);
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
 

const noiseSineParams = [0.5, 20, 10];
const noisedDataY = applySineToData(
    noiseSineParams, dataYWithoutNoise
);


let optimumPath, x, yBlack;

if (typeof window !== 'undefined') {
    const xData = dataX;

    const yRedData = dataYWithoutNoise;
    const yBlackData = noisedDataY;

    // Declare the chart dimensions and margins.
    const width = 1080;
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
            .attr("stroke-width", 1.5)


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

// console.log(fitness([-0.1, 20, 1]));
// console.log(fitness([-0.1, 20, 3]));
// console.log(fitness([-0.1, 20, 4]));
// console.log(fitness([-0.4, 20, 4]));

// console.log(fitness([0, 10, 4]));
// console.log(fitness([-0.4, 10, 4]));
console.log(fitness([-0.6,20,9.8]))
console.log(fitness([-0.6,20,10]))


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

const selection = (population, surviveSize) => {
    const sorted = population.sort((a, b) => fitness(a) - fitness(b));

    return sorted.slice(0, surviveSize);
}

const reduction = (population, surviveSize) => {
//   for (let i = eliteSize; i < population.length - surviveSize; i++) {
//     population.splice(Math.floor(Math.random() * population.length), 1);
//   }
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

    genome[index] += randFloat(-1, 1);
}

const nextGeneration = (parents, mutationRate, eliteSize) => {
    const newPopulation = [];

    for (let j = 0; j <= parents.length - 1; j++) {
        const parentA = parents[j];
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


const run = async (maxGenerations, populationSize, mutationRate, elite, parentSurvivePercent) => {
    let population = createInitialPopulation(populationSize, 3);

    if (parentSurvivePercent < 0.5) {
        throw new Error('parentSurvivePercent must be more than 0.5, becuse we return 2 children from 2 parents');
    }

    for (let i = 0; i < maxGenerations; i++) {
        await new Promise(resolve => setTimeout(resolve, 10));
        displayDenoisedWave(population[0])

        // will remove worst 20% amount of parents

        const parents = selection(population, population.length * parentSurvivePercent);

        console.log(parents.length, 'selected parents')
        const eliteSize = elite * population.length;

        // will create children from parentSurvivePercent% parents 
        // dont mutate elite

        const newGeneration = nextGeneration(parents, mutationRate, eliteSize);

        population = [
            ...parents,
            ...newGeneration
        ];

        reduction(population, populationSize, eliteSize);
    
        console.log(`Generation: ${i} | Fitness: ${fitness(population[0])} | result: ${population[0]}`);

        if (fitness(parents[0]) === 0) {
            console.log(`Best genome: ${parents[0]}, result: ${originalEquation(...parents[0])}`);
            return;
        }
    }

  if (typeof window !== 'undefined') {
    // purpose to find this 
    // const antiphase = [-0.5, 20, 10];
    displayDenoisedWave(population[0])
    console.log(population, population.map(fitness));
  }
}

run(
    maxGenerations = 500,
    populationSize = 200,
    mutationRate = 0.3,
    elite = 0.2,
    parentSurvivePercent=0.5
)

// const a = [
//     fitness([-0.5, 20, -6]), // 0
//     fitness([-0.5, 20, -3]), // 1
//     fitness([-0.5, 20, -2]), // 2

//     fitness([-0.5, 20, -1]), // 3
//     fitness([-0.5, 20, -1.1]), // 4 better why

//     fitness([-0.5, 20, 1]),
//     fitness([-0.5, 20, 4]),
//     fitness([-0.5, 20, 6]),
//     fitness([-0.5, 20, 8]),
//     fitness([-0.5, 20, 9]),
//     fitness([-0.5, 20, 10]),
// ]

// console.log(a)


