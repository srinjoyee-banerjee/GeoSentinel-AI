```python
# ============================================================
# GEOSENTINEL AI
# PRODUCTION FLASK BACKEND
# ============================================================

import os
import json
import numpy as np
import tensorflow as tf

from flask import (
    Flask,
    request,
    jsonify,
    send_from_directory
)

from flask_cors import CORS
from tensorflow.keras import layers, Model


# ============================================================
# APPLICATION PATHS
# ============================================================

BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

FRONTEND_DIR = os.path.join(
    BASE_DIR,
    "frontend"
)

ASSETS_DIR = os.path.join(
    BASE_DIR,
    "assets"
)

MODEL_DIR = os.path.join(
    BASE_DIR,
    "model"
)

CONFIG_DIR = os.path.join(
    BASE_DIR,
    "config"
)

DEMO_DIR = os.path.join(
    BASE_DIR,
    "demo"
)


# ============================================================
# APPLICATION
# ============================================================

app = Flask(
    __name__,
    static_folder=FRONTEND_DIR,
    static_url_path=""
)

CORS(app)


# ============================================================
# MODEL PATHS
# ============================================================

MODEL_PATH = os.path.join(
    MODEL_DIR,
    "GeoSentinel_best_model.weights.h5"
)

MODEL_CONFIG_PATH = os.path.join(
    CONFIG_DIR,
    "GeoSentinel_model_config.json"
)

INFERENCE_CONFIG_PATH = os.path.join(
    CONFIG_DIR,
    "GeoSentinel_inference_config.json"
)


# ============================================================
# LOAD CONFIGURATION
# ============================================================

if not os.path.exists(
    MODEL_CONFIG_PATH
):

    raise FileNotFoundError(
        f"Model config not found: {MODEL_CONFIG_PATH}"
    )


if not os.path.exists(
    INFERENCE_CONFIG_PATH
):

    raise FileNotFoundError(
        f"Inference config not found: {INFERENCE_CONFIG_PATH}"
    )


with open(
    MODEL_CONFIG_PATH,
    "r"
) as f:

    MODEL_CONFIG = json.load(f)


with open(
    INFERENCE_CONFIG_PATH,
    "r"
) as f:

    INFERENCE_CONFIG = json.load(f)


THRESHOLD = float(
    INFERENCE_CONFIG.get(
        "threshold",
        0.60
    )
)


# ============================================================
# MODEL
# ============================================================

def build_shared_encoder():

    encoder_input = layers.Input(
        shape=(256, 256, 13),
        name="encoder_input"
    )

    # --------------------------------------------------------
    # Encoder Level 1
    # --------------------------------------------------------

    x1 = layers.Conv2D(
        32,
        3,
        padding="same",
        activation="relu",
        name="enc_l1_conv1"
    )(encoder_input)

    x1 = layers.BatchNormalization(
        name="enc_l1_bn1"
    )(x1)

    x1 = layers.Conv2D(
        32,
        3,
        padding="same",
        activation="relu",
        name="enc_l1_conv2"
    )(x1)

    x1 = layers.BatchNormalization(
        name="enc_l1_bn2"
    )(x1)

    p1 = layers.MaxPooling2D(
        name="enc_pool1"
    )(x1)

    # --------------------------------------------------------
    # Encoder Level 2
    # --------------------------------------------------------

    x2 = layers.Conv2D(
        64,
        3,
        padding="same",
        activation="relu",
        name="enc_l2_conv1"
    )(p1)

    x2 = layers.BatchNormalization(
        name="enc_l2_bn1"
    )(x2)

    x2 = layers.Conv2D(
        64,
        3,
        padding="same",
        activation="relu",
        name="enc_l2_conv2"
    )(x2)

    x2 = layers.BatchNormalization(
        name="enc_l2_bn2"
    )(x2)

    p2 = layers.MaxPooling2D(
        name="enc_pool2"
    )(x2)

    # --------------------------------------------------------
    # Encoder Level 3
    # --------------------------------------------------------

    x3 = layers.Conv2D(
        128,
        3,
        padding="same",
        activation="relu",
        name="enc_l3_conv1"
    )(p2)

    x3 = layers.BatchNormalization(
        name="enc_l3_bn1"
    )(x3)

    x3 = layers.Conv2D(
        128,
        3,
        padding="same",
        activation="relu",
        name="enc_l3_conv2"
    )(x3)

    x3 = layers.BatchNormalization(
        name="enc_l3_bn2"
    )(x3)

    p3 = layers.MaxPooling2D(
        name="enc_pool3"
    )(x3)

    return Model(
        inputs=encoder_input,
        outputs=[
            x1,
            x2,
            x3,
            p3
        ],
        name="Shared_Sentinel_Encoder"
    )


def build_model():

    encoder = build_shared_encoder()

    # --------------------------------------------------------
    # Inputs
    # --------------------------------------------------------

    t1_input = layers.Input(
        shape=(256, 256, 13),
        name="T1_input"
    )

    t2_input = layers.Input(
        shape=(256, 256, 13),
        name="T2_input"
    )

    # --------------------------------------------------------
    # Shared encoder
    # --------------------------------------------------------

    t1 = encoder(t1_input)

    t2 = encoder(t2_input)

    t1_1, t1_2, t1_3, t1_p3 = t1

    t2_1, t2_2, t2_3, t2_p3 = t2

    # --------------------------------------------------------
    # Deep difference
    # --------------------------------------------------------

    diff3 = layers.Lambda(
        lambda z:
            tf.abs(
                z[0] - z[1]
            ),
        name="difference_deep"
    )([
        t1_p3,
        t2_p3
    ])

    # --------------------------------------------------------
    # Bottleneck
    # --------------------------------------------------------

    x = layers.Conv2D(
        256,
        3,
        padding="same",
        activation="relu",
        name="bottleneck_conv1"
    )(diff3)

    x = layers.BatchNormalization(
        name="bottleneck_bn1"
    )(x)

    x = layers.Conv2D(
        256,
        3,
        padding="same",
        activation="relu",
        name="bottleneck_conv2"
    )(x)

    x = layers.BatchNormalization(
        name="bottleneck_bn2"
    )(x)

    # --------------------------------------------------------
    # Decoder Level 3
    # --------------------------------------------------------

    x = layers.UpSampling2D(
        (2, 2),
        name="decoder_up3"
    )(x)

    skip3 = layers.Lambda(
        lambda z:
            tf.abs(
                z[0] - z[1]
            ),
        name="difference_skip3"
    )([
        t1_3,
        t2_3
    ])

    x = layers.Concatenate(
        name="decoder_concat3"
    )([
        x,
        skip3
    ])

    x = layers.Conv2D(
        128,
        3,
        padding="same",
        activation="relu",
        name="decoder_l3_conv1"
    )(x)

    x = layers.BatchNormalization(
        name="decoder_l3_bn1"
    )(x)

    x = layers.Conv2D(
        128,
        3,
        padding="same",
        activation="relu",
        name="decoder_l3_conv2"
    )(x)

    x = layers.BatchNormalization(
        name="decoder_l3_bn2"
    )(x)

    # --------------------------------------------------------
    # Decoder Level 2
    # --------------------------------------------------------

    x = layers.UpSampling2D(
        (2, 2),
        name="decoder_up2"
    )(x)

    skip2 = layers.Lambda(
        lambda z:
            tf.abs(
                z[0] - z[1]
            ),
        name="difference_skip2"
    )([
        t1_2,
        t2_2
    ])

    x = layers.Concatenate(
        name="decoder_concat2"
    )([
        x,
        skip2
    ])

    x = layers.Conv2D(
        64,
        3,
        padding="same",
        activation="relu",
        name="decoder_l2_conv1"
    )(x)

    x = layers.BatchNormalization(
        name="decoder_l2_bn1"
    )(x)

    x = layers.Conv2D(
        64,
        3,
        padding="same",
        activation="relu",
        name="decoder_l2_conv2"
    )(x)

    x = layers.BatchNormalization(
        name="decoder_l2_bn2"
    )(x)

    # --------------------------------------------------------
    # Decoder Level 1
    # --------------------------------------------------------

    x = layers.UpSampling2D(
        (2, 2),
        name="decoder_up1"
    )(x)

    skip1 = layers.Lambda(
        lambda z:
            tf.abs(
                z[0] - z[1]
            ),
        name="difference_skip1"
    )([
        t1_1,
        t2_1
    ])

    x = layers.Concatenate(
        name="decoder_concat1"
    )([
        x,
        skip1
    ])

    x = layers.Conv2D(
        32,
        3,
        padding="same",
        activation="relu",
        name="decoder_l1_conv1"
    )(x)

    x = layers.BatchNormalization(
        name="decoder_l1_bn1"
    )(x)

    x = layers.Conv2D(
        32,
        3,
        padding="same",
        activation="relu",
        name="decoder_l1_conv2"
    )(x)

    x = layers.BatchNormalization(
        name="decoder_l1_bn2"
    )(x)

    # --------------------------------------------------------
    # Output
    # --------------------------------------------------------

    output = layers.Conv2D(
        1,
        1,
        activation="sigmoid",
        name="change_probability"
    )(x)

    return Model(
        inputs=[
            t1_input,
            t2_input
        ],
        outputs=output,
        name="GeoSentinel_AI"
    )


# ============================================================
# LOAD MODEL
# ============================================================

print("=" * 60)
print("GEOSENTINEL AI")
print("Starting production backend...")
print("=" * 60)

print("Loading GeoSentinel AI model...")


if not os.path.exists(
    MODEL_PATH
):

    raise FileNotFoundError(
        f"Model not found: {MODEL_PATH}"
    )


model = build_model()

model.load_weights(
    MODEL_PATH
)

print(
    "GeoSentinel AI loaded successfully."
)

print(
    "Parameters:",
    model.count_params()
)


# ============================================================
# FRONTEND
# ============================================================

@app.route("/")
def home():

    return send_from_directory(
        FRONTEND_DIR,
        "index.html"
    )


@app.route(
    "/<path:path>"
)
def frontend_files(path):

    return send_from_directory(
        FRONTEND_DIR,
        path
    )


# ============================================================
# ASSETS
# ============================================================

@app.route(
    "/assets/<path:filename>",
    methods=["GET"]
)
def asset_file(filename):

    return send_from_directory(
        ASSETS_DIR,
        filename
    )


# ============================================================
# HEALTH
# ============================================================

@app.route(
    "/health"
)
def health():

    return jsonify({

        "status":
            "healthy",

        "model_loaded":
            True
    })


# ============================================================
# MODEL INFO
# ============================================================

@app.route(
    "/model-info"
)
def model_info():

    return jsonify({

        "name":
            "GeoSentinel AI",

        "architecture":
            "TRUE SHARED-WEIGHT SIAMESE U-NET",

        "parameters":
            int(
                model.count_params()
            ),

        "input_shape":
            [
                256,
                256,
                13
            ],

        "output_shape":
            [
                256,
                256,
                1
            ],

        "threshold":
            THRESHOLD
    })


# ============================================================
# DEMO FILES
# ============================================================

@app.route(
    "/demo/<path:filename>",
    methods=["GET"]
)
def demo_file(filename):

    return send_from_directory(
        DEMO_DIR,
        filename
    )


# ============================================================
# SHARED VALIDATION
# ============================================================

def validate_tensor(
    tensor,
    name
):

    expected = (
        256,
        256,
        13
    )

    if not isinstance(
        tensor,
        list
    ):

        raise ValueError(
            f"{name} must be a nested list."
        )

    array = np.asarray(
        tensor,
        dtype=np.float32
    )

    if array.shape != expected:

        raise ValueError(
            f"Invalid {name} shape. "
            f"Received {list(array.shape)}, "
            f"expected {list(expected)}."
        )

    if not np.all(
        np.isfinite(array)
    ):

        raise ValueError(
            f"{name} contains invalid numeric values."
        )

    return array


# ============================================================
# PREDICT
#
# FRONTEND ENDPOINT
#
# Receives:
#
# {
#     "t1": [[[...13...]]],
#     "t2": [[[...13...]]]
# }
#
# Returns:
#
# change_percentage
# change_pixels
# total_pixels
# threshold
# change_map
# probability_map
# ============================================================

@app.route(
    "/predict",
    methods=["POST"]
)
def predict():

    try:

        data = request.get_json(
            silent=True
        )

        if not data:

            return jsonify({

                "status":
                    "error",

                "message":
                    "Request body is empty or invalid JSON."
            }), 400


        if "t1" not in data:

            return jsonify({

                "status":
                    "error",

                "message":
                    "Missing T1 data."
            }), 400


        if "t2" not in data:

            return jsonify({

                "status":
                    "error",

                "message":
                    "Missing T2 data."
            }), 400


        # ====================================================
        # VALIDATE T1
        # ====================================================

        t1 = validate_tensor(
            data["t1"],
            "T1"
        )


        # ====================================================
        # VALIDATE T2
        # ====================================================

        t2 = validate_tensor(
            data["t2"],
            "T2"
        )


        # ====================================================
        # ADD BATCH DIMENSION
        # ====================================================

        t1 = np.expand_dims(
            t1,
            axis=0
        )

        t2 = np.expand_dims(
            t2,
            axis=0
        )


        # ====================================================
        # MODEL INFERENCE
        # ====================================================

        probability = model.predict(
            [
                t1,
                t2
            ],
            verbose=0
        )


        # ====================================================
        # PROBABILITY MAP
        # ====================================================

        probability_map = (
            probability[0, :, :, 0]
        )


        # ====================================================
        # BINARY CHANGE MASK
        # ====================================================

        change_map = (
            probability_map >= THRESHOLD
        ).astype(
            np.uint8
        )


        # ====================================================
        # STATISTICS
        # ====================================================

        changed_pixels = int(
            change_map.sum()
        )

        total_pixels = int(
            change_map.size
        )

        change_percentage = float(
            change_map.mean() * 100
        )


        # ====================================================
        # RESPONSE
        # ====================================================

        return jsonify({

            "status":
                "success",

            "threshold":
                THRESHOLD,

            "shape":
                [
                    256,
                    256
                ],

            "change_pixels":
                changed_pixels,

            "total_pixels":
                total_pixels,

            "change_percentage":
                change_percentage,

            "probability_min":
                float(
                    probability_map.min()
                ),

            "probability_max":
                float(
                    probability_map.max()
                ),

            "probability_map":
                probability_map.tolist(),

            "change_map":
                change_map.tolist()
        })


    except ValueError as e:

        print(
            "Validation error:",
            str(e)
        )

        return jsonify({

            "status":
                "error",

            "message":
                str(e)
        }), 400


    except Exception as e:

        print(
            "Prediction error:",
            str(e)
        )

        return jsonify({

            "status":
                "error",

            "message":
                str(e)
        }), 500


# ============================================================
# PREDICT NPY
# ============================================================

@app.route(
    "/predict-npy",
    methods=["POST"]
)
def predict_npy():

    try:

        if "t1" not in request.files:

            return jsonify({

                "status":
                    "error",

                "message":
                    "Missing T1 .npy file."
            }), 400


        if "t2" not in request.files:

            return jsonify({

                "status":
                    "error",

                "message":
                    "Missing T2 .npy file."
            }), 400


        t1 = np.load(
            request.files["t1"],
            allow_pickle=False
        ).astype(
            np.float32
        )


        t2 = np.load(
            request.files["t2"],
            allow_pickle=False
        ).astype(
            np.float32
        )


        if t1.ndim == 3:

            t1 = np.expand_dims(
                t1,
                axis=0
            )


        if t2.ndim == 3:

            t2 = np.expand_dims(
                t2,
                axis=0
            )


        expected = (
            256,
            256,
            13
        )


        if tuple(
            t1.shape[1:]
        ) != expected:

            return jsonify({

                "status":
                    "error",

                "message":
                    "Invalid T1 shape.",

                "received":
                    list(
                        t1.shape
                    ),

                "expected":
                    [
                        1,
                        256,
                        256,
                        13
                    ]
            }), 400


        if tuple(
            t2.shape[1:]
        ) != expected:

            return jsonify({

                "status":
                    "error",

                "message":
                    "Invalid T2 shape.",

                "received":
                    list(
                        t2.shape
                    ),

                "expected":
                    [
                        1,
                        256,
                        256,
                        13
                    ]
            }), 400


        if (
            t1.shape[0] != 1
            or
            t2.shape[0] != 1
        ):

            return jsonify({

                "status":
                    "error",

                "message":
                    "Upload one T1 scene and one T2 scene."
            }), 400


        # ====================================================
        # INFERENCE
        # ====================================================

        probability = model.predict(
            [
                t1,
                t2
            ],
            verbose=0
        )


        probability_map = (
            probability[0, ..., 0]
        )


        change_map = (
            probability_map >= THRESHOLD
        ).astype(
            np.uint8
        )


        return jsonify({

            "status":
                "success",

            "threshold":
                THRESHOLD,

            "shape":
                [
                    256,
                    256
                ],

            "probability_min":
                float(
                    probability_map.min()
                ),

            "probability_max":
                float(
                    probability_map.max()
                ),

            "change_pixels":
                int(
                    change_map.sum()
                ),

            "total_pixels":
                int(
                    change_map.size
                ),

            "change_percentage":
                float(
                    change_map.mean() * 100
                ),

            "probability_map":
                probability_map.tolist(),

            "change_map":
                change_map.tolist()
        })


    except Exception as e:

        print(
            "NPY prediction error:",
            str(e)
        )

        return jsonify({

            "status":
                "error",

            "message":
                str(e)
        }), 500


# ============================================================
# API STATUS
# ============================================================

@app.route(
    "/api/status"
)
def api_status():

    return jsonify({

        "service":
            "GeoSentinel AI",

        "status":
            "online",

        "model_loaded":
            True,

        "parameters":
            int(
                model.count_params()
            ),

        "threshold":
            THRESHOLD
    })


# ============================================================
# LOCAL ENTRY
# ============================================================

if __name__ == "__main__":

    port = int(
        os.environ.get(
            "PORT",
            10000
        )
    )

    app.run(
        host="0.0.0.0",
        port=port
    )
```
