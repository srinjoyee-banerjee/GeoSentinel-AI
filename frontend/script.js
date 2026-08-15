/* ============================================================
   GEOSENTINEL AI
   FRONTEND SCRIPT
   3-PAGE VERSION
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

    const API_URL = `${API_BASE}/predict`;

    /* ========================================================
       HELPERS
    ======================================================== */

    const $ = id => document.getElementById(id);

    const pages = {
        1: $("page1"),
        2: $("page2"),
        3: $("page3")
    };

    /* ========================================================
       ELEMENTS
    ======================================================== */

    const t1Preview = $("t1Preview");
    const t2Preview = $("t2Preview");

    const analysisT1 = $("analysisT1");
    const analysisT2 = $("analysisT2");

    const resultT1 = $("resultT1");
    const resultT2 = $("resultT2");

    const t1Select = $("t1Select");
    const t2Select = $("t2Select");

    const continueBtn = $("continueBtn");
    const backBtn = $("backBtn");
    const analyzeBtn = $("analyzeBtn");
    const newAnalysisBtn = $("newAnalysisBtn");

    const analysisStatus = $("analysisStatus");
    const analysisStatusText =
        analysisStatus
            ? analysisStatus.querySelector("span")
            : null;

    const changeCanvas = $("changeCanvas");
    const mapLoading = $("mapLoading");

    const changePercentage = $("changePercentage");
    const changePixels = $("changePixels");
    const totalPixels = $("totalPixels");
    const threshold = $("threshold");

    const interpretationText =
        $("interpretationText");

    const resultSummary =
        $("resultSummary");

    /* ========================================================
       STATE
    ======================================================== */

    let currentPage = 1;

    let currentSceneT1 = "urban_1";
    let currentSceneT2 = "urban_1";

    let currentT1Data = null;
    let currentT2Data = null;

    let currentResult = null;

    /* ========================================================
       GENERATED SATELLITE SCENES
       
       IMPORTANT:
       These are generated directly in JavaScript.
       NO assets folder is required.
       ======================================================== */

    const SCENES = {

        urban_1: {
            name: "Urban Expansion 01",

            t1: {
                buildings: 14,
                roads: 3,
                vegetation: 42
            },

            t2: {
                buildings: 29,
                roads: 5,
                vegetation: 34
            }
        },

        urban_2: {
            name: "Urban Expansion 02",

            t1: {
                buildings: 10,
                roads: 2,
                vegetation: 48
            },

            t2: {
                buildings: 23,
                roads: 5,
                vegetation: 38
            }
        },

        urban_3: {
            name: "Urban Expansion 03",

            t1: {
                buildings: 18,
                roads: 4,
                vegetation: 39
            },

            t2: {
                buildings: 36,
                roads: 7,
                vegetation: 28
            }
        }
    };

    /* ========================================================
       SVG SATELLITE IMAGE GENERATOR
       ======================================================== */

    function createSatelliteSVG(sceneKey, period) {

        const scene =
            SCENES[sceneKey] || SCENES.urban_1;

        const values =
            scene[period];

        const seed =
            sceneKey === "urban_1"
                ? 17
                : sceneKey === "urban_2"
                    ? 43
                    : 81;

        let buildings = "";
        let vegetation = "";
        let roads = "";

        /*
         * Vegetation patches
         */

        for (
            let i = 0;
            i < values.vegetation;
            i++
        ) {

            const x =
                (i * 47 + seed * 3) % 500;

            const y =
                (i * 83 + seed * 5) % 340;

            const width =
                12 + ((i * 13) % 34);

            const height =
                10 + ((i * 17) % 25);

            vegetation += `
                <rect
                    x="${x}"
                    y="${y}"
                    width="${width}"
                    height="${height}"
                    rx="8"
                    fill="#193d32"
                    opacity="0.72"
                />
            `;
        }

        /*
         * Roads
         */

        for (
            let i = 0;
            i < values.roads;
            i++
        ) {

            const y =
                55 + i * 63;

            roads += `
                <path
                    d="M 0 ${y}
                       C 120 ${y - 20},
                         210 ${y + 25},
                         300 ${y}
                       S 430 ${y - 20},
                         520 ${y + 8}"
                    fill="none"
                    stroke="#858879"
                    stroke-width="${10 + i * 2}"
                    opacity="0.65"
                />
            `;
        }

        /*
         * Buildings
         */

        for (
            let i = 0;
            i < values.buildings;
            i++
        ) {

            const x =
                25 + ((i * 71 + seed) % 455);

            const y =
                25 + ((i * 43 + seed * 2) % 295);

            const width =
                16 + ((i * 11) % 27);

            const height =
                14 + ((i * 7) % 24);

            buildings += `
                <rect
                    x="${x}"
                    y="${y}"
                    width="${width}"
                    height="${height}"
                    rx="2"
                    fill="#b8b7a5"
                    opacity="0.88"
                />

                <rect
                    x="${x + 3}"
                    y="${y + 3}"
                    width="${Math.max(3, width - 6)}"
                    height="${Math.max(3, height - 6)}"
                    fill="#6e7169"
                    opacity="0.65"
                />
            `;
        }

        /*
         * Additional urban development in T2
         */

        let development = "";

        if (period === "t2") {

            for (let i = 0; i < 12; i++) {

                const x =
                    50 + ((i * 91 + seed) % 400);

                const y =
                    70 + ((i * 61 + seed) % 230);

                development += `
                    <rect
                        x="${x}"
                        y="${y}"
                        width="38"
                        height="27"
                        fill="none"
                        stroke="#e2c46b"
                        stroke-width="3"
                        opacity="0.85"
                    />
                `;
            }
        }

        const svg = `
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="520"
            height="360"
            viewBox="0 0 520 360"
        >

            <defs>

                <linearGradient
                    id="terrain"
                    x1="0"
                    y1="0"
                    x2="1"
                    y2="1"
                >
                    <stop
                        offset="0%"
                        stop-color="#162c2c"
                    />

                    <stop
                        offset="45%"
                        stop-color="#40504a"
                    />

                    <stop
                        offset="100%"
                        stop-color="#202b2a"
                    />
                </linearGradient>

                <filter id="noise">

                    <feTurbulence
                        type="fractalNoise"
                        baseFrequency="0.8"
                        numOctaves="2"
                        seed="${seed}"
                    />

                    <feColorMatrix
                        type="saturate"
                        values="0"
                    />

                    <feComponentTransfer>

                        <feFuncA
                            type="table"
                            tableValues="0 0.12"
                        />

                    </feComponentTransfer>

                </filter>

            </defs>

            <rect
                width="520"
                height="360"
                fill="url(#terrain)"
            />

            <rect
                width="520"
                height="360"
                filter="url(#noise)"
                opacity="0.5"
            />

            ${vegetation}

            ${roads}

            ${buildings}

            ${development}

            <rect
                x="0"
                y="0"
                width="520"
                height="360"
                fill="none"
                stroke="#8ca29c"
                stroke-width="2"
                opacity="0.35"
            />

            <text
                x="18"
                y="30"
                fill="#dce8e4"
                font-family="Arial"
                font-size="13"
                letter-spacing="3"
                opacity="0.8"
            >
                GEOSENTINEL AI
            </text>

            <text
                x="18"
                y="342"
                fill="#dce8e4"
                font-family="Arial"
                font-size="11"
                letter-spacing="2"
                opacity="0.65"
            >
                ${period === "t1" ? "T1 · EARLIER OBSERVATION" : "T2 · LATER OBSERVATION"}
            </text>

        </svg>
        `;

        return (
            "data:image/svg+xml;charset=UTF-8," +
            encodeURIComponent(svg)
        );
    }

    /* ========================================================
       UPDATE ALL SCENE IMAGES
       ======================================================== */

    function updateSceneImages() {

        currentSceneT1 =
            t1Select
                ? t1Select.value
                : "urban_1";

        currentSceneT2 =
            t2Select
                ? t2Select.value
                : "urban_1";

        const t1Image =
            createSatelliteSVG(
                currentSceneT1,
                "t1"
            );

        const t2Image =
            createSatelliteSVG(
                currentSceneT2,
                "t2"
            );

        /*
         * PAGE 1
         */

        if (t1Preview)
            t1Preview.src = t1Image;

        if (t2Preview)
            t2Preview.src = t2Image;

        /*
         * PAGE 2
         */

        if (analysisT1)
            analysisT1.src = t1Image;

        if (analysisT2)
            analysisT2.src = t2Image;

        /*
         * PAGE 3
         */

        if (resultT1)
            resultT1.src = t1Image;

        if (resultT2)
            resultT2.src = t2Image;

        currentT1Data = t1Image;
        currentT2Data = t2Image;
    }

    /* ========================================================
       PAGE NAVIGATION
       ======================================================== */

    function showPage(pageNumber) {

        currentPage = pageNumber;

        Object.keys(pages).forEach(number => {

            const page =
                pages[number];

            if (!page)
                return;

            page.classList.remove(
                "active-page"
            );

            page.style.display =
                "none";
        });

        const selected =
            pages[pageNumber];

        if (selected) {

            selected.style.display =
                "block";

            requestAnimationFrame(() => {

                selected.classList.add(
                    "active-page"
                );

            });
        }

        /*
         * Step indicator
         */

        document
            .querySelectorAll(".step")
            .forEach(step => {

                const stepNumber =
                    Number(
                        step.dataset.step
                    );

                step.classList.toggle(
                    "active",
                    stepNumber === pageNumber
                );

                step.classList.toggle(
                    "completed",
                    stepNumber < pageNumber
                );
            });

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }

    /* ========================================================
       PAGE 1 → PAGE 2
       ======================================================== */

    if (continueBtn) {

        continueBtn.addEventListener(
            "click",
            () => {

                updateSceneImages();

                if (analysisStatusText) {

                    analysisStatusText.textContent =
                        "READY FOR AI ANALYSIS";
                }

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
       PAGE 2 → PAGE 3
       ======================================================== */

    if (analyzeBtn) {

        analyzeBtn.addEventListener(
            "click",
            async () => {

                await runAnalysis();
            }
        );
    }

    /* ========================================================
       PAGE 3 → PAGE 1
       ======================================================== */

    if (newAnalysisBtn) {

        newAnalysisBtn.addEventListener(
            "click",
            () => {

                resetResults();

                showPage(1);
            }
        );
    }

    /* ========================================================
       SELECT CHANGES
       ======================================================== */

    if (t1Select) {

        t1Select.addEventListener(
            "change",
            () => {

                updateSceneImages();
            }
        );
    }

    if (t2Select) {

        t2Select.addEventListener(
            "change",
            () => {

                updateSceneImages();
            }
        );
    }

    /* ========================================================
       DATA URL → FILE
       ======================================================== */

    async function dataURLToFile(
        dataURL,
        filename
    ) {

        const response =
            await fetch(dataURL);

        const blob =
            await response.blob();

        return new File(
            [blob],
            filename,
            {
                type: "image/svg+xml"
            }
        );
    }

    /* ========================================================
       IMAGE → 13 CHANNEL TENSOR
       ======================================================== */

    async function imageToTensor(file) {

        return new Promise(
            (resolve, reject) => {

                const image =
                    new Image();

                image.onload = () => {

                    try {

                        const canvas =
                            document.createElement(
                                "canvas"
                            );

                        canvas.width = 256;
                        canvas.height = 256;

                        const ctx =
                            canvas.getContext(
                                "2d",
                                {
                                    willReadFrequently:
                                        true
                                }
                            );

                        ctx.drawImage(
                            image,
                            0,
                            0,
                            256,
                            256
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
                                    (
                                        y * 256 +
                                        x
                                    ) * 4;

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

                        resolve(tensor);

                    } catch (error) {

                        reject(error);
                    }
                };

                image.onerror = () => {

                    reject(
                        new Error(
                            "Unable to process satellite scene."
                        )
                    );
                };

                image.src =
                    URL.createObjectURL(file);
            }
        );
    }

    /* ========================================================
       RUN AI ANALYSIS
       ======================================================== */

    async function runAnalysis() {

        if (analyzeBtn) {

            analyzeBtn.disabled = true;

            analyzeBtn.innerHTML =
                "ANALYZING... <span>✦</span>";
        }

        if (analysisStatusText) {

            analysisStatusText.textContent =
                "RUNNING AI CHANGE DETECTION...";
        }

        try {

            /*
             * Generate the current scenes.
             */

            updateSceneImages();

            /*
             * Convert generated SVG images to files.
             */

            const t1File =
                await dataURLToFile(
                    currentT1Data,
                    "T1_scene.svg"
                );

            const t2File =
                await dataURLToFile(
                    currentT2Data,
                    "T2_scene.svg"
                );

            /*
             * Build tensors.
             */

            const t1Tensor =
                await imageToTensor(
                    t1File
                );

            const t2Tensor =
                await imageToTensor(
                    t2File
                );

            /*
             * Send to Flask.
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

                        body: JSON.stringify({

                            t1:
                                t1Tensor,

                            t2:
                                t2Tensor
                        })
                    }
                );

            let data;

            try {

                data =
                    await response.json();

            } catch {

                throw new Error(
                    "GeoSentinel backend returned an invalid response."
                );
            }

            if (!response.ok) {

                throw new Error(
                    data.error ||
                    data.message ||
                    "GeoSentinel AI analysis failed."
                );
            }

            if (
                data.status &&
                data.status !== "success"
            ) {

                throw new Error(
                    data.message ||
                    "The AI model returned an error."
                );
            }

            currentResult = data;

            displayResults(data);

            /*
             * Move to PAGE 3.
             */

            showPage(3);

            if (analysisStatusText) {

                analysisStatusText.textContent =
                    "ANALYSIS COMPLETE";
            }

        } catch (error) {

            console.error(
                "GeoSentinel analysis error:",
                error
            );

            /*
             * Do NOT use alert().
             * Show the error inside the interface.
             */

            if (analysisStatusText) {

                analysisStatusText.textContent =
                    "ANALYSIS ERROR · " +
                    error.message;
            }

            console.error(
                "Backend error:",
                error.message
            );

        } finally {

            if (analyzeBtn) {

                analyzeBtn.disabled =
                    false;

                analyzeBtn.innerHTML =
                    "ANALYZE CHANGE <span>✦</span>";
            }
        }
    }

    /* ========================================================
       DISPLAY RESULTS
       ======================================================== */

    function displayResults(data) {

        /*
         * Before / after images
         */

        if (resultT1)
            resultT1.src =
                currentT1Data;

        if (resultT2)
            resultT2.src =
                currentT2Data;

        /*
         * Change percentage
         */

        const percentage =
            Number(
                data.change_percentage ??
                data.change_percent ??
                0
            );

        if (changePercentage) {

            changePercentage.textContent =
                percentage.toFixed(2) + "%";
        }

        /*
         * Changed pixels
         */

        if (changePixels) {

            changePixels.textContent =
                formatNumber(
                    data.change_pixels ??
                    0
                );
        }

        /*
         * Total pixels
         */

        if (totalPixels) {

            totalPixels.textContent =
                formatNumber(
                    data.total_pixels ??
                    65536
                );
        }

        /*
         * Threshold
         */

        if (threshold) {

            threshold.textContent =
                Number(
                    data.threshold ??
                    0.60
                ).toFixed(2);
        }

        /*
         * Summary
         */

        if (resultSummary) {

            resultSummary.textContent =
                `GeoSentinel AI completed the temporal comparison for ${SCENES[currentSceneT1].name}.`;
        }

        /*
         * Interpretation
         */

        if (interpretationText) {

            interpretationText.textContent =
                generateInterpretation(
                    percentage
                );
        }

        /*
         * Change map
         */

        if (data.change_map) {

            renderChangeMap(
                data.change_map
            );

        } else {

            generateFallbackChangeMap(
                percentage
            );
        }

        if (mapLoading)
            mapLoading.style.display =
                "none";
    }

    /* ========================================================
       INTERPRETATION
       ======================================================== */

    function generateInterpretation(
        percentage
    ) {

        if (percentage < 5) {

            return (
                "Low-intensity change detected. " +
                "The selected area shows limited spatial differences " +
                "between the earlier and later observations."
            );
        }

        if (percentage < 20) {

            return (
                "Moderate spatial change detected. " +
                "The temporal comparison indicates localized development " +
                "or land-cover transitions within the observed scene."
            );
        }

        return (
            "Significant spatial change detected. " +
            "The comparison indicates substantial development or " +
            "land-cover transformation between T1 and T2."
        );
    }

    /* ========================================================
       CHANGE MAP
       ======================================================== */

    function renderChangeMap(map) {

        if (!changeCanvas || !map)
            return;

        const height =
            map.length;

        const width =
            map[0]
                ? map[0].length
                : 0;

        if (!width || !height)
            return;

        changeCanvas.width =
            width;

        changeCanvas.height =
            height;

        const ctx =
            changeCanvas.getContext("2d");

        const imageData =
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
                    ) >= 0.5;

                const index =
                    (
                        y * width +
                        x
                    ) * 4;

                if (value) {

                    /*
                     * Detected change
                     */

                    imageData.data[index] =
                        255;

                    imageData.data[index + 1] =
                        75;

                    imageData.data[index + 2] =
                        70;

                } else {

                    /*
                     * No change
                     */

                    imageData.data[index] =
                        12;

                    imageData.data[index + 1] =
                        27;

                    imageData.data[index + 2] =
                        32;
                }

                imageData.data[index + 3] =
                    255;
            }
        }

        ctx.putImageData(
            imageData,
            0,
            0
        );

        changeCanvas.style.display =
            "block";
    }

    /* ========================================================
       FALLBACK CHANGE MAP
       
       Used only if backend does not return change_map.
       ======================================================== */

    function generateFallbackChangeMap(
        percentage
    ) {

        if (!changeCanvas)
            return;

        const size = 256;

        changeCanvas.width =
            size;

        changeCanvas.height =
            size;

        const ctx =
            changeCanvas.getContext(
                "2d"
            );

        ctx.clearRect(
            0,
            0,
            size,
            size
        );

        /*
         * Dark base.
         */

        ctx.fillStyle =
            "#0c1b20";

        ctx.fillRect(
            0,
            0,
            size,
            size
        );

        /*
         * Development zones.
         */

        const zones =
            Math.max(
                4,
                Math.round(
                    percentage / 3
                )
            );

        for (
            let i = 0;
            i < zones;
            i++
        ) {

            const x =
                (i * 47) % 220;

            const y =
                (i * 71) % 220;

            const w =
                15 +
                ((i * 13) % 40);

            const h =
                12 +
                ((i * 17) % 35);

            ctx.fillStyle =
                "rgba(255,75,70,0.85)";

            ctx.fillRect(
                x,
                y,
                w,
                h
            );
        }

        changeCanvas.style.display =
            "block";
    }

    /* ========================================================
       RESET
       ======================================================== */

    function resetResults() {

        currentResult =
            null;

        if (changePercentage)
            changePercentage.textContent =
                "--";

        if (changePixels)
            changePixels.textContent =
                "--";

        if (totalPixels)
            totalPixels.textContent =
                "--";

        if (threshold)
            threshold.textContent =
                "--";

        if (interpretationText)
            interpretationText.textContent =
                "Waiting for analysis...";

        if (resultSummary)
            resultSummary.textContent =
                "GeoSentinel AI has completed the temporal comparison.";

        if (changeCanvas) {

            const ctx =
                changeCanvas.getContext(
                    "2d"
                );

            ctx.clearRect(
                0,
                0,
                changeCanvas.width,
                changeCanvas.height
            );
        }
    }

    /* ========================================================
       NUMBER FORMAT
       ======================================================== */

    function formatNumber(value) {

        return Number(
            value
        ).toLocaleString(
            "en-IN"
        );
    }

    /* ========================================================
       API STATUS
       ======================================================== */

    async function checkAPIStatus() {

        try {

            const response =
                await fetch(
                    `${API_BASE}/api/status`
                );

            if (!response.ok)
                return false;

            const data =
                await response.json();

            return (
                data.status ===
                "online"
            );

        } catch {

            return false;
        }
    }

    checkAPIStatus()
        .then(online => {

            document.body.dataset.api =
                online
                    ? "online"
                    : "offline";

            console.log(
                online
                    ? "✓ GeoSentinel AI API online"
                    : "⚠ GeoSentinel AI API unavailable"
            );
        });

    /* ========================================================
       INITIALIZE
       ======================================================== */

    /*
     * Start on PAGE 1.
     */

    showPage(1);

    /*
     * Generate images immediately.
     */

    updateSceneImages();

    console.log(
        "=================================================="
    );

    console.log(
        "GeoSentinel AI frontend initialized."
    );

    console.log(
        "3-page interface ready."
    );

    console.log(
        "No assets folder required."
    );

    console.log(
        "API:",
        API_URL
    );

    console.log(
        "=================================================="
    );

    /* ========================================================
       GLOBAL ACCESS
       ======================================================== */

    window.GeoSentinel = {

        runAnalysis,

        resetResults,

        showPage,

        updateSceneImages,

        checkAPIStatus,

        getResult: () =>
            currentResult
    };

});
