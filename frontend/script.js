/* ============================================================
   GEOSENTINEL AI
   THREE-PAGE FRONTEND
   NO ASSETS FOLDER REQUIRED
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {

    /* ========================================================
       API
    ======================================================== */

    const API_BASE =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1"
            ? "http://127.0.0.1:5000"
            : "";

    const API_URL =
        `${API_BASE}/predict`;


    /* ========================================================
       DOM
    ======================================================== */

    const $ =
        (id) => document.getElementById(id);


    const page1 =
        $("page1");

    const page2 =
        $("page2");

    const page3 =
        $("page3");


    const t1Select =
        $("t1Select");

    const t2Select =
        $("t2Select");


    const t1Preview =
        $("t1Preview");

    const t2Preview =
        $("t2Preview");


    const analysisT1 =
        $("analysisT1");

    const analysisT2 =
        $("analysisT2");


    const resultT1 =
        $("resultT1");

    const resultT2 =
        $("resultT2");


    const continueBtn =
        $("continueBtn");

    const backBtn =
        $("backBtn");

    const analyzeBtn =
        $("analyzeBtn");

    const newAnalysisBtn =
        $("newAnalysisBtn");


    const analysisStatus =
        $("analysisStatus");

    const errorMessage =
        $("errorMessage");


    const changeCanvas =
        $("changeCanvas");

    const mapLoading =
        $("mapLoading");


    let selectedT1 =
        "urban_1";

    let selectedT2 =
        "urban_1";


    let currentResult =
        null;


    /* ========================================================
       SCENE VISUAL CONFIGURATION

       These are browser-generated satellite-style previews.
       They do NOT require image files.
    ======================================================== */

    const sceneConfig = {

        urban_1: {
            seed: 11,
            title: "URBAN EXPANSION 01"
        },

        urban_2: {
            seed: 27,
            title: "URBAN EXPANSION 02"
        },

        urban_3: {
            seed: 49,
            title: "URBAN EXPANSION 03"
        }
    };


    /* ========================================================
       PAGE NAVIGATION
    ======================================================== */

    function showPage(number) {

        [page1, page2, page3]
            .forEach((page) => {

                if (page) {

                    page.classList.remove(
                        "active-page"
                    );
                }
            });


        const target =
            $(`page${number}`);


        if (target) {

            target.classList.add(
                "active-page"
            );
        }


        document
            .querySelectorAll(".step")
            .forEach((step) => {

                const stepNumber =
                    Number(
                        step.dataset.step
                    );


                step.classList.toggle(
                    "active",
                    stepNumber === number
                );


                step.classList.toggle(
                    "completed",
                    stepNumber < number
                );
            });


        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }


    /* ========================================================
       CANVAS SATELLITE GENERATOR
    ======================================================== */

    function generateSatellite(
        canvas,
        sceneKey,
        later = false
    ) {

        if (!canvas) {
            return;
        }


        const ctx =
            canvas.getContext("2d");


        const width =
            canvas.width;

        const height =
            canvas.height;


        const config =
            sceneConfig[sceneKey];


        if (!config) {
            return;
        }


        const seed =
            config.seed +
            (later ? 100 : 0);


        /*
         * Base satellite surface.
         */

        const image =
            ctx.createImageData(
                width,
                height
            );


        for (
            let y = 0;
            y < height;
            y++
        ) {

            for (
                let x = 0;
                x < width;
                x++
            ) {

                const index =
                    (y * width + x) * 4;


                const noise =
                    Math.sin(
                        x * 0.031 +
                        seed
                    ) *
                    Math.cos(
                        y * 0.027 +
                        seed
                    );


                const terrain =
                    Math.sin(
                        (x + y) * 0.012
                    );


                let r =
                    30 +
                    noise * 14 +
                    terrain * 9;


                let g =
                    55 +
                    noise * 18 +
                    terrain * 15;


                let b =
                    53 +
                    noise * 13;


                /*
                 * Water regions.
                 */

                const water =
                    (
                        Math.sin(
                            x * 0.017 +
                            seed
                        ) +
                        Math.cos(
                            y * 0.021 -
                            seed
                        )
                    ) > 1.15;


                if (water) {

                    r = 16;
                    g = 55;
                    b = 72;
                }


                image.data[index] =
                    Math.max(
                        0,
                        Math.min(
                            255,
                            r
                        )
                    );

                image.data[index + 1] =
                    Math.max(
                        0,
                        Math.min(
                            255,
                            g
                        )
                    );

                image.data[index + 2] =
                    Math.max(
                        0,
                        Math.min(
                            255,
                            b
                        )
                    );

                image.data[index + 3] =
                    255;
            }
        }


        ctx.putImageData(
            image,
            0,
            0
        );


        /*
         * Urban structures.
         */

        const random =
            seededRandom(seed);


        const buildingCount =
            later ? 115 : 82;


        for (
            let i = 0;
            i < buildingCount;
            i++
        ) {

            const x =
                random() *
                width;

            const y =
                random() *
                height;


            const size =
                4 +
                random() * 18;


            ctx.fillStyle =
                later
                    ? "rgba(190,180,130,0.72)"
                    : "rgba(155,150,112,0.58)";


            ctx.fillRect(
                x,
                y,
                size,
                size * 0.65
            );
        }


        /*
         * Roads.
         */

        ctx.lineWidth = 2;

        ctx.strokeStyle =
            "rgba(210,195,155,0.28)";


        for (
            let i = 0;
            i < 9;
            i++
        ) {

            const y =
                40 +
                i *
                (height / 10);


            ctx.beginPath();

            ctx.moveTo(
                0,
                y
            );

            ctx.lineTo(
                width,
                y +
                80 *
                Math.sin(
                    i +
                    seed
                )
            );

            ctx.stroke();
        }


        /*
         * Later image gets a visible expansion zone.
         */

        if (later) {

            ctx.fillStyle =
                "rgba(205,160,95,0.45)";


            ctx.fillRect(
                width * 0.58,
                height * 0.28,
                width * 0.22,
                height * 0.30
            );


            ctx.strokeStyle =
                "rgba(255,210,120,0.65)";

            ctx.lineWidth = 2;

            ctx.strokeRect(
                width * 0.58,
                height * 0.28,
                width * 0.22,
                height * 0.30
            );
        }


        /*
         * Satellite scan lines.
         */

        ctx.strokeStyle =
            "rgba(255,255,255,0.025)";

        ctx.lineWidth = 1;


        for (
            let y = 0;
            y < height;
            y += 8
        ) {

            ctx.beginPath();

            ctx.moveTo(
                0,
                y
            );

            ctx.lineTo(
                width,
                y
            );

            ctx.stroke();
        }
    }


    /* ========================================================
       SEEDED RANDOM
    ======================================================== */

    function seededRandom(seed) {

        let value =
            seed;

        return () => {

            value =
                (
                    value * 9301 +
                    49297
                ) %
                233280;

            return value /
                233280;
        };
    }


    /* ========================================================
       UPDATE SCENE
    ======================================================== */

    function updateScene() {

        selectedT1 =
            t1Select
                ? t1Select.value
                : "urban_1";


        selectedT2 =
            t2Select
                ? t2Select.value
                : "urban_1";


        drawAllPreviews();
    }


    function drawAllPreviews() {

        generateSatellite(
            t1Preview,
            selectedT1,
            false
        );


        generateSatellite(
            t2Preview,
            selectedT2,
            true
        );


        generateSatellite(
            analysisT1,
            selectedT1,
            false
        );


        generateSatellite(
            analysisT2,
            selectedT2,
            true
        );


        generateSatellite(
            resultT1,
            selectedT1,
            false
        );


        generateSatellite(
            resultT2,
            selectedT2,
            true
        );
    }


    /* ========================================================
       SELECT EVENTS
    ======================================================== */

    if (t1Select) {

        t1Select.addEventListener(
            "change",
            updateScene
        );
    }


    if (t2Select) {

        t2Select.addEventListener(
            "change",
            updateScene
        );
    }


    /* ========================================================
       PAGE 1 → PAGE 2
    ======================================================== */

    if (continueBtn) {

        continueBtn.addEventListener(
            "click",
            () => {

                updateScene();

                setStatus(
                    "READY FOR AI ANALYSIS",
                    false
                );

                showPage(2);
            }
        );
    }


    /* ========================================================
       PAGE 2 → PAGE 1
    ======================================================== */

    if (backBtn) {

        backBtn.addEventListener(
            "click",
            () => {

                showPage(1);
            }
        );
    }


    /* ========================================================
       ANALYSIS
    ======================================================== */

    if (analyzeBtn) {

        analyzeBtn.addEventListener(
            "click",
            runAnalysis
        );
    }


    async function runAnalysis() {

        hideError();

        setAnalysisRunning(
            true
        );


        setStatus(
            "RUNNING AI CHANGE DETECTION...",
            true
        );


        if (mapLoading) {

            mapLoading.style.display =
                "flex";
        }


        try {

            /*
             * Generate actual 256x256 RGB images
             * from the same visual scene.
             */

            const t1Canvas =
                document.createElement(
                    "canvas"
                );

            const t2Canvas =
                document.createElement(
                    "canvas"
                );


            t1Canvas.width =
                256;

            t1Canvas.height =
                256;


            t2Canvas.width =
                256;

            t2Canvas.height =
                256;


            generateSatellite(
                t1Canvas,
                selectedT1,
                false
            );


            generateSatellite(
                t2Canvas,
                selectedT2,
                true
            );


            /*
             * Convert to 13-channel representation.
             */

            const t1 =
                canvasToTensor(
                    t1Canvas
                );


            const t2 =
                canvasToTensor(
                    t2Canvas
                );


            /*
             * Backend request.
             */

            const response =
                await fetch(
                    API_URL,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({
                                t1,
                                t2
                            })
                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    data.error ||
                    "GeoSentinel AI analysis failed."
                );
            }


            if (
                data.status &&
                data.status !== "success"
            ) {

                throw new Error(
                    data.message ||
                    "The model returned an error."
                );
            }


            currentResult =
                data;


            displayResults(
                data
            );


            showPage(3);


        } catch (error) {

            console.error(
                "GeoSentinel error:",
                error
            );


            showError(
                error.message ||
                "Unable to connect to GeoSentinel AI."
            );


        } finally {

            setAnalysisRunning(
                false
            );


            if (mapLoading) {

                mapLoading.style.display =
                    "none";
            }
        }
    }


    /* ========================================================
       CANVAS → 13 CHANNEL TENSOR
    ======================================================== */

    function canvasToTensor(
        canvas
    ) {

        const ctx =
            canvas.getContext(
                "2d",
                {
                    willReadFrequently:
                        true
                }
            );


        const imageData =
            ctx.getImageData(
                0,
                0,
                256,
                256
            );


        const pixels =
            imageData.data;


        const tensor =
            new Array(256);


        for (
            let y = 0;
            y < 256;
            y++
        ) {

            tensor[y] =
                new Array(256);


            for (
                let x = 0;
                x < 256;
                x++
            ) {

                const i =
                    (y * 256 + x) * 4;


                const r =
                    pixels[i] / 255;

                const g =
                    pixels[i + 1] / 255;

                const b =
                    pixels[i + 2] / 255;


                tensor[y][x] = [

                    r,
                    g,
                    b,

                    (r + g) / 2,

                    (g + b) / 2,

                    (r + b) / 2,

                    Math.abs(r - g),

                    Math.abs(g - b),

                    Math.abs(r - b),

                    (r + g + b) / 3,

                    r * r,

                    g * g,

                    b * b
                ];
            }
        }


        return tensor;
    }


    /* ========================================================
       DISPLAY RESULTS
    ======================================================== */

    function displayResults(
        data
    ) {

        const percentage =
            Number(
                data.change_percentage ??
                data.change_percent ??
                0
            );


        const changed =
            Number(
                data.change_pixels ??
                0
            );


        const total =
            Number(
                data.total_pixels ??
                256 * 256
            );


        const thresholdValue =
            Number(
                data.threshold ??
                0.60
            );


        if ($("changePercentage")) {

            $("changePercentage")
                .textContent =
                `${percentage.toFixed(2)}%`;
        }


        if ($("changePixels")) {

            $("changePixels")
                .textContent =
                formatNumber(
                    changed
                );
        }


        if ($("totalPixels")) {

            $("totalPixels")
                .textContent =
                formatNumber(
                    total
                );
        }


        if ($("threshold")) {

            $("threshold")
                .textContent =
                thresholdValue
                    .toFixed(2);
        }


        /*
         * Change map.
         */

        if (
            data.change_map &&
            changeCanvas
        ) {

            renderChangeMap(
                data.change_map,
                thresholdValue
            );

        } else {

            /*
             * If backend does not return a map,
             * create a visual demonstration map
             * from the two generated scenes.
             */

            generateDemoChangeMap();
        }


        /*
         * Interpretation.
         */

        if ($("interpretationText")) {

            $("interpretationText")
                .textContent =
                interpretation(
                    percentage
                );
        }


        if ($("resultSummary")) {

            $("resultSummary")
                .textContent =
                `GeoSentinel AI completed the temporal comparison for ${sceneConfig[selectedT1].title}.`;
        }
    }


    /* ========================================================
       CHANGE MAP
    ======================================================== */

    function renderChangeMap(
        map,
        thresholdValue
    ) {

        const height =
            map.length;


        const width =
            map[0]?.length ||
            0;


        if (
            !width ||
            !height
        ) {

            generateDemoChangeMap();

            return;
        }


        changeCanvas.width =
            width;

        changeCanvas.height =
            height;


        const ctx =
            changeCanvas.getContext(
                "2d"
            );


        const image =
            ctx.createImageData(
                width,
                height
            );


        for (
            let y = 0;
            y < height;
            y++
        ) {

            for (
                let x = 0;
                x < width;
                x++
            ) {

                const value =
                    Number(
                        map[y][x]
                    );


                const changed =
                    value >=
                    thresholdValue;


                const i =
                    (y * width + x) * 4;


                if (changed) {

                    image.data[i] =
                        255;

                    image.data[i + 1] =
                        76;

                    image.data[i + 2] =
                        76;

                } else {

                    image.data[i] =
                        12;

                    image.data[i + 1] =
                        26;

                    image.data[i + 2] =
                        34;
                }


                image.data[i + 3] =
                    255;
            }
        }


        ctx.putImageData(
            image,
            0,
            0
        );
    }


    /* ========================================================
       DEMO CHANGE MAP FALLBACK
    ======================================================== */

    function generateDemoChangeMap() {

        const canvas =
            changeCanvas;


        const ctx =
            canvas.getContext(
                "2d"
            );


        const width =
            canvas.width;

        const height =
            canvas.height;


        ctx.fillStyle =
            "#0b1a22";


        ctx.fillRect(
            0,
            0,
            width,
            height
        );


        /*
         * Existing area.
         */

        ctx.fillStyle =
            "rgba(75,110,110,0.55)";


        for (
            let i = 0;
            i < 55;
            i++
        ) {

            const x =
                (i * 47) %
                width;

            const y =
                (i * 83) %
                height;


            ctx.fillRect(
                x,
                y,
                12 +
                (i % 4) * 8,
                8 +
                (i % 3) * 6
            );
        }


        /*
         * Changed urban expansion.
         */

        ctx.fillStyle =
            "rgba(255,72,72,0.85)";


        ctx.fillRect(
            width * 0.56,
            height * 0.25,
            width * 0.25,
            height * 0.38
        );


        ctx.fillStyle =
            "rgba(255,110,80,0.7)";


        for (
            let i = 0;
            i < 18;
            i++
        ) {

            ctx.fillRect(
                width * 0.48 +
                (i % 6) * 12,

                height * 0.2 +
                Math.floor(i / 6) * 18,

                9,
                9
            );
        }
    }


    /* ========================================================
       INTERPRETATION
    ======================================================== */

    function interpretation(
        percentage
    ) {

        if (percentage <= 1) {

            return (
                "Very limited surface change was detected. The observed area remains largely stable between the two temporal observations."
            );
        }


        if (percentage <= 5) {

            return (
                "Localized spatial change was detected. Only a small portion of the observed scene shows measurable transformation."
            );
        }


        if (percentage <= 15) {

            return (
                "Moderate spatial change was detected. The affected regions indicate noticeable land-surface transformation between T1 and T2."
            );
        }


        if (percentage <= 30) {

            return (
                "Significant spatial change was detected across the scene. The spatial distribution suggests substantial land-surface transformation."
            );
        }


        return (
            "Extensive spatial change was detected. A large proportion of the observed area has undergone measurable transformation between the two observations."
        );
    }


    /* ========================================================
       STATUS
    ======================================================== */

    function setStatus(
        message,
        running
    ) {

        if (!analysisStatus) {
            return;
        }


        const text =
            analysisStatus.querySelector(
                "span"
            );


        if (text) {

            text.textContent =
                message;
        }


        const dot =
            analysisStatus.querySelector(
                ".status-dot"
            );


        if (dot) {

            dot.classList.toggle(
                "running",
                running
            );
        }
    }


    /* ========================================================
       ANALYSIS BUTTON
    ======================================================== */

    function setAnalysisRunning(
        running
    ) {

        if (!analyzeBtn) {
            return;
        }


        analyzeBtn.disabled =
            running;


        if (running) {

            analyzeBtn.innerHTML =
                "ANALYZING...";


        } else {

            analyzeBtn.innerHTML =
                "ANALYZE CHANGE <span>✦</span>";
        }
    }


    /* ========================================================
       ERROR
    ======================================================== */

    function hideError() {

        if (!errorMessage) {
            return;
        }


        errorMessage.style.display =
            "none";


        errorMessage.textContent =
            "";
    }


    function showError(
        message
    ) {

        setStatus(
            "ANALYSIS ERROR",
            false
        );


        if (errorMessage) {

            errorMessage.textContent =
                message;

            errorMessage.style.display =
                "block";
        }


        setAnalysisRunning(
            false
        );
    }


    /* ========================================================
       RESET
    ======================================================== */

    if (newAnalysisBtn) {

        newAnalysisBtn.addEventListener(
            "click",
            () => {

                selectedT1 =
                    "urban_1";

                selectedT2 =
                    "urban_1";


                if (t1Select) {

                    t1Select.value =
                        "urban_1";
                }


                if (t2Select) {

                    t2Select.value =
                        "urban_1";
                }


                if ($("changePercentage")) {

                    $("changePercentage")
                        .textContent =
                        "--";
                }


                if ($("changePixels")) {

                    $("changePixels")
                        .textContent =
                        "--";
                }


                if ($("totalPixels")) {

                    $("totalPixels")
                        .textContent =
                        "--";
                }


                if ($("threshold")) {

                    $("threshold")
                        .textContent =
                        "--";
                }


                if ($("interpretationText")) {

                    $("interpretationText")
                        .textContent =
                        "Waiting for analysis...";
                }


                drawAllPreviews();

                showPage(1);
            }
        );
    }


    /* ========================================================
       FORMAT NUMBERS
    ======================================================== */

    function formatNumber(
        value
    ) {

        return Number(
            value
        ).toLocaleString(
            "en-IN"
        );
    }


    /* ========================================================
       KEYBOARD
    ======================================================== */

    document.addEventListener(
        "keydown",
        (event) => {

            if (
                (event.ctrlKey ||
                    event.metaKey) &&
                event.key === "Enter"
            ) {

                if (
                    page2 &&
                    page2.classList.contains(
                        "active-page"
                    )
                ) {

                    runAnalysis();
                }
            }


            if (
                event.key === "Escape"
            ) {

                if (
                    page2 &&
                    page2.classList.contains(
                        "active-page"
                    )
                ) {

                    showPage(1);
                }

                else if (
                    page3 &&
                    page3.classList.contains(
                        "active-page"
                    )
                ) {

                    showPage(2);
                }
            }
        }
    );


    /* ========================================================
       INITIALIZATION
    ======================================================== */

    drawAllPreviews();

    showPage(1);


    console.log(
        "GeoSentinel AI — 3 page interface ready."
    );

    console.log(
        "No external image assets required."
    );

});
