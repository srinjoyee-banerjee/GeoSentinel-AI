```javascript
/* ============================================================
   GEOSENTINEL AI
   FRONTEND SCRIPT
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

    const DEMO_T1 = "assets/T1_demo.png";
    const DEMO_T2 = "assets/T2_demo.png";

    /* ========================================================
       DOM HELPERS
       ======================================================== */

    const $ = (id) => document.getElementById(id);

    const query = (selector) =>
        document.querySelector(selector);

    const queryAll = (selector) =>
        document.querySelectorAll(selector);


    /* ========================================================
       COMMON ELEMENTS
       ======================================================== */

    const t1Input =
        $("t1Input") ||
        $("t1File") ||
        query("#t1 input[type='file']") ||
        query("input[name='t1']");

    const t2Input =
        $("t2Input") ||
        $("t2File") ||
        query("#t2 input[type='file']") ||
        query("input[name='t2']");

    const t1Preview =
        $("t1Preview") ||
        $("previewT1") ||
        $("resultT1");

    const t2Preview =
        $("t2Preview") ||
        $("previewT2") ||
        $("resultT2");

    const analyzeButton =
        $("analyzeBtn") ||
        $("analyzeButton") ||
        $("runAnalysis") ||
        query("[data-action='analyze']");

    const resetButton =
        $("resetBtn") ||
        $("resetButton") ||
        query("[data-action='reset']");

    const loading =
        $("loading") ||
        $("loadingOverlay") ||
        $("analysisLoading");

    const resultSection =
        $("results") ||
        $("resultSection") ||
        $("analysisResults");

    const errorBox =
        $("errorMessage") ||
        $("error") ||
        $("statusMessage");

    /* ========================================================
       RESULT ELEMENTS
       ======================================================== */

    const changePercentage =
        $("changePercentage") ||
        $("changePercent") ||
        $("changeValue");

    const changePixels =
        $("changePixels");

    const totalPixels =
        $("totalPixels");

    const thresholdValue =
        $("thresholdValue") ||
        $("threshold");

    const probabilityMin =
        $("probabilityMin");

    const probabilityMax =
        $("probabilityMax");

    const changeMapCanvas =
        $("changeMapCanvas") ||
        $("changeMap");

    const probabilityCanvas =
        $("probabilityCanvas") ||
        $("probabilityMap");

    /* ========================================================
       STATE
       ======================================================== */

    let selectedT1 = null;
    let selectedT2 = null;

    let currentResult = null;

    /* ========================================================
       INITIAL STATE
       ======================================================== */

    hideLoading();
    hideError();

    if (resultSection) {
        resultSection.style.display = "none";
    }

    /* ========================================================
       FILE PREVIEW
       ======================================================== */

    function previewFile(input, preview) {

        if (!input || !preview) {
            return;
        }

        input.addEventListener("change", () => {

            const file = input.files && input.files[0];

            if (!file) {
                return;
            }

            if (!file.type.startsWith("image/")) {
                showError(
                    "Please select a valid satellite image."
                );
                return;
            }

            const reader = new FileReader();

            reader.onload = (event) => {

                preview.src = event.target.result;

                preview.style.display = "block";

                preview.dataset.loaded = "true";
            };

            reader.readAsDataURL(file);
        });
    }

    previewFile(t1Input, t1Preview);
    previewFile(t2Input, t2Preview);

    /* ========================================================
       DEMO IMAGES
       ======================================================== */

    function loadDemoImages() {

        if (t1Preview) {
            t1Preview.src = DEMO_T1;
            t1Preview.style.display = "block";
        }

        if (t2Preview) {
            t2Preview.src = DEMO_T2;
            t2Preview.style.display = "block";
        }
    }


    /* ========================================================
       IMAGE → ARRAY
       
       IMPORTANT:
       The deployed backend expects:
       [1, 256, 256, 13]

       Browser images are RGB, therefore the frontend
       creates a 13-channel representation by repeating
       the RGB-derived channels.

       This is intended for DEMO / frontend operation.
       ======================================================== */

    async function imageToTensor(file) {

        return new Promise((resolve, reject) => {

            const image = new Image();

            image.onload = () => {

                try {

                    const canvas =
                        document.createElement("canvas");

                    canvas.width = 256;
                    canvas.height = 256;

                    const ctx =
                        canvas.getContext("2d", {
                            willReadFrequently: true
                        });

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

                    for (let y = 0; y < 256; y++) {

                        tensor[y] =
                            new Array(256);

                        for (let x = 0; x < 256; x++) {

                            const pixelIndex =
                                (y * 256 + x) * 4;

                            const r =
                                pixels[pixelIndex] / 255;

                            const g =
                                pixels[pixelIndex + 1] / 255;

                            const b =
                                pixels[pixelIndex + 2] / 255;

                            /*
                             * 13-channel approximation
                             *
                             * The real model expects 13
                             * channels. For browser demo
                             * images we construct a stable
                             * 13-channel tensor from RGB.
                             */

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

                    resolve([tensor]);

                } catch (error) {

                    reject(error);
                }
            };

            image.onerror = () => {

                reject(
                    new Error(
                        "Unable to read the selected image."
                    )
                );
            };

            image.src =
                URL.createObjectURL(file);
        });
    }


    /* ========================================================
       GET IMAGE FILE
       ======================================================== */

    function getFile(input) {

        if (!input || !input.files) {
            return null;
        }

        return input.files[0] || null;
    }


    /* ========================================================
       DEMO FILE LOADER
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
       RUN ANALYSIS
       ======================================================== */

    async function runAnalysis() {

        hideError();

        let t1File =
            getFile(t1Input);

        let t2File =
            getFile(t2Input);

        /*
         * If no files are selected, automatically use
         * the included demo scenes.
         */

        if (!t1File) {

            try {

                t1File =
                    await urlToFile(
                        DEMO_T1,
                        "T1_demo.png"
                    );

            } catch (error) {

                showError(
                    "T1 image is missing. Please upload a T1 image."
                );

                return;
            }
        }

        if (!t2File) {

            try {

                t2File =
                    await urlToFile(
                        DEMO_T2,
                        "T2_demo.png"
                    );

            } catch (error) {

                showError(
                    "T2 image is missing. Please upload a T2 image."
                );

                return;
            }
        }

        selectedT1 = t1File;
        selectedT2 = t2File;

        try {

            showLoading();

            setAnalysisButtonState(true);

            /*
             * Convert both images.
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
             * Backend expects JSON:
             *
             * {
             *   t1: [...],
             *   t2: [...]
             * }
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
                            t1: t1Tensor[0],
                            t2: t2Tensor[0]
                        })
                    }
                );

            const data =
                await response.json();

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
                    "Model returned an error."
                );
            }

            currentResult = data;

            displayResults(data);

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

            hideLoading();

            setAnalysisButtonState(false);
        }
    }


    /* ========================================================
       DISPLAY RESULTS
       ======================================================== */

    function displayResults(data) {

        if (resultSection) {
            resultSection.style.display = "";
        }

        /*
         * Change percentage
         */

        if (changePercentage) {

            const percentage =
                Number(
                    data.change_percentage || 0
                );

            changePercentage.textContent =
                `${percentage.toFixed(2)}%`;
        }

        /*
         * Change pixels
         */

        if (changePixels) {

            changePixels.textContent =
                formatNumber(
                    data.change_pixels || 0
                );
        }

        /*
         * Total pixels
         */

        if (totalPixels) {

            totalPixels.textContent =
                formatNumber(
                    data.total_pixels || 0
                );
        }

        /*
         * Threshold
         */

        if (thresholdValue) {

            const threshold =
                Number(
                    data.threshold ?? 0.60
                );

            thresholdValue.textContent =
                threshold.toFixed(2);
        }

        /*
         * Probability range
         */

        if (probabilityMin) {

            probabilityMin.textContent =
                Number(
                    data.probability_min || 0
                ).toFixed(4);
        }

        if (probabilityMax) {

            probabilityMax.textContent =
                Number(
                    data.probability_max || 0
                ).toFixed(4);
        }

        /*
         * Render change map.
         */

        if (data.change_map) {

            renderChangeMap(
                data.change_map,
                changeMapCanvas
            );
        }

        /*
         * Render probability map.
         */

        if (data.probability_map) {

            renderProbabilityMap(
                data.probability_map,
                probabilityCanvas
            );
        }

        /*
         * Scroll to results.
         */

        if (resultSection) {

            setTimeout(() => {

                resultSection.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });

            }, 150);
        }
    }


    /* ========================================================
       CHANGE MAP
       ======================================================== */

    function renderChangeMap(
        map,
        canvas
    ) {

        if (!canvas || !map) {
            return;
        }

        const height =
            map.length;

        const width =
            map[0]?.length || 0;

        if (!width || !height) {
            return;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx =
            canvas.getContext("2d");

        const imageData =
            ctx.createImageData(
                width,
                height
            );

        for (let y = 0; y < height; y++) {

            for (let x = 0; x < width; x++) {

                const value =
                    Number(
                        map[y][x]
                    ) >= 0.5
                        ? 1
                        : 0;

                const index =
                    (y * width + x) * 4;

                if (value === 1) {

                    /*
                     * Change region
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
                     * No change
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

        canvas.style.display = "block";
    }


    /* ========================================================
       PROBABILITY MAP
       ======================================================== */

    function renderProbabilityMap(
        map,
        canvas
    ) {

        if (!canvas || !map) {
            return;
        }

        const height =
            map.length;

        const width =
            map[0]?.length || 0;

        if (!width || !height) {
            return;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx =
            canvas.getContext("2d");

        const imageData =
            ctx.createImageData(
                width,
                height
            );

        for (let y = 0; y < height; y++) {

            for (let x = 0; x < width; x++) {

                const value =
                    Math.max(
                        0,
                        Math.min(
                            1,
                            Number(
                                map[y][x]
                            )
                        )
                    );

                /*
                 * Dark → cyan → yellow → white
                 * probability visualization.
                 */

                const r =
                    Math.round(
                        255 * value
                    );

                const g =
                    Math.round(
                        120 * value
                    );

                const b =
                    Math.round(
                        255 * (1 - value)
                    );

                const index =
                    (y * width + x) * 4;

                imageData.data[index] =
                    r;

                imageData.data[index + 1] =
                    g;

                imageData.data[index + 2] =
                    b;

                imageData.data[index + 3] =
                    255;
            }
        }

        ctx.putImageData(
            imageData,
            0,
            0
        );

        canvas.style.display = "block";
    }


    /* ========================================================
       NUMBER FORMAT
       ======================================================== */

    function formatNumber(value) {

        return Number(value)
            .toLocaleString(
                "en-IN"
            );
    }


    /* ========================================================
       LOADING
       ======================================================== */

    function showLoading() {

        if (loading) {

            loading.style.display =
                "flex";
        }

        document.body.classList.add(
            "analysis-running"
        );
    }

    function hideLoading() {

        if (loading) {

            loading.style.display =
                "none";
        }

        document.body.classList.remove(
            "analysis-running"
        );
    }


    /* ========================================================
       ERROR HANDLING
       ======================================================== */

    function showError(message) {

        console.error(
            message
        );

        if (!errorBox) {
            return;
        }

        errorBox.textContent =
            message;

        errorBox.style.display =
            "block";
    }

    function hideError() {

        if (!errorBox) {
            return;
        }

        errorBox.textContent = "";

        errorBox.style.display =
            "none";
    }


    /* ========================================================
       BUTTON STATE
       ======================================================== */

    function setAnalysisButtonState(
        running
    ) {

        if (!analyzeButton) {
            return;
        }

        analyzeButton.disabled =
            running;

        if (running) {

            analyzeButton.dataset.originalText =
                analyzeButton.textContent;

            analyzeButton.textContent =
                "ANALYZING...";

        } else {

            analyzeButton.textContent =
                analyzeButton.dataset.originalText ||
                "ANALYZE CHANGE";
        }
    }


    /* ========================================================
       RESET
       ======================================================== */

    function resetAnalysis() {

        selectedT1 = null;
        selectedT2 = null;
        currentResult = null;

        hideError();

        if (t1Input) {
            t1Input.value = "";
        }

        if (t2Input) {
            t2Input.value = "";
        }

        if (t1Preview) {

            t1Preview.removeAttribute(
                "src"
            );

            t1Preview.style.display =
                "none";
        }

        if (t2Preview) {

            t2Preview.removeAttribute(
                "src"
            );

            t2Preview.style.display =
                "none";
        }

        if (resultSection) {

            resultSection.style.display =
                "none";
        }

        clearCanvas(
            changeMapCanvas
        );

        clearCanvas(
            probabilityCanvas
        );

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }


    function clearCanvas(canvas) {

        if (!canvas) {
            return;
        }

        const ctx =
            canvas.getContext("2d");

        ctx.clearRect(
            0,
            0,
            canvas.width,
            canvas.height
        );
    }


    /* ========================================================
       EVENT LISTENERS
       ======================================================== */

    if (analyzeButton) {

        analyzeButton.addEventListener(
            "click",
            (event) => {

                event.preventDefault();

                runAnalysis();
            }
        );
    }

    if (resetButton) {

        resetButton.addEventListener(
            "click",
            (event) => {

                event.preventDefault();

                resetAnalysis();
            }
        );
    }


    /* ========================================================
       DEMO BUTTONS
       ======================================================== */

    queryAll(
        "[data-demo]"
    ).forEach((button) => {

        button.addEventListener(
            "click",
            () => {

                loadDemoImages();

                /*
                 * Demo buttons should not automatically
                 * run the model unless explicitly marked
                 * with data-demo="analyze".
                 */

                if (
                    button.dataset.demo ===
                    "analyze"
                ) {

                    runAnalysis();
                }
            }
        );
    });


    /* ========================================================
       DRAG & DROP
       ======================================================== */

    function enableDropZone(
        zone,
        input
    ) {

        if (!zone || !input) {
            return;
        }

        [
            "dragenter",
            "dragover"
        ].forEach(
            (eventName) => {

                zone.addEventListener(
                    eventName,
                    (event) => {

                        event.preventDefault();

                        zone.classList.add(
                            "drag-active"
                        );
                    }
                );
            }
        );

        [
            "dragleave",
            "drop"
        ].forEach(
            (eventName) => {

                zone.addEventListener(
                    eventName,
                    (event) => {

                        event.preventDefault();

                        zone.classList.remove(
                            "drag-active"
                        );
                    }
                );
            }
        );

        zone.addEventListener(
            "drop",
            (event) => {

                const files =
                    event.dataTransfer.files;

                if (
                    !files ||
                    !files.length
                ) {
                    return;
                }

                const file =
                    files[0];

                if (
                    !file.type.startsWith(
                        "image/"
                    )
                ) {

                    showError(
                        "Please drop an image file."
                    );

                    return;
                }

                try {

                    const dataTransfer =
                        new DataTransfer();

                    dataTransfer.items.add(
                        file
                    );

                    input.files =
                        dataTransfer.files;

                    input.dispatchEvent(
                        new Event(
                            "change",
                            {
                                bubbles: true
                            }
                        )
                    );

                } catch (error) {

                    console.error(
                        error
                    );
                }
            }
        );
    }


    enableDropZone(
        $("t1DropZone") ||
        query(".t1-drop-zone"),
        t1Input
    );

    enableDropZone(
        $("t2DropZone") ||
        query(".t2-drop-zone"),
        t2Input
    );


    /* ========================================================
       KEYBOARD ACCESS
       ======================================================== */

    document.addEventListener(
        "keydown",
        (event) => {

            /*
             * Ctrl/Cmd + Enter
             * runs analysis.
             */

            if (
                (event.ctrlKey ||
                    event.metaKey) &&
                event.key === "Enter"
            ) {

                event.preventDefault();

                runAnalysis();
            }

            /*
             * Escape
             * closes loading/error state.
             */

            if (
                event.key === "Escape"
            ) {

                hideLoading();
            }
        }
    );


    /* ========================================================
       API STATUS CHECK
       ======================================================== */

    async function checkAPIStatus() {

        try {

            const response =
                await fetch(
                    `${API_BASE}/api/status`,
                    {
                        method: "GET"
                    }
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
       INITIAL API CHECK
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
       GLOBAL ACCESS
       ======================================================== */

    window.GeoSentinel = {

        runAnalysis,

        resetAnalysis,

        loadDemoImages,

        checkAPIStatus,

        getResult: () =>
            currentResult
    };


    /* ========================================================
       READY
       ======================================================== */

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
});
```
