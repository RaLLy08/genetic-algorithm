const mapVals = (min, max, minFrom, maxFrom) => valFrom => {
    const range = Math.abs(min) + Math.abs(max);
    const rangeFrom = Math.abs(minFrom) + Math.abs(maxFrom);
    
    const valFromAbs = valFrom + Math.abs(minFrom);
    const fromKoef = valFromAbs / rangeFrom;

    return (range * fromKoef) + min;
}

const dataXLength = 1000;

const getSine = (t) => (amplitude, frequency, phase) => {
    return amplitude * Math.sin(mapVals(-Math.PI, Math.PI, 0, dataXLength)(frequency * t + phase));
}
const randFloat = (min, max) => {
    return Math.trunc((min + (Math.random() * (max - min)) ) * 10) / 10
}
const equation = (t) => {
    const sine = getSine(t);

    return sine(1, 1, 10);
}

const dataX = Array.from({ length: dataXLength }, (_, i) => i);
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



let optimumPath, x, yBlack;

if (typeof window !== 'undefined') {
    const xData = dataX;
    const yRedData = dataYWithoutNoise;
    const yData = noisedDataY;


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
        .domain([-d3.max(yData), d3.max(yData)])
        .range([height - marginBottom, marginTop]);

    const yRed = d3.scaleLinear()
        .domain([-d3.max(yRedData), d3.max(yRedData)])
        .range([height - marginBottom, marginTop]);

    yBlack = d3.scaleLinear()
        .domain([-d3.max(yData), d3.max(yData)])
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
        .attr("stroke", "steelblue")
        .attr("stroke-width", 1.5)
        .attr("d", d3.line()
            .x((d) => x(d))
            .y((d, i) => y(yData[i]))
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

const applySineToDataX = (params) => {
    const [amplitude, frequency, phase] = params;

    const yData = noisedDataY.map((ny, t) => {
        const sine = getSine(t);

        return ny + sine(amplitude, frequency, phase);
    });

    return yData;
}

const fitness = (params) => {
    const dataY = applySineToDataX(params)

    return getDistancesSum(
        dataY
    ).toFixed(5);
}

// console.log(fitness([-0.5, 20, 10]));

// console.log(fitness([0, 10, 4]));
// console.log(fitness([-0.4, 10, 4]));


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

    for (let j = 0; j < parents.length - 1; j++) {
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


const run = (maxGenerations, populationSize, mutationRate, elite) => {
    let population = createInitialPopulation(populationSize, 3);

    for (let i = 0; i < maxGenerations; i++) {

        // will remove worst 20% amount of parents
        const parentSurvivePercent = 0.8;

        const parents = selection(population, population.length * parentSurvivePercent);
        const eliteSize = elite * population.length;
        // will create children from 80% parents 

        const familyPopulation = [
            ...parents, 
            ...nextGeneration(parents, mutationRate, eliteSize)
        ];

        // will remove keep same population size
        reduction(eliteSize, familyPopulation, populationSize);

        console.log(`Generation: ${i} | Fitness: ${fitness(parents[0])} | result: ${familyPopulation[0]}`);

        if (fitness(parents[0]) === 0) {
            console.log(`Best genome: ${parents[0]}, result: ${equation(...parents[0])}`);
            return;
        }
    }

  if (typeof window !== 'undefined') {
    const xy = dataX.map((x, i) => {
        return [x, applySineToDataX(population[0])[i]];
    });

    // replace data in d3 graph
    optimumPath.data([xy])
        .attr("d", d3.line()
            .x((d) => x(d[0]))
            .y((d) => yBlack(d[1]))
        
    );
  }
}



run(
    maxGenerations = 1000,
    populationSize = 10,
    mutationRate = 0.2,
    elite = 0
)
