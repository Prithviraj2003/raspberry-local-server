const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const path = require("path");
const PROTO_PATH = path.join(__dirname, "../server.proto");
const packageDefinition = protoLoader.loadSync(PROTO_PATH);
const proto = grpc.loadPackageDefinition(packageDefinition);
const dotenv = require("dotenv");
dotenv.config();
// Create a gRPC client
const client = new proto.EntryService(
  process.env.GRPC_SERVER_URL ,
  grpc.credentials.createInsecure()
);
module.exports = client;
