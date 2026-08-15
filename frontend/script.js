// ============================================================
// GEOSENTINEL AI
// 3-PAGE DEMO FRONTEND
// ============================================================

const API_BASE = "";

const scenes = {
    urban_1: {
        name: "Urban Expansion 01",
        t1: "urban_1_T1.png",
        t2: "urban_1_T2.png",
        n1: "urban_1_T1.npy",
        n2: "urban_1_T2.npy"
    },

    urban_2: {
        name: "Urban Expansion 02",
        t1: "urban_2_T1.png",
        t2: "urban_2_T2.png",
        n1: "urban_2_T1.npy",
        n2: "urban_2_T2.npy"
    },

    urban_3: {
        name: "Urban Expansion 03",
        t1: "urban_3_T1.png",
        t2: "urban_3_T2.png",
        n1: "urban_3_T1.npy",
        n2: "urban_3_T2.npy"
    }
};


let selectedScene = "urban_1";
let lastResult = null;


// ============================================================
// ELEMENTS
// ============================================================

const page1 = document.getElementById("page1");
const page2 = document.getElementById("page2");
const page3 = document.getElementById("page3");

const t1Select = document.getElementById("t1Select");
const t2Select = document.getElementById("t2Select");

const t1Preview = document.getElementById("t1Preview");
const t2Preview = document.getElementById("t2Preview");

const analysisT1 = document.getElementById("analysisT1");
const analysisT2 = document.getElementById("analysisT2");

const resultT1 = document.getElementById("resultT1");
const resultT2 = document.getElementById("resultT2");

const continueBtn = document.getElementById("continueBtn");
const backBtn = document.getElementById("backBtn");
const analyzeBtn = document.getElementById("analyzeBtn");
const newAnalysisBtn = document.getElementById("newAnalysisBtn");

const analysisStatus =
    document.getElementById("analysisStatus");


// ============================================================
// PAGE NAVIGATION
// ============================================================

function showPage(number) {

    page1.classList.remove("active-page");
    page2.classList.remove("active-page");
    page3.classList.remove("active-page");

    if (number === 1) {
        page1.classList.add("active-page");
    }

    if (number === 2) {
        page2.classList.add("active-page");
    }

    if (number === 3) {
        page3.classList.add("active-page");
    }

    document.querySelectorAll(".step").forEach(step => {

        const stepNumber =
            Number(step.dataset.step);

        step.classList.toggle(
            "active",
            stepNumber === number
        );

    });

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


// ============================================================
// UPDATE SCENE PREVIEWS
// ============================================================

function updateScene() {

    const t1 = scenes[t1Select.value];
    const t2 = scenes[t2Select.value];

    t1Preview.src =
        `assets/${t1.t1}`;

    t2Preview.src =
        `assets/${t2.t2}`;

    selectedScene = t1Select.value;
}


// ============================================================
// T1 SELECTION
// ============================================================

t1Select.addEventListener(
    "change",
    updateScene
);


// ============================================================
// T2 SELECTION
// ============================================================

t2Select.addEventListener(
    "change",
    updateScene
);


// ============================================================
// PAGE 1 → PAGE 2
// ============================================================

continueBtn.addEventListener(
    "click",
    () => {

        const t1 = scenes[t1Select.value];
        const t2 = scenes[t2Select.value];

        selectedScene = t1Select.value;

        analysisT1.src =
            `assets/${t1.t1}`;

        analysisT2.src =
            `assets/${t2.t2}`;

        analysisStatus.innerHTML = `
            <div class="status-dot"></div>
            <span>
                READY · ${t1.name.toUpperCase()}
            </span>
        `;

        showPage(2);
    }
);


// ============================================================
// PAGE 2 → PAGE 1
// ============================================================

backBtn.addEventListener(
    "click",
    () => showPage(1)
);


// ============================================================
// FETCH DEMO NUMPY FILE
// ============================================================

async function fetchDemoFile(filename) {

    const response = await fetch(
        `demo/${filename}`
    );

    if (!response.ok) {

        throw new Error(
            `Unable to load ${filename}`
        );
    }

    return await response.blob();
}


// ============================================================
// ANALYZE
// ============================================================

analyzeBtn.addEventListener(
    "click",
    async () => {

        try {

            analyzeBtn.disabled = true;

            analyzeBtn.innerHTML =
                "RUNNING AI ANALYSIS · · ·";


            analysisStatus.innerHTML = `
                <div class="status-dot"></div>
                <span>
                    GEO SENTINEL MODEL IS PROCESSING THE SCENE...
                </span>
            `;


            const t1Key =
                t1Select.value;

            const t2Key =
                t2Select.value;

            const t1 =
                scenes[t1Key];

            const t2 =
                scenes[t2Key];


            // ------------------------------------------------
            // LOAD DEMO ARRAYS
            // ------------------------------------------------

            const t1Blob =
                await fetchDemoFile(t1.n1);

            const t2Blob =
                await fetchDemoFile(t2.n2);


            // ------------------------------------------------
            // BUILD MULTIPART REQUEST
            // ------------------------------------------------

            const formData =
                new FormData();

            formData.append(
                "t1",
                t1Blob,
                t1.n1
            );

            formData.append(
                "t2",
                t2Blob,
                t2.n2
            );


            // ------------------------------------------------
            // SEND TO FLASK
            // ------------------------------------------------

            const response =
                await fetch(
                    `${API_BASE}/predict-npy`,
                    {
                        method: "POST",
                        body: formData
                    }
                );


            const result =
                await response.json();


            if (!response.ok ||
                result.status !== "success") {

                throw new Error(
                    result.message ||
                    "AI analysis failed."
                );
            }


            lastResult = result;


            // ------------------------------------------------
            // SHOW RESULTS
            // ------------------------------------------------

            displayResults(
                t1Key,
                t2Key,
                result
            );

            showPage(3);


        } catch (error) {

            console.error(error);

            analysisStatus.innerHTML = `
                <div
                    class="status-dot"
                    style="background:#ff7b72"
                ></div>

                <span style="color:#ff7b72">
                    ANALYSIS ERROR · ${error.message}
                </span>
            `;

        } finally {

            analyzeBtn.disabled = false;

            analyzeBtn.innerHTML =
                `ANALYZE CHANGE <span>✦</span>`;
        }

    }
);


// ============================================================
// DISPLAY RESULTS
// ============================================================

function displayResults(
    t1Key,
    t2Key,
    result
) {

    const t1 =
        scenes[t1Key];

    const t2 =
        scenes[t2Key];


    resultT1.src =
        `assets/${t1.t1}`;

    resultT2.src =
        `assets/${t2.t2`;


    document.getElementById(
        "changePercentage"
    ).textContent =
        `${result.change_percentage.toFixed(2)}%`;


    document.getElementById(
        "changePixels"
    ).textContent =
        Number(
            result.change_pixels
        ).toLocaleString();


    document.getElementById(
        "totalPixels"
    ).textContent =
        Number(
            result.total_pixels
        ).toLocaleString();


    document.getElementById(
        "threshold"
    ).textContent =
        Number(
            result.threshold
        ).toFixed(2);


    document.getElementById(
        "resultSummary"
    ).textContent =
        `${t1.name} — temporal comparison completed by the GeoSentinel AI change detection model.`;


    createChangeMap(
        result.change_map
    );


    const percentage =
        result.change_percentage;


    let interpretation;


    if (percentage < 1) {

        interpretation =
            "Minimal spatial change detected. " +
            "The selected area remains largely stable " +
            "between the two observations.";

    } else if (percentage < 10) {

        interpretation =
            "Localized change detected. " +
            "The model identifies spatial changes that " +
            "may indicate early-stage urban development " +
            "or land-cover transformation.";

    } else {

        interpretation =
            "Significant spatial change detected. " +
            "The detected pattern is consistent with " +
            "substantial land-cover transformation and " +
            "possible urban expansion between T1 and T2.";
    }


    document.getElementById(
        "interpretationText"
    ).textContent =
        interpretation;
}


// ============================================================
// CHANGE MAP
// ============================================================

function createChangeMap(changeMap) {

    const canvas =
        document.getElementById(
            "changeCanvas"
        );

    const ctx =
        canvas.getContext("2d");


    const width =
        changeMap[0].length;

    const height =
        changeMap.length;


    canvas.width = width;
    canvas.height = height;


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


            if (
                changeMap[y][x] >= 1
            ) {

                // Change pixels
                image.data[index] = 255;
                image.data[index + 1] = 90;
                image.data[index + 2] = 70;
                image.data[index + 3] = 255;

            } else {

                // Stable pixels
                image.data[index] = 10;
                image.data[index + 1] = 30;
                image.data[index + 2] = 25;
                image.data[index + 3] = 255;
            }
        }
    }


    ctx.putImageData(
        image,
        0,
        0
    );


    document.getElementById(
        "mapLoading"
    ).style.display =
        "none";
}


// ============================================================
// NEW ANALYSIS
// ============================================================

newAnalysisBtn.addEventListener(
    "click",
    () => {

        document.getElementById(
            "mapLoading"
        ).style.display =
            "grid";

        showPage(1);
    }
);
