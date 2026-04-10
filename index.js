import express from "express";
const app = express();

app.use(express.json());
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept",
  );

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

async function processName(name) {
  const res = await fetch(`https://api.genderize.io?name=${name}`);
  const data = await res.json();
  return data;
}

app.get("/api/classify", async (req, res) => {
  try {
    const data = req.query.name;

    if (!data) {
      return res
        .status(400)
        .json({ status: "error", message: "Missing or empty name parameter" });
    }

    if (typeof data !== "string") {
      return res
        .status(422)
        .json({ status: "error", message: "name is not a string" });
    }

    const {
      name,
      gender,
      probability,
      count: sample_size,
    } = await processName(data);
    const is_confident = probability >= 0.7 && sample_size >= 100;

    if (gender === null || sample_size === 0) {
      res.status(422).json({
        status: "error",
        message: "No prediction available for the provided name",
      });
    }

    res.status(200).json({
      status: "success",
      data: {
        name,
        gender,
        probability,
        is_confident,
        sample_size,
        processed_at: new Date().toISOString(),
      },
    });
  } catch (e) {
    res
      .status(500)
      .json({ status: "error", message: "Upstream or server failure" });
  }
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
