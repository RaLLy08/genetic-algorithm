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

let prevBestGenome = null;

const updateView = (amplitude, frequency, phase, bestFitness, generation) => {
    document.getElementById('generation').innerHTML = generation;
    document.getElementById('best-fitness').innerHTML = Number(bestFitness).toFixed(3);
    const target = document.getElementsByClassName('target')[0];

    if ( `${amplitude},${frequency},${phase}` !== prevBestGenome) {
        target.classList.add('blink');
        setTimeout(() => {
            target.classList.remove('blink');
        }, 100);
    }

    views.targetSine.forEach((view, i) => {
        view.innerHTML = [amplitude.toFixed(3), frequency.toFixed(3), phase.toFixed(3)][i];
    })

    prevBestGenome = `${amplitude},${frequency},${phase}`;
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
    // const extraRightPanelMargin = Math.max(window.innerWidth, window.innerHeight) * 0.15; // 20% of widest dimension

    const width = Math.max(window.innerWidth, window.innerHeight);
    const height = Math.min(window.innerWidth, window.innerHeight);

    const marginTop = height * 0.20;
    const marginBottom = height * 0.20;
    const marginLeft = width * 0.05;
    const marginRight = width * 0.05;


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
const getDistances = (yData) => {
    return yData.map((y1, i) => {
        const y2 = originalEquation(i);

        return Math.abs(y1 - y2);
    })
}

const meanSquareError = (yData) => {
    const distances = getDistances(yData);

    const sum = distances.reduce((acc, distance) => {
        return acc + Math.pow(distance, 2);
    }, 0);

    return sum / distances.length;
}

const fitness = (genome) => {
    const dataY = applySineToData(genome, noisedDataY)

    return meanSquareError(
        dataY
    );
}

const displayDenoisedSine = (bestGenome) => {
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


const gaParams = {
    maxGenerations: 300,
    populationSize: 200,
    mutationRate: 0.4,
    elite: 0.1,
    bestSurvivePercent: 0.4,
    genomeLength: 3,
    fitnessFunction: fitness,
    randPopulationFunction: () => randFloat(-40, 40),
    randMutationFunction: () => randFloat(-5, 5),
}

let ga = new GA(gaParams);

const runGa = () => {
    ga.run(0, (g) => {
        const bestGenome = ga.population[0];
    
        displayDenoisedSine(bestGenome)
    
        updateView(...bestGenome, fitness(bestGenome), g);
    });
}

runGa();

restart.onclick = () => { 
    ga.terminate();

    ga = new GA(gaParams);
    runGa();
}

