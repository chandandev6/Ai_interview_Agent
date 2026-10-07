// saare tests se pehle EK BAAR: RAM me MongoDB start karo. Replica set isliye — credits/payment MongoDB transactions
// use karte hai, aur transactions sirf replica set par chalte hai (Atlas bhi replica set hai)
import { MongoMemoryReplSet } from "mongodb-memory-server";

export default async function setup({ provide }) {
    const replSet = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: "wiredTiger" } });
    provide("mongoUri", replSet.getUri("interviewiq-test"));
    // saare tests ke baad DB band (RAM free)
    return () => replSet.stop();
}
