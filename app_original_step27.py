# ============================================================
# GEOSENTINEL AI
# RENDER PRODUCTION FLASK BACKEND
# ============================================================

import os
import json
import numpy as np
import tensorflow as tf

from flask import (
    Flask,
    request,
    jsonify
)

from flask_cors import CORS

from tensorflow.keras import layers, Model


# ============================================================
# APPLICATION
# ============================================================

app = Flask(__name__)
CORS(app)


# ============================================================
# PATHS
# ============================================================

BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

MODEL_DIR = os.path.join(
    BASE_DIR,
    "model"
)

CONFIG_DIR = os.path.join(
    BASE_DIR,
    "config"
)

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
# SHARED ENCODER
# ============================================================

def build_shared_encoder():

    encoder_input = layers.Input(
        shape=(256, 256, 13),
        name="encoder_input"
    )

    # LEVEL 1

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


    # LEVEL 2

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


    # LEVEL 3

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


# ============================================================
# BUILD EXACT GEOSENTINEL MODEL
# ============================================================

def build_model():

    shared_encoder = build_shared_encoder()


    input_t1 = layers.Input(
        shape=(256, 256, 13),
        name="T1_input"
    )

    input_t2 = layers.Input(
        shape=(256, 256, 13),
        name="T2_input"
    )


    t1_features = shared_encoder(
        input_t1
    )

    t2_features = shared_encoder(
        input_t2
    )


    t1_1, t1_2, t1_3, t1_p3 = t1_features
    t2_1, t2_2, t2_3, t2_p3 = t2_features


    # --------------------------------------------------------
    # TEMPORAL DIFFERENCE
    # --------------------------------------------------------

    diff3 = layers.Lambda(
        lambda z: tf.abs(
            z[0] - z[1]
        ),
        name="difference_deep"
    )(
        [t1_p3, t2_p3]
    )


    # --------------------------------------------------------
    # BOTTLENECK
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
    # DECODER LEVEL 3
    # --------------------------------------------------------

    x = layers.UpSampling2D(
        size=(2, 2),
        name="decoder_up3"
    )(x)

    skip3 = layers.Lambda(
        lambda z: tf.abs(
            z[0] - z[1]
        ),
        name="difference_skip3"
    )(
        [t1_3, t2_3]
    )

    x = layers.Concatenate(
        name="decoder_concat3"
    )(
        [x, skip3]
    )

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
    # DECODER LEVEL 2
    # --------------------------------------------------------

    x = layers.UpSampling2D(
        size=(2, 2),
        name="decoder_up2"
    )(x)

    skip2 = layers.Lambda(
        lambda z: tf.abs(
            z[0] - z[1]
        ),
        name="difference_skip2"
    )(
        [t1_2, t2_2]
    )

    x = layers.Concatenate(
        name="decoder_concat2"
    )(
        [x, skip2]
    )

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
    # DECODER LEVEL 1
    # --------------------------------------------------------

    x = layers.UpSampling2D(
        size=(2, 2),
        name="decoder_up1"
    )(x)

    skip1 = layers.Lambda(
        lambda z: tf.abs(
            z[0] - z[1]
        ),
        name="difference_skip1"
    )(
        [t1_1, t2_1]
    )

    x = layers.Concatenate(
        name="decoder_concat1"
    )(
        [x, skip1]
    )

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
    # OUTPUT
    # --------------------------------------------------------

    output = layers.Conv2D(
        1,
        kernel_size=1,
        activation="sigmoid",
        name="change_probability"
    )(x)


    return Model(
        inputs=[
            input_t1,
            input_t2
        ],
        outputs=output,
        name="GeoSentinel_AI"
    )


# ============================================================
# LOAD MODEL ONCE
# ============================================================

print("Loading GeoSentinel AI model...")

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
# HEALTH ENDPOINT
# ============================================================

@app.route(
    "/",
    methods=["GET"]
)
def home():

    return jsonify({
        "service": "GeoSentinel AI",
        "status": "online",
        "model": "TRUE SHARED-WEIGHT SIAMESE U-NET",
        "parameters": int(
            model.count_params()
        ),
        "input_shape": [
            256,
            256,
            13
        ],
        "output_shape": [
            256,
            256,
            1
        ],
        "threshold": THRESHOLD
    })


# ============================================================
# HEALTH CHECK
# ============================================================

@app.route(
    "/health",
    methods=["GET"]
)
def health():

    return jsonify({
        "status": "healthy",
        "model_loaded": True
    })


# ============================================================
# MODEL INFORMATION
# ============================================================

@app.route(
    "/model-info",
    methods=["GET"]
)
def model_info():

    return jsonify({
        "name": "GeoSentinel AI",
        "architecture":
            "TRUE SHARED-WEIGHT SIAMESE U-NET",
        "parameters":
            int(model.count_params()),
        "input_shape":
            [256, 256, 13],
        "output_shape":
            [256, 256, 1],
        "threshold":
            THRESHOLD
    })


# ============================================================
# CHANGE DETECTION
# ============================================================

@app.route(
    "/predict",
    methods=["POST"]
)
def predict():

    try:

        data = request.get_json()

        if data is None:
            return jsonify({
                "error":
                    "Request body must contain JSON."
            }), 400


        if "t1" not in data:
            return jsonify({
                "error":
                    "Missing T1 input."
            }), 400


        if "t2" not in data:
            return jsonify({
                "error":
                    "Missing T2 input."
            }), 400


        t1 = np.asarray(
            data["t1"],
            dtype=np.float32
        )

        t2 = np.asarray(
            data["t2"],
            dtype=np.float32
        )


        # ----------------------------------------------------
        # ACCEPT SINGLE IMAGE OR BATCH
        # ----------------------------------------------------

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


        # ----------------------------------------------------
        # VERIFY INPUT
        # ----------------------------------------------------

        expected = (
            256,
            256,
            13
        )

        if tuple(t1.shape[1:]) != expected:

            return jsonify({
                "error":
                    "Invalid T1 shape.",
                "received":
                    list(t1.shape),
                "expected":
                    [1, 256, 256, 13]
            }), 400


        if tuple(t2.shape[1:]) != expected:

            return jsonify({
                "error":
                    "Invalid T2 shape.",
                "received":
                    list(t2.shape),
                "expected":
                    [1, 256, 256, 13]
            }), 400


        if t1.shape[0] != t2.shape[0]:

            return jsonify({
                "error":
                    "T1 and T2 batch sizes differ."
            }), 400


        # ----------------------------------------------------
        # INFERENCE
        # ----------------------------------------------------

        probability = model.predict(
            [t1, t2],
            verbose=0
        )


        prediction = (
            probability >= THRESHOLD
        ).astype(
            np.uint8
        )


        # ----------------------------------------------------
        # RESPONSE
        # ----------------------------------------------------

        return jsonify({

            "status": "success",

            "threshold":
                THRESHOLD,

            "probability_min":
                float(
                    probability.min()
                ),

            "probability_max":
                float(
                    probability.max()
                ),

            "change_pixels":
                int(
                    prediction.sum()
                ),

            "total_pixels":
                int(
                    prediction.size
                ),

            "change_percentage":
                float(
                    prediction.mean() * 100
                ),

            "probability_map":
                probability[
                    0,
                    ...,
                    0
                ].tolist(),

            "change_map":
                prediction[
                    0,
                    ...,
                    0
                ].tolist()
        })


    except Exception as e:

        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


# ============================================================
# RENDER ENTRY POINT
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