const mongoose = require("mongoose");
const initData = require("./data.js");
const { Listing } = require("../models/listing.js");

const mongoURL = "mongodb://127.0.0.1:27017/wanderlust";

main().then(() => {
    console.log("connected to DB");
}).catch(err => {
    console.log(err);
});

async function main() {
    await mongoose.connect(mongoURL);
}

const initDB = async () => {
    try {
        await Listing.deleteMany({});
        const sampleData = initData.data.map((obj) => ({
            ...obj,
            owner: "66b7e2ae3bc70502d90317af",
            geometry: {
                type: "Point",
                coordinates: obj.geometry ? obj.geometry.coordinates : [0, 0]
            }
        }));
        await Listing.insertMany(sampleData);
        console.log("Data was initialized");
    } catch (err) {
        console.error("Error initializing data:", err);
    }
};

initDB();
