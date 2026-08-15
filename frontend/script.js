const API = window.location.origin;

const t1Input =
    document.getElementById("t1File");

const t2Input =
    document.getElementById("t2File");

const t1Name =
    document.getElementById("t1Name");

const t2Name =
    document.getElementById("t2Name");

const statusDot =
    document.getElementById("statusDot");

const statusText =
    document.getElementById("statusText");

const errorBox =
    document.getElementById("errorBox");


/* =========================================================
   FILE SELECTION
========================================================= */

t1Input.addEventListener(
    "change",
    () => {

        if (t1Input.files.length) {

            t1Name.textContent =
                t1Input.files[0].name;

            document
                .getElementById("t1Card")
                .classList.add("selected");
        }
    }
);


t2Input.addEventListener(
    "change",
    () => {

        if (t2Input.files.length) {

            t2Name.textContent =
                t2Input.files[0].name;

            document
                .getElementById("t2Card")
                .classList.add("selected");
        }
    }
);


/* =========================================================
   API STATUS
========================================================= */

async function checkAPI() {

    try {

        const response =
            await fetch(
                `${API}/api/status`
            );

        if (!response.ok) {
            throw new Error(
                "API unavailable"
            );
        }

        const data =
            await response.json();

        statusDot.classList.add(
            "online"
        );

        statusText.textContent =
            "SYSTEM ONLINE";

        console.log(
            "GeoSentinel API:",
            data
        );

    } catch (error) {

        statusDot.classList.add(
            "error"
        );

        statusText.textContent =
            "API OFFLINE";

        console.error(error);
    }
}


checkAPI();


/* =========================================================
   SCROLL
========================================================= */

function scrollToAnalysis() {

    document
        .getElementById("analysis")
        .scrollIntoView({
            behavior: "smooth"
        });
}


/* =========================================================
   MODEL INFO
========================================================= */

async function loadModelInfo() {

    try {

        const response =
            await fetch(
                `${API}/model-info`
            );

        const data =
            await response.json();

        alert(
`GEOSENTINEL AI

Architecture:
${data.architecture}

Parameters:
${Number(
    data.parameters
).toLocaleString()}

Input:
${data.input_shape.join(" × ")}

Output:
${data.output_shape.join(" × ")}

Threshold:
${data.threshold}`
        );

    } catch (error) {

        alert(
            "GeoSentinel API is not currently available."
        );
    }
}


/* =========================================================
   ANALYSIS
========================================================= */

async function runAnalysis() {

    errorBox.textContent = "";

    if (!t1Input.files.length) {

        errorBox.textContent =
            "Select the T1 .npy scene first.";

        return;
    }

    if (!t2Input.files.length) {

        errorBox.textContent =
            "Select the T2 .npy scene first.";

        return;
    }


    const t1 =
        t1Input.files[0];

    const t2 =
        t2Input.files[0];


    document
        .getElementById("analysis")
        .classList.add("hidden");

    document
        .getElementById("results")
        .classList.add("hidden");

    document
        .getElementById("processing")
        .classList.remove("hidden");

    document
        .getElementById("processing")
        .scrollIntoView({
            behavior: "smooth"
        });


    const messages = [
        "Loading T1 temporal scene...",
        "Loading T2 temporal scene...",
        "Computing shared-weight features...",
        "Calculating temporal differences...",
        "Decoding spatial change...",
        "Generating probability map..."
    ];


    let messageIndex = 0;

    const messageElement =
        document.getElementById(
            "processingMessage"
        );

    const messageTimer =
        setInterval(
            () => {

                messageElement.textContent =
                    messages[
                        messageIndex %
                        messages.length
                    ];

                messageIndex++;

            },
            900
        );


    try {

        const formData =
            new FormData();

        formData.append(
            "t1",
            t1
        );

        formData.append(
            "t2",
            t2
        );


        const response =
            await fetch(
                `${API}/predict-npy`,
                {
                    method: "POST",
                    body: formData
                }
            );


        const data =
            await response.json();


        clearInterval(
            messageTimer
        );


        if (!response.ok ||
            data.status !== "success") {

            throw new Error(
                data.message ||
                "Prediction failed."
            );
        }


        showResults(data);


    } catch (error) {

        clearInterval(
            messageTimer
        );

        document
            .getElementById("processing")
            .classList.add("hidden");

        document
            .getElementById("analysis")
            .classList.remove("hidden");

        errorBox.textContent =
            error.message;

        document
            .getElementById("analysis")
            .scrollIntoView({
                behavior: "smooth"
            });
    }
}


/* =========================================================
   RESULTS
========================================================= */

function showResults(data) {

    document
        .getElementById("processing")
        .classList.add("hidden");

    document
        .getElementById("results")
        .classList.remove("hidden");

    document
        .getElementById("results")
        .scrollIntoView({
            behavior: "smooth"
        });


    document
        .getElementById(
            "changePercentage"
        )
        .textContent =
        data.change_percentage.toFixed(2);


    document
        .getElementById(
            "changePixels"
        )
        .textContent =
        `${data.change_pixels.toLocaleString()} changed pixels`;


    document
        .getElementById(
            "minProb"
        )
        .textContent =
        data.probability_min.toFixed(4);


    document
        .getElementById(
            "maxProb"
        )
        .textContent =
        data.probability_max.toFixed(4);


    document
        .getElementById(
            "changedPixelsStat"
        )
        .textContent =
        data.change_pixels.toLocaleString();


    drawProbabilityMap(
        data.probability_map
    );

    drawChangeMap(
        data.change_map
    );
}


/* =========================================================
   PROBABILITY MAP
========================================================= */

function drawProbabilityMap(
    values
) {

    const canvas =
        document.getElementById(
            "probabilityCanvas"
        );

    const ctx =
        canvas.getContext("2d");

    const width = 256;
    const height = 256;

    const image =
        ctx.createImageData(
            width,
            height
        );


    for (
        let i = 0;
        i < values.length;
        i++
    ) {

        const value =
            Math.max(
                0,
                Math.min(
                    1,
                    Number(values[i])
                )
            );


        /*
         * Dark-blue → cyan → yellow → white
         */

        let r;
        let g;
        let b;


        if (value < 0.5) {

            const t =
                value * 2;

            r =
                Math.floor(
                    15 + 20 * t
                );

            g =
                Math.floor(
                    40 + 150 * t
                );

            b =
                Math.floor(
                    90 + 150 * t
                );

        } else {

            const t =
                (value - 0.5) * 2;

            r =
                Math.floor(
                    35 + 220 * t
                );

            g =
                Math.floor(
                    190 + 55 * t
                );

            b =
                Math.floor(
                    240 - 190 * t
                );
        }


        const index =
            i * 4;

        image.data[index] =
            r;

        image.data[index + 1] =
            g;

        image.data[index + 2] =
            b;

        image.data[index + 3] =
            255;
    }


    ctx.putImageData(
        image,
        0,
        0
    );
}


/* =========================================================
   BINARY CHANGE MAP
========================================================= */

function drawChangeMap(
    values
) {

    const canvas =
        document.getElementById(
            "changeCanvas"
        );

    const ctx =
        canvas.getContext("2d");

    const image =
        ctx.createImageData(
            256,
            256
        );


    for (
        let i = 0;
        i < values.length;
        i++
    ) {

        const changed =
            Number(values[i]) === 1;

        const index =
            i * 4;


        if (changed) {

            image.data[index] =
                105;

            image.data[index + 1] =
                240;

            image.data[index + 2] =
                178;

        } else {

            image.data[index] =
                4;

            image.data[index + 1] =
                11;

            image.data[index + 2] =
                17;
        }

        image.data[index + 3] =
            255;
    }


    ctx.putImageData(
        image,
        0,
        0
    );
}


/* =========================================================
   RESET
========================================================= */

function resetAnalysis() {

    t1Input.value = "";
    t2Input.value = "";

    t1Name.textContent =
        "No scene selected";

    t2Name.textContent =
        "No scene selected";

    errorBox.textContent = "";

    document
        .getElementById("results")
        .classList.add("hidden");

    document
        .getElementById("processing")
        .classList.add("hidden");

    document
        .getElementById("analysis")
        .classList.remove("hidden");

    document
        .getElementById("analysis")
        .scrollIntoView({
            behavior: "smooth"
        });
}
