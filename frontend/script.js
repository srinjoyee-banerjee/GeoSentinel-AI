```javascript
/* ============================================================
   GEOSENTINEL AI
   FRONTEND SCRIPT
   3-PAGE VERSION
   REAL ASSETS VERSION

   REQUIRED:
   assets/t1.png
   assets/t2.png
   assets/change_map.png
   assets/change_mask.png
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
       ASSETS
       ======================================================== */

    const ASSETS = {
        t1: "assets/t1.png",
        t2: "assets/t2.png",
        changeMap: "assets/change_map.png",
        changeMask: "assets/change_mask.png"
    };

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

    /*
     * Support either an <img> or canvas for the mask.
     * This means the script will work with the existing HTML
     * if you already have one of these IDs.
     */

    const changeMask =
        $("changeMask") ||
        $("maskImage") ||
        $("resultMask");

    const changeMapImage =
        $("changeMap") ||
        $("changeMapImage") ||
        $("resultChangeMap");

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

    let currentT1Data = null;
    let currentT2Data = null;

    let currentResult = null;

    /* ========================================================
       LOAD REAL SATELLITE ASSETS
       ======================================================== */

    function updateSceneImages() {

        /*
         * REAL T1
         */

        if (t1Preview)
            t1Preview.src = ASSETS.t1;

        /*
         * REAL T2
         */

        if (t2Preview)
            t2Preview.src = ASSETS.t2;

        /*
         * PAGE 2
         */

        if (analysisT1)
            analysisT1.src = ASSETS.t1;

        if (analysisT2)
            analysisT2.src = ASSETS.t2;

        /*
         * PAGE 3
         */

        if (resultT1)
            resultT1.src = ASSETS.t1;

        if (resultT2)
            resultT2.src = ASSETS.t2;

        /*
         * Store actual asset paths.
         */

        currentT1Data = ASSETS.t1;
        currentT2Data = ASSETS.t2;

        /*
         * Preload result assets.
         */

        preloadImage(ASSETS.changeMap);
        preloadImage(ASSETS.changeMask);
    }

    /* ========================================================
       IMAGE PRELOAD
       ======================================================== */

    function preloadImage(src) {

        const image = new Image();

        image.onload = () => {
            console.log("✓ Asset loaded:", src);
        };

        image.onerror = () => {
            console.error("✗ Asset missing:", src);
        };

        image.src = src;
    }

    /* ========================================================
       PAGE NAVIGATION
       ======================================================== */

    function showPage(pageNumber) {

        currentPage = pageNumber;

        Object.keys(pages).forEach(number => {

            const page = pages[number];

            if (!page)
                return;

            page.classList.remove("active-page");

            page.style.display = "none";
        });

        const selected = pages[pageNumber];

        if (selected) {

            selected.style.display = "block";

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
       OLD SELECTS
       
       Kept compatible with the existing HTML.
       The selected value no longer generates SVG scenes.
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
       URL → FILE
       ======================================================== */

    async function urlToFile(
        url,
        filename
    ) {

        const response =
            await fetch(
                `${url}?v=${Date.now()}`
            );

        if (!response.ok) {

            throw new Error(
                `Unable to load ${url}`
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
       IMAGE → 13 CHANNEL TENSOR
       
       The backend currently expects:
       
       [height][width][13]
       
       The original frontend created these 13 channels
       from RGB. We preserve that interface here, but now
       use the REAL PNG images instead of generated SVGs.
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
                            "Unable to process satellite image."
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
                "LOADING T1 AND T2...";
        }

        try {

            /*
             * Make sure real assets are displayed.
             */

            updateSceneImages();

            /*
             * Load REAL T1 PNG.
             */

            const t1File =
                await urlToFile(
                    ASSETS.t1,
                    "t1.png"
                );

            /*
             * Load REAL T2 PNG.
             */

            const t2File =
                await urlToFile(
                    ASSETS.t2,
                    "t2.png"
                );

            if (analysisStatusText) {

                analysisStatusText.textContent =
                    "PREPARING SATELLITE DATA...";
            }

            /*
             * Convert real images to tensors.
             */

            const t1Tensor =
                await imageToTensor(
                    t1File
                );

            const t2Tensor =
                await imageToTensor(
                    t2File
                );

            if (analysisStatusText) {

                analysisStatusText.textContent =
                    "RUNNING AI CHANGE DETECTION...";
            }

            /*
             * Send T1 + T2 to Flask.
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
             * PAGE 3
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

            if (analysisStatusText) {

                analysisStatusText.textContent =
                    "ANALYSIS ERROR · " +
                    error.message;
            }

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
         * REAL T1
         */

        if (resultT1)
            resultT1.src = ASSETS.t1;

        /*
         * REAL T2
         */

        if (resultT2)
            resultT2.src = ASSETS.t2;

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
                "GeoSentinel AI completed the temporal comparison between T1 and T2.";
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
         * REAL CHANGE MAP
         */

        renderRealChangeMap();

        /*
         * REAL CHANGE MASK
         */

        renderRealChangeMask();

        if (mapLoading)
            mapLoading.style.display =
                "none";
    }

    /* ========================================================
       REAL CHANGE MAP
       
       assets/change_map.png
       ======================================================== */

    function renderRealChangeMap() {

        console.log(
            "Loading change map:",
            ASSETS.changeMap
        );

        /*
         * If HTML has an <img> for the change map,
         * use it directly.
         */

        if (
            changeMapImage &&
            changeMapImage.tagName === "IMG"
        ) {

            changeMapImage.src =
                ASSETS.changeMap;

            changeMapImage.style.display =
                "block";

            return;
        }

        /*
         * Otherwise draw PNG into existing canvas.
         */

        if (!changeCanvas)
            return;

        const image =
            new Image();

        image.onload = () => {

            changeCanvas.width =
                image.naturalWidth;

            changeCanvas.height =
                image.naturalHeight;

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

            ctx.drawImage(
                image,
                0,
                0
            );

            changeCanvas.style.display =
                "block";
        };

        image.onerror = () => {

            console.error(
                "Unable to load:",
                ASSETS.changeMap
            );
        };

        image.src =
            `${ASSETS.changeMap}?v=${Date.now()}`;
    }

    /* ========================================================
       REAL CHANGE MASK
       
       assets/change_mask.png
       ======================================================== */

    function renderRealChangeMask() {

        if (!changeMask) {

            console.warn(
                "No change mask element found in HTML."
            );

            return;
        }

        /*
         * If mask is an <img>, simply point it
         * to the real PNG.
         */

        if (
            changeMask.tagName === "IMG"
        ) {

            changeMask.src =
                ASSETS.changeMask;

            changeMask.style.display =
                "block";

            return;
        }

        /*
         * If mask is a canvas, draw the PNG.
         */

        if (
            changeMask.tagName === "CANVAS"
        ) {

            const image =
                new Image();

            image.onload = () => {

                changeMask.width =
                    image.naturalWidth;

                changeMask.height =
                    image.naturalHeight;

                const ctx =
                    changeMask.getContext(
                        "2d"
                    );

                ctx.clearRect(
                    0,
                    0,
                    changeMask.width,
                    changeMask.height
                );

                ctx.drawImage(
                    image,
                    0,
                    0
                );

                changeMask.style.display =
                    "block";
            };

            image.onerror = () => {

                console.error(
                    "Unable to load:",
                    ASSETS.changeMask
                );
            };

            image.src =
                `${ASSETS.changeMask}?v=${Date.now()}`;
        }
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
       RESET
       ======================================================== */

    function resetResults() {

        currentResult = null;

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
                "GeoSentinel AI is ready for a new temporal comparison.";

        /*
         * Reset change map.
         */

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

            changeCanvas.style.display =
                "none";
        }

        /*
         * Reset change map image.
         */

        if (
            changeMapImage &&
            changeMapImage.tagName === "IMG"
        ) {

            changeMapImage.removeAttribute(
                "src"
            );

            changeMapImage.style.display =
                "none";
        }

        /*
         * Reset mask.
         */

        if (changeMask) {

            if (
                changeMask.tagName === "IMG"
            ) {

                changeMask.removeAttribute(
                    "src"
                );

                changeMask.style.display =
                    "none";
            }

            if (
                changeMask.tagName === "CANVAS"
            ) {

                const ctx =
                    changeMask.getContext(
                        "2d"
                    );

                ctx.clearRect(
                    0,
                    0,
                    changeMask.width,
                    changeMask.height
                );

                changeMask.style.display =
                    "none";
            }
        }

        /*
         * Restore T1/T2.
         */

        updateSceneImages();
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

    showPage(1);

    /*
     * Load the four real assets immediately.
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
        "REAL ASSETS ENABLED."
    );

    console.log(
        "T1:",
        ASSETS.t1
    );

    console.log(
        "T2:",
        ASSETS.t2
    );

    console.log(
        "CHANGE MAP:",
        ASSETS.changeMap
    );

    console.log(
        "CHANGE MASK:",
        ASSETS.changeMask
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
```
