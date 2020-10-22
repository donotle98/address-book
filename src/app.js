require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const helmet = require("helmet");
const { NODE_ENV } = require("./config");
const STORE = require("./store");
const { v4: uuidv4 } = require("uuid");
const logger = require("./logger");
const app = express();
const bodyParser = express.json();

const morganOption = NODE_ENV === "production";

app.use(morgan(morganOption));
app.use(helmet());
app.use(cors());

function validateBearerToken(req, res, next) {
    const apiToken = process.env.API_TOKEN;
    const authToken = req.get("Authorization");

    if (!authToken || authToken.split(" ")[1] !== apiToken) {
        logger.error(`Unauthorized request to path: ${req.path}`);
        return res.status(401).json({ error: "Unauthorized request" });
    }
    // move to the next middleware
    next();
}
app.get("/", (req, res) => {
    res.send("Hello, boilerplate!");
});

app.get("/address", (req, res) => {
    res.status(200).json(STORE);
});

app.post("/address", bodyParser, validateBearerToken, (req, res) => {
    const {
        firstName,
        lastName,
        address1,
        address2,
        city,
        state,
        zip,
    } = req.body;
    let id = uuidv4();

    if (!firstName) {
        logger.error("FIRST NAME WAS NOT INPUTTED");
        res.status(400).send("FIRST NAME IS REQUIRED");
    }
    if (!lastName) {
        logger.error("LAST NAME WAS NOT INPUTTED");
        res.status(400).send("LAST NAME IS REQUIRED");
    }
    if (!address1) {
        logger.error("ADDRESS WAS NOT INPUTTED");
        res.status(400).send("ADDRESS IS REQUIRED");
    }
    if (!city) {
        logger.error("CITY WAS NOT INPUTTED");
        res.status(400).send("CITY IS REQUIRED");
    }
    if (!state) {
        logger.error("STATE WAS NOT INPUTTED");
        res.status(400).send("STATE ABBREVIATION IS REQUIRED");
    } else if (state.length !== 2) {
        logger.error("STATE WAS NOT ABBREVIATED");
        res.status(400).send("STATE MUST BE ABBREVIATED");
    }
    if (!zip.toString()) {
        logger.error("ZIP WAS NOT INPUTTED");
        res.status(400).send("ZIP IS REQUIRED");
    } else if (zip.toString().length !== 5) {
        logger.error("ZIP WAS NOT INPUTTED AS A 5 DIGIT INTEGER");
        res.status(400).send("ZIP CODE MUST BE 5 INTEGERS");
    }

    const person = {
        id,
        firstName,
        lastName,
        address1,
        address2,
        city,
        state,
        zip,
    };

    STORE.push(person);

    logger.info(`Person with ${id} has been made`);

    res.status(200).json(STORE);
});

app.delete("/address/:id", validateBearerToken, (req, res) => {
    let { id } = req.params;

    const addressIndex = STORE.findIndex((x) => x.id == id);

    if (addressIndex === -1) {
        logger.error(`Address ${id} not found`);
        return res.status(400).send("ADDRESS NOT FOUND");
    }

    STORE.splice(addressIndex, 1);

    logger.info(`Address with ${id} id has been deleted`);

    res.status(200).json(STORE);
});

app.use(function errorHandler(error, req, res, next) {
    let response;
    if (NODE_ENV === "production") {
        response = { error: { message: "server error" } };
    } else {
        console.error(error);
        response = { message: error.message, error };
    }
    res.status(500).json(response);
});

module.exports = app;
