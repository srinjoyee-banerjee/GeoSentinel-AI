/* ============================================================
   GEOSENTINEL AI
   FRONTEND SCRIPT
   3-PAGE SATELLITE CHANGE DETECTION INTERFACE
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {

    /* ========================================================
       CONFIGURATION
    ======================================================== */

    const API_BASE =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1"
            ? "http://127.0.0.1:5000"
            : "";

    const API_URL = `${API_BASE}/predict`;

    const DEFAULT_SCENE = "urban_1";

    /* ========================================================
       DOM HELPER
    ======================================================== */

    const $ = (id) => document.getElementById(id);

    const query = (selector) =>
        document.querySelector(selector);

    const queryAll = (selector) =>
        document.querySelectorAll(selector);


    /* ========================================================
       PAGES
    ======================================================== */

    const page1 = $("page1");
    const page2 = $("page2");
    const page3 = $("page3");

    const pages = [
        page1,
        page2,
        page3
    ].filter(Boolean);


    /* ========================================================
       NAVIGATION
    ======================================================== */

    const stepIndicators =
        queryAll(".step");

    function showPage(pageNumber) {

        pages.forEach((page) => {

            page.classList.remove(
                "active-page"
            );

        });

        const targetPage =
            $(`page${pageNumber}`);

        if (targetPage) {

            targetPage.classList.add(
                "active-page"
            );
        }

        stepIndicators.forEach((step) => {

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
       SCENE CONFIGURATION
    ======================================================== */

    const scenes = {

        urban_1: {
            name: "Urban Expansion 01",

            t1:
                "assets/urban_1_T1.png",

            t2:
                "assets/urban_1_T2.png"
        },

        urban_2: {
            name: "Urban Expansion 02",

            t1:
                "assets/urban_2_T1.png",

            t2:
                "assets/urban_2_T2.png"
        },

        urban_3: {
            name: "Urban Expansion 03",

            t1:
                "assets/urban_3_T1.png",

            t2:
                "assets/urban_3_T2.png"
        }
    };


    /* ========================================================
       SCENE SELECTORS
    ======================================================== */

    const t1Select =
        $("t1Select");

    const t2Select =
        $("t2Select");


    /* ========================================================
       PREVIEW ELEMENTS
    ======================================================== */

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


    /* ========================================================
       BUTTONS
    ======================================================== */

    const continueBtn =
        $("continueBtn");

    const backBtn =
        $("backBtn");

    const analyzeBtn =
        $("analyzeBtn");

    const newAnalysisBtn =
        $("newAnalysisBtn");


    /* ========================================================
       RESULT ELEMENTS
    ======================================================== */

    const changePercentage =
        $("changePercentage");

    const changePixels =
        $("changePixels");

    const totalPixels =
        $("totalPixels");

    const threshold =
        $("threshold");

    const interpretationText =
        $("interpretationText");

    const resultSummary =
        $("resultSummary");

    const changeCanvas =
        $("changeCanvas");

    const mapLoading =
        $("mapLoading");


    /* ========================================================
       STATUS
    ======================================================== */

    const analysisStatus =
        $("analysisStatus");


    /* ========================================================
       STATE
    ======================================================== */

    let selectedSceneT1 =
        DEFAULT_SCENE;

    let selectedSceneT2 =
        DEFAULT_SCENE;

    let currentResult =
        null;


    /* ========================================================
       INITIALIZATION
    ======================================================== */

    initializeScene();

    showPage(1);

    console.log(
        "=================================================="
    );

    console.log(
        "GeoSentinel AI frontend initialized."
    );

    console.log(
        "API:",
        API_URL
    );

    console.log(
        "=================================================="
    );


    /* ========================================================
       INITIAL SCENE
    ======================================================== */

    function initializeScene() {

        if (t1Select) {

            t1Select.value =
                DEFAULT_SCENE;
        }

        if (t2Select) {

            t2Select.value =
                DEFAULT_SCENE;
        }

        updateT1Preview();
        updateT2Preview();
    }


    /* ========================================================
       UPDATE T1
    ======================================================== */

    function updateT1Preview() {

        const sceneKey =
            t1Select
                ? t1Select.value
                : DEFAULT_SCENE;

        const scene =
            scenes[sceneKey];

        if (!scene) {
            return;
        }

        selectedSceneT1 =
            sceneKey;

        if (t1Preview) {

            t1Preview.src =
                scene.t1;
        }

        if (analysisT1) {

            analysisT1.src =
                scene.t1;
        }

        if (resultT1) {

            resultT1.src =
                scene.t1;
        }
    }


    /* ========================================================
       UPDATE T2
    ======================================================== */

    function updateT2Preview() {

        const sceneKey =
            t2Select
                ? t2Select.value
                : DEFAULT_SCENE;

        const scene =
            scenes[sceneKey];

        if (!scene) {
            return;
        }

        selectedSceneT2 =
            sceneKey;

        if (t2Preview) {

            t2Preview.src =
                scene.t2;
        }

        if (analysisT2) {

            analysisT2.src =
                scene.t2;
        }

        if (resultT2) {

            resultT2.src =
                scene.t2;
        }
    }


    /* ========================================================
       SELECT EVENTS
    ======================================================== */

    if (t1Select) {

        t1Select.addEventListener(
            "change",
            () => {

                updateT1Preview();
            }
        );
    }


    if (t2Select) {

        t2Select.addEventListener(
            "change",
            () => {

                updateT2Preview();
            }
        );
    }


    /* ========================================================
       CONTINUE TO ANALYSIS
    ======================================================== */

    if (continueBtn) {

        continueBtn.addEventListener(
            "click",
            (event) => {

                event.preventDefault();

                updateT1Preview();
                updateT2Preview();

                updateAnalysisStatus(
                    "READY FOR AI ANALYSIS",
                    false
                );

                showPage(2);
            }
        );
    }


    /* ========================================================
       BACK TO SCENE SELECTION
    ======================================================== */

    if (backBtn) {

        backBtn.addEventListener(
            "click",
            (event) => {

                event.preventDefault();

                showPage(1);
            }
        );
    }


    /* ========================================================
       ANALYZE BUTTON
    ======================================================== */

    if (analyzeBtn) {

        analyzeBtn.addEventListener(
            "click",
            async (event) => {

                event.preventDefault();

                await runAnalysis();
            }
        );
    }


    /* ========================================================
       NEW ANALYSIS
    ======================================================== */

    if (newAnalysisBtn) {

        newAnalysisBtn.addEventListener(
            "click",
            (event) => {

                event.preventDefault();

                resetAnalysis();

                showPage(1);
            }
        );
    }


    /* ========================================================
       RUN ANALYSIS
    ======================================================== */

    async function runAnalysis() {

        if (!scenes[selectedSceneT1]) {

            showAnalysisError(
                "Invalid T1 scene selected."
            );

            return;
        }

        if (!scenes[selectedSceneT2]) {

            showAnalysisError(
                "Invalid T2 scene selected."
            );

            return;
        }

        try {

            setAnalysisRunning(true);

            updateAnalysisStatus(
                "RUNNING AI CHANGE DETECTION...",
                true
            );

            if (mapLoading) {

                mapLoading.style.display =
                    "flex";
            }

            /*
             * Load selected satellite images.
             */

            const t1File =
                await urlToFile(
                    scenes[selectedSceneT1].t1,
                    `${selectedSceneT1}_T1.png`
                );

            const t2File =
                await urlToFile(
                    scenes[selectedSceneT2].t2,
                    `${selectedSceneT2}_T2.png`
                );

            /*
             * Convert images to model input.
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
             * Send request to Flask backend.
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

            } catch (jsonError) {

                throw new Error(
                    "The GeoSentinel backend returned an invalid response."
                );
            }


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    data.error ||
                    "GeoSentinel analysis failed."
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


            currentResult =
                data;


            /*
             * Display result images.
             */

            updateResultImages();


            /*
             * Display AI results.
             */

            displayResults(
                data
            );


            /*
             * Move to results page.
             */

            showPage(3);


        } catch (error) {

            console.error(
                "GeoSentinel error:",
                error
            );

            showAnalysisError(
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

                        canvas.width =
                            256;

                        canvas.height =
                            256;


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

                                    Math.abs(
                                        r - g
                                    ),

                                    Math.abs(
                                        g - b
                                    ),

                                    Math.abs(
                                        r - b
                                    ),

                                    (
                                        r +
                                        g +
                                        b
                                    ) / 3,

                                    r * r,

                                    g * g,

                                    b * b
                                ];
                            }
                        }


                        resolve(
                            tensor
                        );


                    } catch (error) {

                        reject(
                            error
                        );
                    }
                };


                image.onerror = () => {

                    reject(
                        new Error(
                            "Unable to read satellite image."
                        )
                    );
                };


                image.src =
                    URL.createObjectURL(
                        file
                    );
            }
        );
    }


    /* ========================================================
       URL → FILE
    ======================================================== */

    async function urlToFile(
        url,
        filename
    ) {

        const response =
            await fetch(url);

        if (!response.ok) {

            throw new Error(
                `Unable to load ${filename}.`
            );
        }

        const blob =
            await response.blob();

        return new File(
            [blob],
            filename,
            {
                type:
                    blob.type ||
                    "image/png"
            }
        );
    }


    /* ========================================================
       UPDATE RESULT IMAGES
    ======================================================== */

    function updateResultImages() {

        const t1 =
            scenes[selectedSceneT1];

        const t2 =
            scenes[selectedSceneT2];


        if (resultT1) {

            resultT1.src =
                t1.t1;
        }


        if (resultT2) {

            resultT2.src =
                t2.t2;
        }
    }


    /* ========================================================
       DISPLAY RESULTS
    ======================================================== */

    function displayResults(data) {

        const percentage =
            Number(
                data.change_percentage ??
                data.change_percent ??
                0
            );


        const changedPixels =
            Number(
                data.change_pixels ??
                0
            );


        const pixels =
            Number(
                data.total_pixels ??
                256 * 256
            );


        const modelThreshold =
            Number(
                data.threshold ??
                0.60
            );


        if (changePercentage) {

            changePercentage.textContent =
                `${percentage.toFixed(2)}%`;
        }


        if (changePixels) {

            changePixels.textContent =
                formatNumber(
                    changedPixels
                );
        }


        if (totalPixels) {

            totalPixels.textContent =
                formatNumber(
                    pixels
                );
        }


        if (threshold) {

            threshold.textContent =
                modelThreshold.toFixed(2);
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
                changeCanvas,
                modelThreshold
            );
        }


        /*
         * Interpretation.
         */

        const interpretation =
            generateInterpretation(
                percentage
            );


        if (interpretationText) {

            interpretationText.textContent =
                interpretation;
        }


        if (resultSummary) {

            resultSummary.textContent =
                `GeoSentinel AI analyzed ${scenes[selectedSceneT1].name} and compared the earlier and later satellite observations.`;
        }


        updateAnalysisStatus(
            "ANALYSIS COMPLETE",
            false
        );
    }


    /* ========================================================
       CHANGE MAP
    ======================================================== */

    function renderChangeMap(
        map,
        canvas,
        thresholdValue = 0.60
    ) {

        if (
            !canvas ||
            !Array.isArray(map)
        ) {

            return;
        }


        const height =
            map.length;


        const width =
            map[0]?.length || 0;


        if (
            !width ||
            !height
        ) {

            return;
        }


        canvas.width =
            width;

        canvas.height =
            height;


        const ctx =
            canvas.getContext(
                "2d"
            );


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
                    );


                const changed =
                    value >=
                    thresholdValue;


                const index =
                    (y * width + x) * 4;


                if (changed) {

                    /*
                     * Changed pixels
                     */

                    imageData.data[index] =
                        255;

                    imageData.data[index + 1] =
                        72;

                    imageData.data[index + 2] =
                        72;

                    imageData.data[index + 3] =
                        255;

                } else {

                    /*
                     * Unchanged pixels
                     */

                    imageData.data[index] =
                        20;

                    imageData.data[index + 1] =
                        28;

                    imageData.data[index + 2] =
                        38;

                    imageData.data[index + 3] =
                        255;
                }
            }
        }


        ctx.putImageData(
            imageData,
            0,
            0
        );


        canvas.style.display =
            "block";
    }


    /* ========================================================
       INTERPRETATION
    ======================================================== */

    function generateInterpretation(
        percentage
    ) {

        if (percentage <= 1) {

            return (
                "Very limited surface change was detected between the two satellite observations. The scene remains largely stable."
            );
        }


        if (percentage <= 5) {

            return (
                "A small amount of spatial change was detected. The affected regions represent localized modifications within the observed area."
            );
        }


        if (percentage <= 15) {

            return (
                "Moderate spatial change was detected. The observed pattern suggests noticeable land-surface modification between the two time points."
            );
        }


        if (percentage <= 30) {

            return (
                "Significant spatial change was detected across the scene. The distribution of changed pixels indicates substantial land-surface transformation."
            );
        }


        return (
            "Extensive spatial change was detected. A large proportion of the observed scene has undergone measurable transformation between T1 and T2."
        );
    }


    /* ========================================================
       ANALYSIS STATUS
    ======================================================== */

    function updateAnalysisStatus(
        message,
        running
    ) {

        if (!analysisStatus) {
            return;
        }


        const statusText =
            analysisStatus.querySelector(
                "span"
            );


        if (statusText) {

            statusText.textContent =
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
       ANALYZE BUTTON STATE
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

            analyzeBtn.dataset.originalText =
                analyzeBtn.textContent;


            analyzeBtn.textContent =
                "ANALYZING...";

        } else {

            analyzeBtn.textContent =
                analyzeBtn.dataset.originalText ||
                "ANALYZE CHANGE";
        }
    }


    /* ========================================================
       ERROR
    ======================================================== */

    function showAnalysisError(
        message
    ) {

        console.error(
            "GeoSentinel:",
            message
        );


        updateAnalysisStatus(
            "ANALYSIS ERROR",
            false
        );


        /*
         * Use browser alert as a fallback because
         * the new index.html does not contain a
         * dedicated error element.
         */

        alert(
            `GeoSentinel AI\n\n${message}`
        );
    }


    /* ========================================================
       RESET
    ======================================================== */

    function resetAnalysis() {

        currentResult =
            null;


        selectedSceneT1 =
            DEFAULT_SCENE;

        selectedSceneT2 =
            DEFAULT_SCENE;


        if (t1Select) {

            t1Select.value =
                DEFAULT_SCENE;
        }


        if (t2Select) {

            t2Select.value =
                DEFAULT_SCENE;
        }


        updateT1Preview();
        updateT2Preview();


        if (changePercentage) {

            changePercentage.textContent =
                "--";
        }


        if (changePixels) {

            changePixels.textContent =
                "--";
        }


        if (totalPixels) {

            totalPixels.textContent =
                "--";
        }


        if (threshold) {

            threshold.textContent =
                "--";
        }


        if (interpretationText) {

            interpretationText.textContent =
                "Waiting for analysis...";
        }


        if (resultSummary) {

            resultSummary.textContent =
                "GeoSentinel AI has completed the temporal comparison.";
        }


        clearCanvas(
            changeCanvas
        );


        if (mapLoading) {

            mapLoading.style.display =
                "none";
        }


        updateAnalysisStatus(
            "READY FOR AI ANALYSIS",
            false
        );
    }


    /* ========================================================
       CLEAR CANVAS
    ======================================================== */

    function clearCanvas(
        canvas
    ) {

        if (!canvas) {
            return;
        }


        const ctx =
            canvas.getContext(
                "2d"
            );


        ctx.clearRect(
            0,
            0,
            canvas.width,
            canvas.height
        );
    }


    /* ========================================================
       NUMBER FORMAT
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
       API STATUS
    ======================================================== */

    async function checkAPIStatus() {

        try {

            const response =
                await fetch(
                    `${API_BASE}/api/status`
                );


            if (!response.ok) {

                return false;
            }


            const data =
                await response.json();


            return (
                data.status ===
                "online"
            );


        } catch (error) {

            console.warn(
                "GeoSentinel API status unavailable."
            );

            return false;
        }
    }


    /* ========================================================
       API STATUS INITIALIZATION
    ======================================================== */

    checkAPIStatus()
        .then((online) => {

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
       KEYBOARD ACCESS
    ======================================================== */

    document.addEventListener(
        "keydown",
        (event) => {

            /*
             * Ctrl/Cmd + Enter
             * Run analysis from Page 2.
             */

            if (
                (event.ctrlKey ||
                    event.metaKey) &&
                event.key === "Enter"
            ) {

                event.preventDefault();

                if (
                    page2 &&
                    page2.classList.contains(
                        "active-page"
                    )
                ) {

                    runAnalysis();
                }
            }


            /*
             * Escape
             * Return to previous page.
             */

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
       GLOBAL ACCESS
    ======================================================== */

    window.GeoSentinel = {

        runAnalysis,

        resetAnalysis,

        checkAPIStatus,

        getResult: () =>
            currentResult,

        showPage
    };

});
