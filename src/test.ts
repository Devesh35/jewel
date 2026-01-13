import { connectMongo, disconnectMongo } from "./core/db";

const run = async () => {
  await connectMongo();
  await disconnectMongo();
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
